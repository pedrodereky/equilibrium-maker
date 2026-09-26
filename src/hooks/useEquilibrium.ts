/**
 * Máquina de estados do Equilíbrium.
 *
 * Regra de ouro: o jogo NUNCA rebalanceia sozinho. Toda a inteligência da AVL
 * vem de src/lib/avl.ts — aqui só há o fluxo da rodada, pontuação e animação.
 */

import { useCallback, useEffect, useMemo, useReducer } from "react";

import {
  applyCorrection,
  assertTreeIsSound,
  classifyCase,
  correctionSteps,
  explainCase,
  explainWrongNode,
  findCriticalNode,
  height,
  insertBST,
  preOrder,
  ROTATION_LABELS,
  type AVLNode,
  type RotationCase,
} from "@/lib/avl";
import { sequenciaDaFase, type Level } from "@/data/levels";
import { tocar, type EfeitoSonoro } from "@/lib/som";

export const PONTOS_NO_CRITICO = 100;
export const PONTOS_ROTACAO = 100;
export const COMBO_PARA_MULTIPLICAR = 3;
export const MULTIPLICADOR_DE_COMBO = 2;
export const BONUS_POR_SEGUNDO = 5;

export type GameStatus =
  | "carregando"
  | "preparando"
  | "descendo"
  | "escolher-no"
  | "escolher-rotacao"
  | "rotacionando"
  | "vitoria"
  | "derrota";

export type TomDoAviso = "acerto" | "erro" | "alerta" | "info";

export interface Aviso {
  readonly id: number;
  readonly tom: TomDoAviso;
  readonly titulo: string;
  readonly texto: string;
}

export interface GameState {
  readonly level: Level;
  readonly sequencia: readonly number[];
  readonly cursor: number;
  /** Árvore AVL exibida na tela. */
  readonly arvore: AVLNode | null;
  /** Resultado da inserção em curso, aplicado ao fim da animação de descida. */
  readonly arvorePendente: AVLNode | null;
  /** BST comum montada com as mesmas chaves, para o painel "Sem AVL". */
  readonly bst: AVLNode | null;
  readonly caminho: readonly number[];
  readonly passoCaminho: number;
  readonly chaveEmTransito: number | null;
  readonly ultimaInserida: number | null;
  readonly noCritico: number | null;
  readonly casoEsperado: RotationCase | null;
  readonly noSelecionado: number | null;
  readonly noErrado: number | null;
  readonly etapasPendentes: readonly AVLNode[];
  readonly totalEtapasRotacao: number;
  readonly status: GameStatus;
  readonly estabilidade: number;
  readonly pontuacao: number;
  readonly combo: number;
  readonly melhorCombo: number;
  readonly acertos: number;
  readonly erros: number;
  readonly fbRevelado: boolean;
  readonly aviso: Aviso | null;
  readonly tremor: number;
  readonly tempoRestante: number | null;
  readonly desmoronou: boolean;
  /** Efeito sonoro que a última transição pede. O reducer só o declara; quem toca é o hook. */
  readonly som: { readonly id: number; readonly efeito: EfeitoSonoro } | null;
  readonly proximoAvisoId: number;
  readonly proximoSomId: number;
}

export type GameAction =
  | { readonly type: "iniciar"; readonly sequencia: readonly number[] }
  | { readonly type: "inserir" }
  | { readonly type: "avancar-caminho" }
  | { readonly type: "clicar-no"; readonly chave: number }
  | { readonly type: "escolher-rotacao"; readonly rotacao: RotationCase }
  | { readonly type: "proxima-etapa-rotacao" }
  | { readonly type: "tique" }
  | { readonly type: "revelar-fb" }
  | { readonly type: "limpar-no-errado" };

/** Estado antes de a fila ser sorteada. Exportado para os testes. */
export function criarEstadoInicial(level: Level): GameState {
  return {
    level,
    sequencia: [],
    cursor: 0,
    arvore: null,
    arvorePendente: null,
    bst: null,
    caminho: [],
    passoCaminho: 0,
    chaveEmTransito: null,
    ultimaInserida: null,
    noCritico: null,
    casoEsperado: null,
    noSelecionado: null,
    noErrado: null,
    etapasPendentes: [],
    totalEtapasRotacao: 0,
    status: "carregando",
    estabilidade: level.estabilidade,
    pontuacao: 0,
    combo: 0,
    melhorCombo: 0,
    acertos: 0,
    erros: 0,
    fbRevelado: level.mostrarFB,
    aviso: null,
    tremor: 0,
    tempoRestante: null,
    desmoronou: false,
    som: null,
    proximoAvisoId: 1,
    proximoSomId: 1,
  };
}

