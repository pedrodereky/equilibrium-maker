import { describe, expect, it } from "vitest";

import { criarEstadoInicial, reducer, type GameAction, type GameState } from "./useEquilibrium";
import { FASE_1_SEQUENCIA, FASE_2_SEQUENCIA, getLevel, type Level } from "@/data/levels";
import { preOrder, type RotationCase } from "@/lib/avl";

function fase(id: number): Level {
  const level = getLevel(id);
  if (level === undefined) throw new Error(`Fase ${id} não existe.`);
  return level;
}

function novoJogo(level: Level, sequencia: readonly number[]): GameState {
  return reducer(criarEstadoInicial(level), { type: "iniciar", sequencia });
}

function despachar(state: GameState, ...acoes: GameAction[]): GameState {
  return acoes.reduce(reducer, state);
}

/** Roda as animações (descida e etapas da rotação) até o jogo pedir algo. */
function assentar(state: GameState): GameState {
  let atual = state;
  for (let i = 0; i < 100; i += 1) {
    if (atual.status === "descendo") atual = reducer(atual, { type: "avancar-caminho" });
    else if (atual.status === "rotacionando")
      atual = reducer(atual, { type: "proxima-etapa-rotacao" });
    else return atual;
  }
  throw new Error("A animação não terminou.");
}

/** Insere a próxima chave da fila e para quando houver algo a decidir. */
function proximaChave(state: GameState): GameState {
  return assentar(reducer(state, { type: "inserir" }));
}

/** Joga a fase inteira sempre acertando, usando o gabarito do próprio avl.ts. */
function jogarCertinho(state: GameState): GameState {
  let atual = state;
  for (let i = 0; i < 200 && atual.status !== "vitoria" && atual.status !== "derrota"; i += 1) {
    if (atual.status === "preparando") {
      atual = proximaChave(atual);
    } else if (atual.status === "escolher-no" && atual.noCritico !== null) {
      atual = reducer(atual, { type: "clicar-no", chave: atual.noCritico });
    } else if (atual.status === "escolher-rotacao" && atual.casoEsperado !== null) {
      atual = assentar(reducer(atual, { type: "escolher-rotacao", rotacao: atual.casoEsperado }));
    } else {
      throw new Error(`Estado inesperado: ${atual.status}`);
    }
  }
  return atual;
}

