import { describe, expect, it } from "vitest";

import {
  applyCorrection,
  balanceFactor,
  buildPlainBST,
  classifyCase,
  computeLayout,
  correctionSteps,
  explainCase,
  findCriticalNode,
  findNode,
  height,
  insertBST,
  isValidAVL,
  isValidBST,
  minPossibleHeight,
  preOrder,
  rotateLeft,
  rotateRight,
  simulate,
  type AVLNode,
  type RotationCase,
} from "./avl";

import {
  FASE_1_SEQUENCIA,
  FASE_2_SEQUENCIA,
  SEQUENCIA_MISTA_RESERVA,
  gerarSequenciaMista,
  sequenciaMistaEhValida,
} from "@/data/levels";

/** Insere as chaves aplicando sempre a correção correta e devolve a árvore final. */
function construir(keys: readonly number[]): AVLNode | null {
  return simulate(keys).finalTree;
}

/** Correções (nó crítico + caso) geradas pela sequência, na ordem em que acontecem. */
function correcoes(keys: readonly number[]): Array<{ no: number; caso: RotationCase }> {
  return simulate(keys)
    .steps.filter((step) => step.criticalKey !== null && step.rotation !== null)
    .map((step) => ({ no: step.criticalKey as number, caso: step.rotation as RotationCase }));
}

describe("medidas básicas", () => {
  it("usa -1 para nó nulo e 0 para folha", () => {
    expect(height(null)).toBe(-1);
    const folha = insertBST(null, 10).root;
    expect(height(folha)).toBe(0);
    expect(balanceFactor(folha)).toBe(0);
  });

  it("calcula FB como altura(esquerda) − altura(direita)", () => {
    const arvore = insertBST(insertBST(null, 20).root, 10).root;
    expect(balanceFactor(arvore)).toBe(1);
    const outra = insertBST(insertBST(null, 20).root, 30).root;
    expect(balanceFactor(outra)).toBe(-1);
  });

  it("rejeita chave repetida sem alterar a árvore", () => {
    const base = simulate([50, 25, 75]).finalTree;
    const resultado = insertBST(base, 25);
    expect(resultado.duplicate).toBe(true);
    expect(resultado.inserted).toBe(false);
    expect(resultado.root).toBe(base);
  });

  it("nunca rebalanceia sozinho na inserção", () => {
    let arvore: AVLNode | null = null;
    for (const chave of [30, 20, 10]) arvore = insertBST(arvore, chave).root;
    expect(preOrder(arvore)).toEqual([30, 20, 10]);
    expect(isValidAVL(arvore)).toBe(false);
  });

  it("⌊log₂ n⌋ é a altura mínima possível", () => {
    expect(minPossibleHeight(1)).toBe(0);
    expect(minPossibleHeight(7)).toBe(2);
    expect(minPossibleHeight(15)).toBe(3);
  });
});

describe("rotações simples", () => {
  it("rotateRight sobe o filho esquerdo", () => {
    const arvore = insertBST(insertBST(insertBST(null, 30).root, 20).root, 10).root;
    const rodada = rotateRight(arvore);
    expect(preOrder(rodada)).toEqual([20, 10, 30]);
  });

  it("rotateLeft sobe o filho direito", () => {
    const arvore = insertBST(insertBST(insertBST(null, 10).root, 20).root, 30).root;
    const rodada = rotateLeft(arvore);
    expect(preOrder(rodada)).toEqual([20, 10, 30]);
  });
});