function comAviso(
  state: GameState,
  tom: TomDoAviso,
  titulo: string,
  texto: string,
): Partial<GameState> {
  return {
    aviso: { id: state.proximoAvisoId, tom, titulo, texto },
    proximoAvisoId: state.proximoAvisoId + 1,
  };
}

function comSom(state: GameState, efeito: EfeitoSonoro): Partial<GameState> {
  return { som: { id: state.proximoSomId, efeito }, proximoSomId: state.proximoSomId + 1 };
}

/** Multiplicador vigente depois de somar mais um acerto ao combo. */
function multiplicador(comboDepois: number): number {
  return comboDepois >= COMBO_PARA_MULTIPLICAR ? MULTIPLICADOR_DE_COMBO : 1;
}

/** Desconta 1 de estabilidade, zera o combo e decide se a partida acabou. */
function registrarErro(state: GameState, titulo: string, texto: string): GameState {
  const estabilidade = state.estabilidade - 1;
  const base: GameState = {
    ...state,
    ...comAviso(state, "erro", titulo, texto),
    ...comSom(state, estabilidade > 0 ? "erro" : "derrota"),
    estabilidade,
    combo: 0,
    erros: state.erros + 1,
    noSelecionado: state.level.destacarCritico ? state.noCritico : null,
  };

  if (estabilidade > 0) {
    // Continua na mesma etapa: a rotação errada nunca é aplicada na árvore.
    return state.level.tempoPorCorrecao === null
      ? base
      : { ...base, tempoRestante: state.level.tempoPorCorrecao };
  }

  return {
    ...base,
    status: "derrota",
    desmoronou: true,
    tempoRestante: null,
    noSelecionado: null,
  };
}

/** Fim da descida: a chave entra na árvore e o desbalanceamento é diagnosticado. */
function confirmarInsercao(state: GameState): GameState {
  const arvore = state.arvorePendente;
  const chave = state.chaveEmTransito;
  if (arvore === null || chave === null) return state;

  const cursor = state.cursor + 1;
  const bst = insertBST(state.bst, chave).root;
  const noCritico = findCriticalNode(arvore, chave);

  const comum: GameState = {
    ...state,
    arvore,
    arvorePendente: null,
    bst,
    cursor,
    chaveEmTransito: null,
    ultimaInserida: chave,
    caminho: [],
    passoCaminho: 0,
    noErrado: null,
  };

  if (noCritico === null) {
    const acabou = cursor >= state.sequencia.length;
    return {
      ...comum,
      ...comAviso(
        state,
        "info",
        `Chave ${chave} inserida`,
        "Todos os nós continuam com FB em {-1, 0, +1}: a árvore segue AVL.",
      ),
      ...comSom(state, acabou ? "vitoria" : "insercao"),
      noCritico: null,
      casoEsperado: null,
      noSelecionado: null,
      status: acabou ? "vitoria" : "preparando",
    };
  }

  const casoEsperado = classifyCase(arvore, noCritico);
  const destacado = state.level.destacarCritico;

  return {
    ...comum,
    ...comAviso(
      state,
      "alerta",
      "Estrutura instável!",
      destacado
        ? `A chave ${chave} desequilibrou o nó ${noCritico}, já destacado. Escolha a rotação que o conserta.`
        : `A chave ${chave} desequilibrou a árvore. Clique no nó crítico — o mais profundo com |FB| = 2.`,
    ),
    ...comSom(state, "instavel"),
    noCritico,
    casoEsperado,
    noSelecionado: destacado ? noCritico : null,
    status: destacado ? "escolher-rotacao" : "escolher-no",
    tremor: state.tremor + 1,
    tempoRestante: state.level.tempoPorCorrecao,
  };
}