describe("fluxo da rodada", () => {
  it("vence a fase 1 com a árvore correta e sem erros", () => {
    const fim = jogarCertinho(novoJogo(fase(1), FASE_1_SEQUENCIA));
    expect(fim.status).toBe("vitoria");
    expect(preOrder(fim.arvore)).toEqual([20, 10, 5, 15, 30, 25, 70, 45, 85]);
    expect(fim.erros).toBe(0);
    expect(fim.estabilidade).toBe(fase(1).estabilidade);
    // 5 rotações: 100 + 100 + 200 + 200 + 200 (×2 a partir do 3º acerto seguido).
    expect(fim.pontuacao).toBe(800);
  });

  it("vence a fase 2 pontuando o nó crítico e a rotação", () => {
    const fim = jogarCertinho(novoJogo(fase(2), FASE_2_SEQUENCIA));
    expect(fim.status).toBe("vitoria");
    expect(preOrder(fim.arvore)).toEqual([65, 30, 15, 10, 20, 45, 90, 85, 95]);
    // 5 correções × (nó + rotação) = 10 acertos.
    expect(fim.acertos).toBe(10);
    expect(fim.pontuacao).toBe(2 * 100 + 8 * 200);
  });

  it("no tutorial o nó crítico já vem selecionado", () => {
    let estado = novoJogo(fase(1), FASE_1_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    expect(estado.status).toBe("escolher-rotacao");
    expect(estado.noSelecionado).toBe(estado.noCritico);
  });

  it("fora do tutorial o jogador precisa clicar no nó crítico", () => {
    let estado = novoJogo(fase(2), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    expect(estado.status).toBe("escolher-no");
    expect(estado.noSelecionado).toBeNull();
  });

  it("a rotação dupla é animada em duas etapas", () => {
    let estado = novoJogo(fase(2), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    estado = reducer(estado, { type: "clicar-no", chave: estado.noCritico as number });
    expect(estado.casoEsperado).toBe("LR");
    estado = reducer(estado, { type: "escolher-rotacao", rotacao: "LR" });
    expect(estado.status).toBe("rotacionando");
    expect(estado.totalEtapasRotacao).toBe(2);
    expect(estado.etapasPendentes).toHaveLength(1);
  });

  it("a chave repetida é rejeitada com aviso, sem mexer na árvore", () => {
    let estado = novoJogo(fase(1), [40, 40]);
    estado = proximaChave(estado);
    const antes = estado.arvore;
    estado = reducer(estado, { type: "inserir" });
    expect(estado.arvore).toBe(antes);
    expect(estado.aviso?.titulo).toContain("repetida");
  });
});

describe("erros nunca alteram a árvore", () => {
  /** Leva a fase 2 até o primeiro desbalanceamento, com o nó crítico já escolhido. */
  function primeiroDesbalanceamento(): GameState {
    let estado = novoJogo(fase(2), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    return reducer(estado, { type: "clicar-no", chave: estado.noCritico as number });
  }

  it("a rotação errada não é aplicada e custa 1 de estabilidade", () => {
    const antes = primeiroDesbalanceamento();
    const erradas: RotationCase[] = ["LL", "RR", "RL"];
    expect(antes.casoEsperado).toBe("LR");

    let depois = antes;
    for (const rotacao of erradas) {
      depois = reducer(depois, { type: "escolher-rotacao", rotacao });
    }
    expect(depois.arvore).toBe(antes.arvore);
    expect(depois.status).toBe("escolher-rotacao");
    expect(depois.estabilidade).toBe(antes.estabilidade - 3);
    expect(depois.erros).toBe(3);
    expect(depois.combo).toBe(0);
    expect(depois.aviso?.texto).toContain("caso LR");
  });

  it("clicar no nó errado explica o porquê e mantém a etapa", () => {
    let estado = novoJogo(fase(2), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    const critico = estado.noCritico as number;
    const outro = preOrder(estado.arvore).find((k) => k !== critico) as number;

    const depois = reducer(estado, { type: "clicar-no", chave: outro });
    expect(depois.status).toBe("escolher-no");
    expect(depois.arvore).toBe(estado.arvore);
    expect(depois.estabilidade).toBe(estado.estabilidade - 1);
    expect(depois.noErrado).toBe(outro);
    expect(depois.aviso?.texto).toContain(`crítico é o mais profundo com |FB| = 2: ${critico}`);
  });

  it("zerar a estabilidade derruba a estrutura", () => {
    let estado = novoJogo(fase(2), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    const critico = estado.noCritico as number;
    const outro = preOrder(estado.arvore).find((k) => k !== critico) as number;

    for (let i = 0; i < fase(2).estabilidade; i += 1) {
      estado = reducer(estado, { type: "clicar-no", chave: outro });
    }
    expect(estado.estabilidade).toBe(0);
    expect(estado.status).toBe("derrota");
    expect(estado.desmoronou).toBe(true);
  });
});

describe("pontuação", () => {
  it("dobra a partir do terceiro acerto seguido e o combo zera no erro", () => {
    let estado = novoJogo(fase(1), FASE_1_SEQUENCIA);
    const ganhos: number[] = [];

    for (let i = 0; i < 3; i += 1) {
      while (estado.status === "preparando") estado = proximaChave(estado);
      const antes = estado.pontuacao;
      estado = assentar(
        reducer(estado, { type: "escolher-rotacao", rotacao: estado.casoEsperado as RotationCase }),
      );
      ganhos.push(estado.pontuacao - antes);
    }
    expect(ganhos).toEqual([100, 100, 200]);
    expect(estado.combo).toBe(3);

    while (estado.status === "preparando") estado = proximaChave(estado);
    const errada: RotationCase = estado.casoEsperado === "LL" ? "RR" : "LL";
    estado = reducer(estado, { type: "escolher-rotacao", rotacao: errada });
    expect(estado.combo).toBe(0);
  });

  it("o bônus de tempo só existe na fase com cronômetro", () => {
    let estado = novoJogo(fase(4), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    expect(estado.tempoRestante).toBe(20);

    estado = reducer(estado, { type: "clicar-no", chave: estado.noCritico as number });
    const antes = estado.pontuacao;
    estado = reducer(estado, {
      type: "escolher-rotacao",
      rotacao: estado.casoEsperado as RotationCase,
    });
    // 100 pela rotação + 20 s restantes × 5 de bônus.
    expect(estado.pontuacao - antes).toBe(100 + 20 * 5);
  });
});

describe("cronômetro da fase 4", () => {
  it("conta para trás e o tempo esgotado vale como erro", () => {
    let estado = novoJogo(fase(4), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    const estabilidade = estado.estabilidade;

    estado = despachar(estado, { type: "tique" }, { type: "tique" });
    expect(estado.tempoRestante).toBe(18);

    for (let i = 0; i < 18; i += 1) estado = reducer(estado, { type: "tique" });
    expect(estado.erros).toBe(1);
    expect(estado.estabilidade).toBe(estabilidade - 1);
    expect(estado.aviso?.titulo).toBe("Tempo esgotado");
    // O relógio reinicia para a nova tentativa.
    expect(estado.tempoRestante).toBe(20);
  });
});

describe("revelar FB", () => {
  it("cobra 50 pontos e só funciona nas fases com FB oculto", () => {
    let estado = novoJogo(fase(3), FASE_2_SEQUENCIA);
    expect(estado.fbRevelado).toBe(false);

    // Sem pontos, o jogo avisa em vez de revelar.
    estado = reducer(estado, { type: "revelar-fb" });
    expect(estado.fbRevelado).toBe(false);
    expect(estado.aviso?.titulo).toBe("Pontos insuficientes");

    estado = { ...estado, pontuacao: 260 };
    estado = reducer(estado, { type: "revelar-fb" });
    expect(estado.fbRevelado).toBe(true);
    expect(estado.pontuacao).toBe(210);
  });

  it("volta a esconder o FB depois que a correção termina", () => {
    let estado = novoJogo(fase(3), FASE_2_SEQUENCIA);
    while (estado.status === "preparando") estado = proximaChave(estado);
    estado = reducer({ ...estado, pontuacao: 100 }, { type: "revelar-fb" });
    expect(estado.fbRevelado).toBe(true);

    estado = reducer(estado, { type: "clicar-no", chave: estado.noCritico as number });
    estado = assentar(
      reducer(estado, { type: "escolher-rotacao", rotacao: estado.casoEsperado as RotationCase }),
    );
    expect(estado.fbRevelado).toBe(false);
  });

  it("nas fases com FB visível o botão não faz nada", () => {
    const estado = novoJogo(fase(1), FASE_1_SEQUENCIA);
    expect(estado.fbRevelado).toBe(true);
    expect(reducer(estado, { type: "revelar-fb" })).toBe(estado);
  });
});
