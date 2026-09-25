/**
 * Núcleo da Árvore AVL do jogo Equilíbrium.
 *
 * Todas as funções deste arquivo são puras e imutáveis: nenhuma altera a árvore
 * recebida, todas devolvem novas estruturas. A interface NUNCA calcula fator de
 * balanceamento nem decide rotações por conta própria — ela sempre chama daqui.
 *
 * Regras formais adotadas (fonte da verdade):
 *  - Árvore binária de busca com chaves inteiras únicas.
 *  - altura(nó nulo) = -1, altura(folha) = 0.
 *  - FB(n) = altura(n.esquerda) - altura(n.direita).
 *  - FB válido em {-1, 0, +1}; |FB| = 2 significa desbalanceado.
 *  - Nó crítico: subindo do nó inserido até a raiz, o PRIMEIRO com |FB| = 2.
 */

export interface AVLNode {
  readonly key: number;
  /** Altura do nó: folha = 0, nulo = -1. Calculada na construção. */
  readonly height: number;
  readonly left: AVLNode | null;
  readonly right: AVLNode | null;
}

export type RotationCase = "LL" | "RR" | "LR" | "RL";

/** Ordem canônica usada nos botões e nos atalhos de teclado 1–4. */
export const ROTATION_CASES: readonly RotationCase[] = ["LL", "RR", "LR", "RL"];

export const ROTATION_LABELS: Record<RotationCase, string> = {
  LL: "Simples à direita (LL)",
  RR: "Simples à esquerda (RR)",
  LR: "Dupla esquerda-direita (LR)",
  RL: "Dupla direita-esquerda (RL)",
};

export const ROTATION_DESCRIPTIONS: Record<RotationCase, string> = {
  LL: "rotação simples à direita",
  RR: "rotação simples à esquerda",
  LR: "rotação dupla: esquerda no filho, depois direita no nó crítico",
  RL: "rotação dupla: direita no filho, depois esquerda no nó crítico",
};

/** Quantidade de etapas animadas de cada caso (1 = simples, 2 = dupla). */
export const ROTATION_STEPS: Record<RotationCase, number> = { LL: 1, RR: 1, LR: 2, RL: 2 };

// ---------------------------------------------------------------------------
// Construção e medidas básicas
// ---------------------------------------------------------------------------

/** Cria um nó já com a altura correta a partir dos filhos. */
export function makeNode(key: number, left: AVLNode | null, right: AVLNode | null): AVLNode {
  return { key, left, right, height: 1 + Math.max(height(left), height(right)) };
}

/** Altura do nó. Nó nulo = -1, folha = 0. */
export function height(node: AVLNode | null): number {
  return node === null ? -1 : node.height;
}

/** Fator de balanceamento: altura(esquerda) - altura(direita). Nó nulo = 0. */
export function balanceFactor(node: AVLNode | null): number {
  if (node === null) return 0;
  return height(node.left) - height(node.right);
}

/** Quantidade de nós da árvore. */
export function size(node: AVLNode | null): number {
  return node === null ? 0 : 1 + size(node.left) + size(node.right);
}

/** Busca um nó pela chave usando a propriedade de BST. */
export function findNode(root: AVLNode | null, key: number): AVLNode | null {
  let current = root;
  while (current !== null) {
    if (key === current.key) return current;
    current = key < current.key ? current.left : current.right;
  }
  return null;
}

export function contains(root: AVLNode | null, key: number): boolean {
  return findNode(root, key) !== null;
}

export function preOrder(node: AVLNode | null, acc: number[] = []): number[] {
  if (node === null) return acc;
  acc.push(node.key);
  preOrder(node.left, acc);
  preOrder(node.right, acc);
  return acc;
}

export function inOrder(node: AVLNode | null, acc: number[] = []): number[] {
  if (node === null) return acc;
  inOrder(node.left, acc);
  acc.push(node.key);
  inOrder(node.right, acc);
  return acc;
}

/** Constrói uma árvore a partir de chaves, sem nenhum rebalanceamento (BST comum). */
export function buildPlainBST(keys: readonly number[]): AVLNode | null {
  let root: AVLNode | null = null;
  for (const key of keys) {
    root = insertBST(root, key).root;
  }
  return root;
}

/** Altura que uma BST comum teria com as mesmas chaves, na mesma ordem. */
export function plainBSTHeight(keys: readonly number[]): number {
  return height(buildPlainBST(keys));
}

/** Altura mínima possível para n chaves: ⌊log₂ n⌋. */
export function minPossibleHeight(n: number): number {
  if (n <= 0) return -1;
  return Math.floor(Math.log2(n));
}