describe("os quatro casos canônicos", () => {
  const casos: Array<{ chaves: number[]; caso: RotationCase; critico: number }> = [
    { chaves: [30, 20, 10], caso: "LL", critico: 30 },
    { chaves: [10, 20, 30], caso: "RR", critico: 10 },
    { chaves: [30, 10, 20], caso: "LR", critico: 30 },
    { chaves: [10, 30, 20], caso: "RL", critico: 10 },
  ];

  for (const { chaves, caso, critico } of casos) {
    it(`${chaves.join(",")} → caso ${caso} no nó ${critico}`, () => {
      const desbalanceada = chaves.reduce<AVLNode | null>(
        (arvore, chave) => insertBST(arvore, chave).root,
        null,
      );
      const ultima = chaves[chaves.length - 1] as number;

      expect(findCriticalNode(desbalanceada, ultima)).toBe(critico);
      expect(classifyCase(desbalanceada, critico)).toBe(caso);

      const corrigida = applyCorrection(desbalanceada as AVLNode, critico, caso);
      expect(preOrder(corrigida)).toEqual([20, 10, 30]);
      expect(isValidBST(corrigida)).toBe(true);
      expect(isValidAVL(corrigida)).toBe(true);
      expect(corrigida.key).toBe(20);
      expect(corrigida.left?.key).toBe(10);
      expect(corrigida.right?.key).toBe(30);
    });
  }

  it("rotações duplas têm duas etapas e simples apenas uma", () => {
    const lr = [30, 10, 20].reduce<AVLNode | null>(
      (arvore, chave) => insertBST(arvore, chave).root,
      null,
    ) as AVLNode;
    expect(correctionSteps(lr, 30, "LR")).toHaveLength(2);

    const ll = [30, 20, 10].reduce<AVLNode | null>(
      (arvore, chave) => insertBST(arvore, chave).root,
      null,
    ) as AVLNode;
    expect(correctionSteps(ll, 30, "LL")).toHaveLength(1);
  });

  it("a etapa intermediária do caso LR alinha o neto antes da rotação final", () => {
    const lr = [30, 10, 20].reduce<AVLNode | null>(
      (arvore, chave) => insertBST(arvore, chave).root,
      null,
    ) as AVLNode;
    const [intermediaria, final] = correctionSteps(lr, 30, "LR");
    expect(preOrder(intermediaria ?? null)).toEqual([30, 20, 10]);
    expect(preOrder(final ?? null)).toEqual([20, 10, 30]);
  });

  it("nunca aplica uma rotação que não corresponde ao caso", () => {
    const ll = [30, 20, 10].reduce<AVLNode | null>(
      (arvore, chave) => insertBST(arvore, chave).root,
      null,
    ) as AVLNode;
    expect(() => applyCorrection(ll, 30, "RR")).toThrow();
    expect(() => applyCorrection(ll, 30, "LR")).toThrow();
  });

  it("explica o caso em português com os FB envolvidos", () => {
    const ll = [30, 20, 10].reduce<AVLNode | null>(
      (arvore, chave) => insertBST(arvore, chave).root,
      null,
    ) as AVLNode;
    expect(explainCase(ll, 30)).toBe(
      "O nó 30 tinha FB +2 e o filho esquerdo 20 tinha FB +1 → caso LL → rotação simples à direita.",
    );
  });
});

describe("nó crítico", () => {
  it("é o nó desbalanceado mais profundo, não necessariamente a raiz", () => {
    // 65[30(10(-,20), 45), 90(85,95)] — inserir 15 desequilibra o 10, lá no fundo.
    const arvore = insertBST(simulate([65, 10, 45, 95, 90, 85, 30, 20]).finalTree, 15).root;
    expect(arvore.key).toBe(65);
    expect(findCriticalNode(arvore, 15)).toBe(10);
    expect(findCriticalNode(arvore)).toBe(10);
    expect(classifyCase(arvore, 10)).toBe("RL");
  });

  it("uma única correção no nó crítico rebalanceia a árvore inteira", () => {
    const arvore = insertBST(simulate([65, 10, 45, 95, 90, 85, 30, 20]).finalTree, 15).root;
    const corrigida = applyCorrection(arvore, 10, "RL");
    expect(isValidAVL(corrigida)).toBe(true);
    expect(findCriticalNode(corrigida)).toBeNull();
  });

  it("devolve null quando a árvore continua equilibrada", () => {
    const arvore = simulate([50, 25, 75]).finalTree;
    const depois = insertBST(arvore, 10);
    expect(findCriticalNode(depois.root, 10)).toBeNull();
  });
});

describe("inserção crescente de 1 a 15", () => {
  const chaves = Array.from({ length: 15 }, (_, i) => i + 1);
  const simulacao = simulate(chaves);

  it("gera 11 correções, todas do caso RR", () => {
    const lista = correcoes(chaves);
    expect(lista).toHaveLength(11);
    expect(simulacao.corrections).toBe(11);
    expect(lista.every((c) => c.caso === "RR")).toBe(true);
  });

  it("termina numa árvore perfeita de raiz 8 e altura 3", () => {
    const final = simulacao.finalTree;
    expect(final?.key).toBe(8);
    expect(height(final)).toBe(3);
    expect(preOrder(final)).toEqual([8, 4, 2, 1, 3, 6, 5, 7, 12, 10, 9, 11, 14, 13, 15]);
    expect(isValidBST(final)).toBe(true);
    expect(isValidAVL(final)).toBe(true);
    expect(height(final)).toBe(minPossibleHeight(15));
  });

  it("é muito melhor que a BST comum com as mesmas chaves", () => {
    expect(height(buildPlainBST(chaves))).toBe(14);
  });
});

