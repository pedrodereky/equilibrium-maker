/**
 * Definição das fases do Equilíbrium.
 *
 * As sequências fixas das fases 1 e 2 são verificadas em src/lib/avl.test.ts:
 * qualquer mudança aqui quebra os testes de propósito.
 */

import { simulate, type RotationCase } from "@/lib/avl";

export interface Level {
  readonly id: number;
  readonly nome: string;
  readonly subtitulo: string;
  readonly descricao: string;
  /** Pontos de "Estabilidade da estrutura" disponíveis. */
  readonly estabilidade: number;
  /** Mostra o FB de cada nó (e as cores por FB). */
  readonly mostrarFB: boolean;
  /** O nó crítico já vem destacado — o jogador só escolhe a rotação. */
  readonly destacarCritico: boolean;
  /** Custo em pontos do botão "Revelar FB". null = botão indisponível. */
  readonly custoRevelarFB: number | null;
  /** Segundos para corrigir cada desbalanceamento. null = sem cronômetro. */
  readonly tempoPorCorrecao: number | null;
  /** Exibe as dicas passo a passo do tutorial. */
  readonly dicas: boolean;
  /** Sequência fixa de chaves, ou null quando a fase é sorteada. */
  readonly sequencia: readonly number[] | null;
}

/** Fase 1 — rotações simples: RR em 25, LL em 25, LL em 30, RR em 5, LL em 85. */
export const FASE_1_SEQUENCIA: readonly number[] = [25, 30, 85, 20, 5, 10, 70, 15, 45];

/** Fase 2 — rotações duplas: LR em 65, RL em 65, RL em 45, LR em 45, RL em 10. */
export const FASE_2_SEQUENCIA: readonly number[] = [65, 10, 45, 95, 90, 85, 30, 20, 15];

/** Usada se o sorteio da fase mista não encontrar uma sequência válida a tempo. */
export const SEQUENCIA_MISTA_RESERVA: readonly number[] = [
  44, 81, 25, 12, 13, 40, 85, 18, 6, 89, 1, 70, 48, 9,
];

export const NUMERO_MINIMO_DE_CORRECOES = 5;

const CASOS_OBRIGATORIOS: readonly RotationCase[] = ["LL", "RR", "LR", "RL"];

/** A sequência serve para a fase mista? Precisa de ≥5 correções e dos 4 casos. */
export function sequenciaMistaEhValida(chaves: readonly number[]): boolean {
  if (chaves.length < 12 || chaves.length > 15) return false;
  if (new Set(chaves).size !== chaves.length) return false;
  if (!chaves.every((chave) => Number.isInteger(chave) && chave >= 1 && chave <= 99)) return false;

  const simulacao = simulate(chaves);
  if (simulacao.corrections < NUMERO_MINIMO_DE_CORRECOES) return false;
  return CASOS_OBRIGATORIOS.every((caso) => simulacao.cases.includes(caso));
}

function sortearChaves(quantidade: number, aleatorio: () => number): number[] {
  const disponiveis = Array.from({ length: 99 }, (_, i) => i + 1);
  for (let i = disponiveis.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1));
    const a = disponiveis[i] as number;
    const b = disponiveis[j] as number;
    disponiveis[i] = b;
    disponiveis[j] = a;
  }
  return disponiveis.slice(0, quantidade);
}

/**
 * Sorteia de 12 a 15 chaves entre 1 e 99 e só devolve a sequência depois de
 * simulá-la com avl.ts: ela precisa gerar pelo menos 5 correções e os 4 casos.
 */
export function gerarSequenciaMista(aleatorio: () => number = Math.random): number[] {
  for (let tentativa = 0; tentativa < 3000; tentativa += 1) {
    const quantidade = 12 + Math.floor(aleatorio() * 4);
    const chaves = sortearChaves(quantidade, aleatorio);
    if (sequenciaMistaEhValida(chaves)) return chaves;
  }
  return [...SEQUENCIA_MISTA_RESERVA];
}

export const LEVELS: readonly Level[] = [
  {
    id: 1,
    nome: "Tutorial",
    subtitulo: "Rotações simples",
    descricao:
      "Aprenda a reconhecer os casos LL e RR. O nó crítico já vem destacado: você só precisa escolher a rotação certa.",
    estabilidade: 5,
    mostrarFB: true,
    destacarCritico: true,
    custoRevelarFB: null,
    tempoPorCorrecao: null,
    dicas: true,
    sequencia: FASE_1_SEQUENCIA,
  },
  {
    id: 2,
    nome: "Rotações duplas",
    subtitulo: "Casos LR e RL",
    descricao:
      "Quando o filho pende para o lado contrário do pai, uma rotação só não resolve. Aqui você também precisa achar o nó crítico.",
    estabilidade: 4,
    mostrarFB: true,
    destacarCritico: false,
    custoRevelarFB: null,
    tempoPorCorrecao: null,
    dicas: false,
    sequencia: FASE_2_SEQUENCIA,
  },
  {
    id: 3,
    nome: "Misto",
    subtitulo: "Sem o FB na tela",
    descricao:
      "Sequência sorteada com os quatro casos. Só a altura fica visível — o fator de balanceamento é com você (ou custa 50 pontos).",
    estabilidade: 3,
    mostrarFB: false,
    destacarCritico: false,
    custoRevelarFB: 50,
    tempoPorCorrecao: null,
    dicas: false,
    sequencia: null,
  },
  {
    id: 4,
    nome: "Contra o tempo",
    subtitulo: "20 segundos por correção",
    descricao:
      "Igual à fase 3, mas cada desbalanceamento tem 20 segundos. Tempo esgotado conta como erro — e sobra bônus para quem for rápido.",
    estabilidade: 3,
    mostrarFB: false,
    destacarCritico: false,
    custoRevelarFB: 50,
    tempoPorCorrecao: 20,
    dicas: false,
    sequencia: null,
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

/** Sequência de chaves da fase: a fixa, ou uma sorteada e validada na hora. */
export function sequenciaDaFase(level: Level): number[] {
  return level.sequencia === null ? gerarSequenciaMista() : [...level.sequencia];
}