// ---------------------------------------------------------------------------
// Inserção (apenas BST — nunca rebalanceia)
// ---------------------------------------------------------------------------

export interface InsertResult {
  /** Árvore resultante. Igual à original quando a chave é duplicada. */
  readonly root: AVLNode;
  /** Chaves visitadas na descida, da raiz até o pai do novo nó. */
  readonly path: readonly number[];
  /** Falso quando a chave já existia. */
  readonly inserted: boolean;
  readonly duplicate: boolean;
}

/**
 * Insere a chave na posição correta de BST. NÃO rebalanceia — esse é o ponto
 * central do jogo: quem corrige a árvore é o jogador.
 */
export function insertBST(root: AVLNode | null, key: number): InsertResult {
  const path: number[] = [];

  function walk(node: AVLNode | null): { node: AVLNode; duplicate: boolean } {
    if (node === null) {
      return { node: makeNode(key, null, null), duplicate: false };
    }
    if (key === node.key) {
      path.push(node.key);
      return { node, duplicate: true };
    }
    path.push(node.key);
    if (key < node.key) {
      const result = walk(node.left);
      if (result.duplicate) return { node, duplicate: true };
      return { node: makeNode(node.key, result.node, node.right), duplicate: false };
    }
    const result = walk(node.right);
    if (result.duplicate) return { node, duplicate: true };
    return { node: makeNode(node.key, node.left, result.node), duplicate: false };
  }

  const { node, duplicate } = walk(root);
  return { root: node, path, inserted: !duplicate, duplicate };
}

// ---------------------------------------------------------------------------
// Diagnóstico do desbalanceamento
// ---------------------------------------------------------------------------

/** Caminho da raiz até a chave (inclusive). Vazio se a chave não existir. */
export function pathToKey(root: AVLNode | null, key: number): AVLNode[] {
  const path: AVLNode[] = [];
  let current = root;
  while (current !== null) {
    path.push(current);
    if (key === current.key) return path;
    current = key < current.key ? current.left : current.right;
  }
  return [];
}

/**
 * Nó crítico: subindo do nó inserido em direção à raiz, o primeiro (mais
 * profundo) com |FB| = 2. Sem `insertedKey`, varre a árvore inteira e devolve
 * o nó desbalanceado mais profundo.
 */
export function findCriticalNode(root: AVLNode | null, insertedKey?: number): number | null {
  if (root === null) return null;

  if (insertedKey !== undefined) {
    const path = pathToKey(root, insertedKey);
    for (let i = path.length - 1; i >= 0; i -= 1) {
      const node = path[i];
      if (node !== undefined && Math.abs(balanceFactor(node)) === 2) return node.key;
    }
    return null;
  }

  let best: { key: number; depth: number } | null = null;
  const visit = (node: AVLNode | null, depth: number): void => {
    if (node === null) return;
    if (Math.abs(balanceFactor(node)) === 2 && (best === null || depth > best.depth)) {
      best = { key: node.key, depth };
    }
    visit(node.left, depth + 1);
    visit(node.right, depth + 1);
  };
  visit(root, 0);
  return best === null ? null : (best as { key: number; depth: number }).key;
}