describe("sequência da Fase 1", () => {
  it("produz as cinco correções previstas", () => {
    expect(correcoes(FASE_1_SEQUENCIA)).toEqual([
      { no: 25, caso: "RR" },
      { no: 25, caso: "LL" },
      { no: 30, caso: "LL" },
      { no: 5, caso: "RR" },
      { no: 85, caso: "LL" },
    ]);
  });

  it("termina com a pré-ordem 20,10,5,15,30,25,70,45,85", () => {
    const final = construir(FASE_1_SEQUENCIA);
    expect(preOrder(final)).toEqual([20, 10, 5, 15, 30, 25, 70, 45, 85]);
    expect(isValidBST(final)).toBe(true);
    expect(isValidAVL(final)).toBe(true);
  });
});

describe("sequência da Fase 2", () => {
  it("produz as cinco rotações duplas previstas", () => {
    expect(correcoes(FASE_2_SEQUENCIA)).toEqual([
      { no: 65, caso: "LR" },
      { no: 65, caso: "RL" },
      { no: 45, caso: "RL" },
      { no: 45, caso: "LR" },
      { no: 10, caso: "RL" },
    ]);
  });

  it("termina com a pré-ordem 65,30,15,10,20,45,90,85,95", () => {
    const final = construir(FASE_2_SEQUENCIA);
    expect(preOrder(final)).toEqual([65, 30, 15, 10, 20, 45, 90, 85, 95]);
    expect(isValidBST(final)).toBe(true);
    expect(isValidAVL(final)).toBe(true);
  });
});

describe("sequência aleatória da Fase 3", () => {
  it("a sequência de reserva também cumpre os requisitos da fase", () => {
    expect(sequenciaMistaEhValida(SEQUENCIA_MISTA_RESERVA)).toBe(true);
  });

  it("sempre entrega 12 a 15 chaves entre 1 e 99, com ≥5 correções e os 4 casos", () => {
    for (let tentativa = 0; tentativa < 40; tentativa += 1) {
      const chaves = gerarSequenciaMista();
      expect(chaves.length).toBeGreaterThanOrEqual(12);
      expect(chaves.length).toBeLessThanOrEqual(15);
      expect(new Set(chaves).size).toBe(chaves.length);
      expect(chaves.every((k) => k >= 1 && k <= 99)).toBe(true);

      const simulacao = simulate(chaves);
      expect(simulacao.corrections).toBeGreaterThanOrEqual(5);
      expect([...simulacao.cases].sort()).toEqual(["LL", "LR", "RL", "RR"]);
      expect(isValidAVL(simulacao.finalTree)).toBe(true);
      expect(isValidBST(simulacao.finalTree)).toBe(true);
    }
  });
});

describe("invariantes em sequências longas", () => {
  it("mantém BST e AVL válidas a cada correção", () => {
    const chaves = [50, 20, 70, 10, 30, 60, 80, 5, 15, 25, 35, 1, 2, 3, 4, 6, 7, 8, 9, 11];
    for (const passo of simulate(chaves).steps) {
      expect(isValidBST(passo.treeAfterCorrection)).toBe(true);
      expect(isValidAVL(passo.treeAfterCorrection)).toBe(true);
    }
  });
});

describe("computeLayout", () => {
  const arvore = simulate([20, 10, 30, 5, 15, 25, 35]).finalTree;

  it("dá uma coordenada por nó, sem sobreposição em x", () => {
    const layout = computeLayout(arvore);
    expect(layout.nodes).toHaveLength(7);
    const xs = layout.nodes.map((n) => n.x);
    expect(new Set(xs).size).toBe(7);
  });

  it("ordena os nós da esquerda para a direita conforme a ordem simétrica", () => {
    const layout = computeLayout(arvore);
    const porX = [...layout.nodes].sort((a, b) => a.x - b.x).map((n) => n.key);
    expect(porX).toEqual([5, 10, 15, 20, 25, 30, 35]);
  });

  it("usa y crescente com a profundidade e liga cada filho ao seu pai", () => {
    const layout = computeLayout(arvore);
    const raiz = layout.nodes.find((n) => n.key === 20);
    const folha = layout.nodes.find((n) => n.key === 5);
    expect(raiz?.y).toBeLessThan(folha?.y ?? 0);
    expect(layout.edges).toHaveLength(6);
    expect(layout.edges.every((e) => findNode(arvore, e.childKey) !== null)).toBe(true);
  });

  it("carrega altura e FB de cada nó, para a interface só desenhar", () => {
    const layout = computeLayout(arvore);
    const raiz = layout.nodes.find((n) => n.key === 20);
    expect(raiz?.height).toBe(2);
    expect(raiz?.balance).toBe(0);
  });
});