/** Fim da rotação: valida a árvore e segue para a próxima chave (ou vence). */
function finalizarCorrecao(state: GameState): GameState {
  assertTreeIsSound(state.arvore, `a correção no nó ${String(state.noCritico)}`);
  const acabou = state.cursor >= state.sequencia.length;
  return {
    ...state,
    ...(acabou ? comSom(state, "vitoria") : {}),
    etapasPendentes: [],
    totalEtapasRotacao: 0,
    noCritico: null,
    casoEsperado: null,
    noSelecionado: null,
    tempoRestante: null,
    fbRevelado: state.level.mostrarFB,
    status: acabou ? "vitoria" : "preparando",
  };
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "iniciar": {
      return {
        ...criarEstadoInicial(state.level),
        sequencia: action.sequencia,
        status: "preparando",
      };
    }

    case "inserir": {
      const chave = state.sequencia[state.cursor];
      if (chave === undefined) return state;

      const resultado = insertBST(state.arvore, chave);
      if (resultado.duplicate) {
        // Regra da AVL: chave repetida é rejeitada com aviso, sem alterar nada.
        return {
          ...state,
          ...comAviso(
            state,
            "alerta",
            `Chave ${chave} repetida`,
            "A árvore só aceita chaves únicas, então esta foi descartada.",
          ),
          ...comSom(state, "instavel"),
          cursor: state.cursor + 1,
          status: state.cursor + 1 >= state.sequencia.length ? "vitoria" : "preparando",
        };
      }

      const parcial: GameState = {
        ...state,
        arvorePendente: resultado.root,
        caminho: resultado.path,
        passoCaminho: 0,
        chaveEmTransito: chave,
        aviso: null,
        status: "descendo",
      };
      // Árvore vazia: não há comparações para animar.
      return resultado.path.length === 0 ? confirmarInsercao(parcial) : parcial;
    }

    case "avancar-caminho": {
      if (state.status !== "descendo") return state;
      if (state.passoCaminho + 1 < state.caminho.length) {
        return { ...state, ...comSom(state, "comparacao"), passoCaminho: state.passoCaminho + 1 };
      }
      return confirmarInsercao(state);
    }

    case "clicar-no": {
      if (state.status !== "escolher-no" || state.noCritico === null) return state;
      if (action.chave === state.noCritico) {
        const combo = state.combo + 1;
        return {
          ...state,
          ...comAviso(
            state,
            "acerto",
            `Nó crítico ${action.chave} identificado`,
            `É o nó mais profundo com |FB| = 2. Agora escolha a rotação. +${PONTOS_NO_CRITICO * multiplicador(combo)} pontos.`,
          ),
          ...comSom(state, "acerto"),
          pontuacao: state.pontuacao + PONTOS_NO_CRITICO * multiplicador(combo),
          combo,
          melhorCombo: Math.max(state.melhorCombo, combo),
          acertos: state.acertos + 1,
          noSelecionado: action.chave,
          noErrado: null,
          status: "escolher-rotacao",
        };
      }
      return {
        ...registrarErro(
          state,
          "Esse não é o nó crítico",
          explainWrongNode(state.arvore, action.chave, state.noCritico),
        ),
        noErrado: action.chave,
      };
    }

    case "escolher-rotacao": {
      if (state.status !== "escolher-rotacao") return state;
      const { noCritico, casoEsperado, arvore } = state;
      if (noCritico === null || casoEsperado === null || arvore === null) return state;

      if (action.rotacao !== casoEsperado) {
        return registrarErro(
          state,
          `${ROTATION_LABELS[action.rotacao]} não resolve`,
          explainCase(arvore, noCritico),
        );
      }

      const etapas = correctionSteps(arvore, noCritico, casoEsperado);
      const primeira = etapas[0];
      if (primeira === undefined) return state;

      const combo = state.combo + 1;
      const fator = multiplicador(combo);
      const bonusTempo =
        state.tempoRestante === null ? 0 : Math.max(0, state.tempoRestante) * BONUS_POR_SEGUNDO;
      const ganho = PONTOS_ROTACAO * fator + bonusTempo;

      return {
        ...state,
        ...comAviso(
          state,
          "acerto",
          `Caso ${casoEsperado} corrigido`,
          `${explainCase(arvore, noCritico)} +${ganho} pontos${bonusTempo > 0 ? ` (${bonusTempo} de bônus de tempo)` : ""}.`,
        ),
        ...comSom(state, "rotacao"),
        arvore: primeira,
        etapasPendentes: etapas.slice(1),
        totalEtapasRotacao: etapas.length,
        pontuacao: state.pontuacao + ganho,
        combo,
        melhorCombo: Math.max(state.melhorCombo, combo),
        acertos: state.acertos + 1,
        tempoRestante: null,
        status: "rotacionando",
      };
    }

    case "proxima-etapa-rotacao": {
      if (state.status !== "rotacionando") return state;
      const [proxima, ...resto] = state.etapasPendentes;
      if (proxima === undefined) return finalizarCorrecao(state);
      return { ...state, ...comSom(state, "rotacao"), arvore: proxima, etapasPendentes: resto };
    }

    case "tique": {
      if (state.tempoRestante === null) return state;
      if (state.tempoRestante > 1) {
        const restante = state.tempoRestante - 1;
        // Tique audível só na contagem final, para não virar barulho de fundo.
        return {
          ...state,
          ...(restante <= 5 ? comSom(state, "tempo") : {}),
          tempoRestante: restante,
        };
      }
      return registrarErro(
        state,
        "Tempo esgotado",
        state.noCritico === null
          ? "O relógio zerou antes da correção."
          : `O relógio zerou. ${explainCase(state.arvore, state.noCritico)}`,
      );
    }

    case "revelar-fb": {
      const custo = state.level.custoRevelarFB;
      if (custo === null || state.fbRevelado) return state;
      if (state.pontuacao < custo) {
        return {
          ...state,
          ...comAviso(
            state,
            "alerta",
            "Pontos insuficientes",
            `Revelar o FB custa ${custo} pontos e você tem ${state.pontuacao}.`,
          ),
        };
      }
      return {
        ...state,
        ...comAviso(
          state,
          "info",
          "FB revelado",
          `−${custo} pontos. O fator de balanceamento fica visível até esta correção terminar.`,
        ),
        ...comSom(state, "revelar"),
        pontuacao: state.pontuacao - custo,
        fbRevelado: true,
      };
    }

    case "limpar-no-errado":
      return state.noErrado === null ? state : { ...state, noErrado: null };

    default:
      return state;
  }
}