/** Classifica o caso de rotação do nó crítico. Devolve null se ele estiver equilibrado. */
export function classifyCase(root: AVLNode | null, criticalKey: number): RotationCase | null {
  const node = findNode(root, criticalKey);
  if (node === null) return null;

  const fb = balanceFactor(node);
  if (fb === 2) {
    return balanceFactor(node.left) >= 0 ? "LL" : "LR";
  }
  if (fb === -2) {
    return balanceFactor(node.right) <= 0 ? "RR" : "RL";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rotações
// ---------------------------------------------------------------------------

/** Rotação simples à esquerda em `z`. Requer filho direito. */
export function rotateLeft(z: AVLNode): AVLNode {
  const y = z.right;
  if (y === null) {
    throw new Error(`rotateLeft: o nó ${z.key} não tem filho direito.`);
  }
  return makeNode(y.key, makeNode(z.key, z.left, y.left), y.right);
}

/** Rotação simples à direita em `z`. Requer filho esquerdo. */
export function rotateRight(z: AVLNode): AVLNode {
  const y = z.left;
  if (y === null) {
    throw new Error(`rotateRight: o nó ${z.key} não tem filho esquerdo.`);
  }
  return makeNode(y.key, y.left, makeNode(z.key, y.right, z.right));
}

/** Substitui a subárvore enraizada em `key` por `replacement`, reconstruindo o caminho. */
function replaceSubtree(root: AVLNode, key: number, replacement: AVLNode): AVLNode {
  if (root.key === key) return replacement;
  if (key < root.key) {
    if (root.left === null) throw new Error(`Nó ${key} não encontrado na árvore.`);
    return makeNode(root.key, replaceSubtree(root.left, key, replacement), root.right);
  }
  if (root.right === null) throw new Error(`Nó ${key} não encontrado na árvore.`);
  return makeNode(root.key, root.left, replaceSubtree(root.right, key, replacement));
}

/** Aplica uma rotação simples num nó qualquer identificado pela chave. */
export function applyRotationAt(root: AVLNode, key: number, direction: "left" | "right"): AVLNode {
  const node = findNode(root, key);
  if (node === null) throw new Error(`Nó ${key} não encontrado na árvore.`);
  const rotated = direction === "left" ? rotateLeft(node) : rotateRight(node);
  return replaceSubtree(root, key, rotated);
}

/**
 * Etapas intermediárias da correção, para animar rotações duplas em sequência.
 * Caso simples devolve 1 árvore; caso duplo devolve 2 (a intermediária e a final).
 */
export function correctionSteps(
  root: AVLNode,
  criticalKey: number,
  rotation: RotationCase,
): AVLNode[] {
  const expected = classifyCase(root, criticalKey);
  if (expected === null) {
    throw new Error(`O nó ${criticalKey} não está desbalanceado.`);
  }
  if (expected !== rotation) {
    throw new Error(
      `Rotação ${rotation} não se aplica ao nó ${criticalKey} (caso correto: ${expected}).`,
    );
  }

  const node = findNode(root, criticalKey);
  if (node === null) throw new Error(`Nó ${criticalKey} não encontrado na árvore.`);

  switch (rotation) {
    case "LL":
      return [applyRotationAt(root, criticalKey, "right")];
    case "RR":
      return [applyRotationAt(root, criticalKey, "left")];
    case "LR": {
      if (node.left === null) throw new Error(`Nó ${criticalKey} sem filho esquerdo.`);
      const first = applyRotationAt(root, node.left.key, "left");
      return [first, applyRotationAt(first, criticalKey, "right")];
    }
    case "RL": {
      if (node.right === null) throw new Error(`Nó ${criticalKey} sem filho direito.`);
      const first = applyRotationAt(root, node.right.key, "right");
      return [first, applyRotationAt(first, criticalKey, "left")];
    }
    default:
      throw new Error(`Rotação desconhecida: ${String(rotation)}`);
  }
}

/**
 * Aplica a correção completa no nó crítico. Lança erro se a rotação não for a
 * correta — o jogo nunca aplica uma rotação errada na árvore.
 */
export function applyCorrection(
  root: AVLNode,
  criticalKey: number,
  rotation: RotationCase,
): AVLNode {
  const steps = correctionSteps(root, criticalKey, rotation);
  const last = steps[steps.length - 1];
  if (last === undefined) throw new Error("Correção não produziu nenhuma etapa.");
  return last;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/** Verifica a propriedade de busca binária (chaves estritamente crescentes em ordem simétrica). */
export function isValidBST(root: AVLNode | null): boolean {
  const keys = inOrder(root);
  for (let i = 1; i < keys.length; i += 1) {
    const previous = keys[i - 1];
    const current = keys[i];
    if (previous === undefined || current === undefined || previous >= current) return false;
  }
  return true;
}

/** Verifica alturas consistentes e |FB| ≤ 1 em todos os nós. */
export function isValidAVL(root: AVLNode | null): boolean {
  const check = (node: AVLNode | null): boolean => {
    if (node === null) return true;
    if (!check(node.left) || !check(node.right)) return false;
    const expectedHeight = 1 + Math.max(height(node.left), height(node.right));
    if (node.height !== expectedHeight) return false;
    return Math.abs(balanceFactor(node)) <= 1;
  };
  return check(root);
}

/**
 * Em desenvolvimento, confere BST + AVL depois de cada correção e registra
 * console.error se algo estiver errado. Em produção não faz nada.
 */
export function assertTreeIsSound(root: AVLNode | null, contexto: string): void {
  if (!import.meta.env.DEV) return;
  if (!isValidBST(root)) {
    console.error(`[Equilíbrium] Propriedade de BST violada após ${contexto}.`, preOrder(root));
  }
  if (!isValidAVL(root)) {
    console.error(`[Equilíbrium] Propriedade de AVL violada após ${contexto}.`, preOrder(root));
  }
}

// ---------------------------------------------------------------------------
// Explicações em português (a interface nunca monta esses textos sozinha)
// ---------------------------------------------------------------------------

/** Formata um FB com sinal explícito: +2, -1, 0. */
export function formatBalance(fb: number): string {
  return fb > 0 ? `+${fb}` : String(fb);
}

/**
 * Explicação curta do caso, como:
 * "O nó 30 tinha FB +2 e o filho esquerdo 20 tinha FB +1 → caso LL → rotação simples à direita."
 */
export function explainCase(root: AVLNode | null, criticalKey: number): string {
  const node = findNode(root, criticalKey);
  if (node === null) return "Nó não encontrado.";
  const rotation = classifyCase(root, criticalKey);
  if (rotation === null) {
    return `O nó ${node.key} tem FB ${formatBalance(balanceFactor(node))}: está equilibrado.`;
  }
  const isLeft = balanceFactor(node) === 2;
  const child = isLeft ? node.left : node.right;
  const ladoFilho = isLeft ? "esquerdo" : "direito";
  const fbNo = formatBalance(balanceFactor(node));
  const fbFilho = child === null ? "—" : formatBalance(balanceFactor(child));
  const chaveFilho = child === null ? "—" : String(child.key);
  return (
    `O nó ${node.key} tinha FB ${fbNo} e o filho ${ladoFilho} ${chaveFilho} tinha FB ${fbFilho}` +
    ` → caso ${rotation} → ${ROTATION_DESCRIPTIONS[rotation]}.`
  );
}

/** Motivo pelo qual um nó clicado não é o crítico. */
export function explainWrongNode(
  root: AVLNode | null,
  clickedKey: number,
  criticalKey: number,
): string {
  const clicked = findNode(root, clickedKey);
  const fb = clicked === null ? 0 : balanceFactor(clicked);
  return (
    `O nó ${clickedKey} tem FB ${formatBalance(fb)}, então não é o crítico.` +
    ` O nó crítico é o mais profundo com |FB| = 2: ${criticalKey}.`
  );
}

// ---------------------------------------------------------------------------
// Simulação (usada pelos testes, pelas fases e pela geração aleatória)
// ---------------------------------------------------------------------------

export interface SimulationStep {
  readonly key: number;
  readonly inserted: boolean;
  readonly path: readonly number[];
  readonly treeAfterInsert: AVLNode;
  readonly criticalKey: number | null;
  readonly rotation: RotationCase | null;
  readonly treeAfterCorrection: AVLNode;
}

export interface Simulation {
  readonly steps: readonly SimulationStep[];
  readonly finalTree: AVLNode | null;
  readonly corrections: number;
  readonly cases: readonly RotationCase[];
}

/** Roda a sequência inteira aplicando sempre a correção correta. */
export function simulate(keys: readonly number[]): Simulation {
  const steps: SimulationStep[] = [];
  const cases = new Set<RotationCase>();
  let tree: AVLNode | null = null;
  let corrections = 0;

  for (const key of keys) {
    const result = insertBST(tree, key);
    const criticalKey = result.inserted ? findCriticalNode(result.root, key) : null;
    const rotation = criticalKey === null ? null : classifyCase(result.root, criticalKey);
    const corrected =
      criticalKey !== null && rotation !== null
        ? applyCorrection(result.root, criticalKey, rotation)
        : result.root;

    if (rotation !== null) {
      corrections += 1;
      cases.add(rotation);
    }

    steps.push({
      key,
      inserted: result.inserted,
      path: result.path,
      treeAfterInsert: result.root,
      criticalKey,
      rotation,
      treeAfterCorrection: corrected,
    });
    tree = corrected;
  }

  return { steps, finalTree: tree, corrections, cases: [...cases] };
}

// ---------------------------------------------------------------------------
// Layout para o SVG
// ---------------------------------------------------------------------------

export interface LayoutOptions {
  spacingX: number;
  spacingY: number;
  padding: number;
}

export const DEFAULT_LAYOUT: LayoutOptions = { spacingX: 76, spacingY: 98, padding: 56 };

export interface LayoutNode {
  readonly key: number;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly height: number;
  readonly balance: number;
  readonly parentKey: number | null;
  readonly side: "left" | "right" | null;
}

export interface LayoutEdge {
  readonly parentKey: number;
  readonly childKey: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface TreeLayout {
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/**
 * Coordenadas x/y de cada nó. O x vem da posição em ordem simétrica (evita
 * sobreposição) e o y vem da profundidade.
 */
export function computeLayout(
  root: AVLNode | null,
  options: Partial<LayoutOptions> = {},
): TreeLayout {
  const { spacingX, spacingY, padding } = { ...DEFAULT_LAYOUT, ...options };
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const positions = new Map<number, { x: number; y: number }>();
  let column = 0;
  let maxDepth = 0;

  const visit = (
    node: AVLNode | null,
    depth: number,
    parentKey: number | null,
    side: "left" | "right" | null,
  ): void => {
    if (node === null) return;
    visit(node.left, depth + 1, node.key, "left");

    const x = padding + column * spacingX;
    const y = padding + depth * spacingY;
    column += 1;
    maxDepth = Math.max(maxDepth, depth);
    positions.set(node.key, { x, y });
    nodes.push({
      key: node.key,
      x,
      y,
      depth,
      height: node.height,
      balance: balanceFactor(node),
      parentKey,
      side,
    });

    visit(node.right, depth + 1, node.key, "right");
  };

  visit(root, 0, null, null);

  for (const node of nodes) {
    if (node.parentKey === null) continue;
    const parent = positions.get(node.parentKey);
    if (parent === undefined) continue;
    edges.push({
      parentKey: node.parentKey,
      childKey: node.key,
      x1: parent.x,
      y1: parent.y,
      x2: node.x,
      y2: node.y,
    });
  }

  return {
    nodes,
    edges,
    width: Math.max(padding * 2, padding * 2 + Math.max(0, column - 1) * spacingX),
    height: padding * 2 + maxDepth * spacingY,
    depth: maxDepth,
  };
}

/**
 * Posições em diagonal, como uma lista encadeada. Usado na animação de derrota,
 * quando a árvore degenera e a busca vira O(n).
 */
export function computeDegenerateLayout(
  root: AVLNode | null,
  options: Partial<LayoutOptions> = {},
): TreeLayout {
  const { spacingX, spacingY, padding } = {
    ...DEFAULT_LAYOUT,
    // Espaçamento maior que o da árvore normal: na diagonal, o rótulo "h/FB"
    // de um nó fica logo acima do nó seguinte.
    spacingY: 80,
    spacingX: 66,
    ...options,
  };
  const keys = inOrder(root);
  const nodes: LayoutNode[] = keys.map((key, index) => ({
    key,
    x: padding + index * spacingX,
    y: padding + index * spacingY,
    depth: index,
    height: keys.length - 1 - index,
    balance: index === keys.length - 1 ? 0 : -1,
    parentKey: index === 0 ? null : (keys[index - 1] ?? null),
    side: index === 0 ? null : "right",
  }));

  const edges: LayoutEdge[] = [];
  for (let i = 1; i < nodes.length; i += 1) {
    const parent = nodes[i - 1];
    const child = nodes[i];
    if (parent === undefined || child === undefined) continue;
    edges.push({
      parentKey: parent.key,
      childKey: child.key,
      x1: parent.x,
      y1: parent.y,
      x2: child.x,
      y2: child.y,
    });
  }

  return {
    nodes,
    edges,
    width: padding * 2 + Math.max(0, keys.length - 1) * spacingX,
    height: padding * 2 + Math.max(0, keys.length - 1) * spacingY,
    depth: Math.max(0, keys.length - 1),
  };
}

// ---------------------------------------------------------------------------
// Dicas do tutorial
// ---------------------------------------------------------------------------

/**
 * Raciocínio passo a passo até o caso correto, sem entregar a resposta de
 * bandeja: a última dica ensina a regra, não o nome do caso.
 */
export function dicasDoCaso(root: AVLNode | null, criticalKey: number): string[] {
  const node = findNode(root, criticalKey);
  if (node === null) return [];
  const fb = balanceFactor(node);
  if (Math.abs(fb) !== 2) return [];

  const pendeParaEsquerda = fb === 2;
  const child = pendeParaEsquerda ? node.left : node.right;
  const ladoFilho = pendeParaEsquerda ? "esquerdo" : "direito";
  const ladoPesado = pendeParaEsquerda ? "esquerda" : "direita";
  const fbFilho = balanceFactor(child);

  return [
    `1. O nó crítico é o ${node.key}: subindo do nó recém-inserido, ele é o primeiro com |FB| = 2 (FB ${formatBalance(fb)}).`,
    `2. FB ${formatBalance(fb)} quer dizer que a subárvore da ${ladoPesado} está 2 níveis mais alta. Agora olhe o filho ${ladoFilho}, o nó ${child === null ? "—" : child.key}, com FB ${formatBalance(fbFilho)}.`,
    fbFilho === 0 || Math.sign(fb) === Math.sign(fbFilho)
      ? `3. Pai e filho pendem para o mesmo lado → caso simples: uma única rotação, na direção contrária ao peso (${pendeParaEsquerda ? "à direita" : "à esquerda"}).`
      : `3. Pai e filho pendem para lados opostos → caso duplo: primeiro endireita o filho, depois rotaciona o nó crítico.`,
  ];
}