export interface ResumoDaPartida {
  readonly pontuacao: number;
  readonly acertos: number;
  readonly erros: number;
  readonly melhorCombo: number;
  readonly alturaAVL: number;
  readonly alturaBST: number;
  readonly chaves: number;
  readonly preOrdem: readonly number[];
}

export interface Equilibrium {
  readonly state: GameState;
  readonly resumo: ResumoDaPartida;
  readonly clicarNo: (chave: number) => void;
  readonly escolherRotacao: (rotacao: RotationCase) => void;
  readonly revelarFB: () => void;
  readonly reiniciar: () => void;
}

const DURACAO_ENTRE_CHAVES = 520;
const DURACAO_POR_COMPARACAO = 340;
const DURACAO_DA_ROTACAO = 900;

export function useEquilibrium(level: Level): Equilibrium {
  const [state, dispatch] = useReducer(reducer, level, criarEstadoInicial);

  const reiniciar = useCallback(() => {
    dispatch({ type: "iniciar", sequencia: sequenciaDaFase(level) });
  }, [level]);

  // A sequência é sorteada só no cliente: evita divergência com o HTML do servidor.
  useEffect(() => {
    reiniciar();
  }, [reiniciar]);

  // Ritmo da rodada: espera → descida → (correção) → próxima chave.
  useEffect(() => {
    if (state.status === "preparando") {
      const id = setTimeout(() => dispatch({ type: "inserir" }), DURACAO_ENTRE_CHAVES);
      return () => clearTimeout(id);
    }
    if (state.status === "descendo") {
      const id = setTimeout(() => dispatch({ type: "avancar-caminho" }), DURACAO_POR_COMPARACAO);
      return () => clearTimeout(id);
    }
    if (state.status === "rotacionando") {
      const id = setTimeout(() => dispatch({ type: "proxima-etapa-rotacao" }), DURACAO_DA_ROTACAO);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [state.status, state.passoCaminho, state.cursor, state.etapasPendentes]);

  // O reducer diz qual som a transição pede; aqui ele é tocado.
  useEffect(() => {
    if (state.som !== null) tocar(state.som.efeito);
  }, [state.som]);

  // Cronômetro da fase 4.
  useEffect(() => {
    if (state.tempoRestante === null) return undefined;
    if (state.status !== "escolher-no" && state.status !== "escolher-rotacao") return undefined;
    const id = setTimeout(() => dispatch({ type: "tique" }), 1000);
    return () => clearTimeout(id);
  }, [state.tempoRestante, state.status]);

  // O destaque vermelho do nó errado some sozinho.
  useEffect(() => {
    if (state.noErrado === null) return undefined;
    const id = setTimeout(() => dispatch({ type: "limpar-no-errado" }), 900);
    return () => clearTimeout(id);
  }, [state.noErrado]);

  const clicarNo = useCallback((chave: number) => dispatch({ type: "clicar-no", chave }), []);
  const escolherRotacao = useCallback(
    (rotacao: RotationCase) => dispatch({ type: "escolher-rotacao", rotacao }),
    [],
  );
  const revelarFB = useCallback(() => dispatch({ type: "revelar-fb" }), []);

  const resumo = useMemo<ResumoDaPartida>(
    () => ({
      pontuacao: state.pontuacao,
      acertos: state.acertos,
      erros: state.erros,
      melhorCombo: state.melhorCombo,
      alturaAVL: height(state.arvore),
      alturaBST: height(state.bst),
      chaves: state.cursor,
      preOrdem: preOrder(state.arvore),
    }),
    [
      state.pontuacao,
      state.acertos,
      state.erros,
      state.melhorCombo,
      state.arvore,
      state.bst,
      state.cursor,
    ],
  );

  return { state, resumo, clicarNo, escolherRotacao, revelarFB, reiniciar };
}

/** Só para conferir invariantes em testes/dev: aplica a correção correta sozinha. */
export function corrigirAutomaticamente(arvore: AVLNode, chaveInserida: number): AVLNode {
  const critico = findCriticalNode(arvore, chaveInserida);
  if (critico === null) return arvore;
  const caso = classifyCase(arvore, critico);
  return caso === null ? arvore : applyCorrection(arvore, critico, caso);
}
