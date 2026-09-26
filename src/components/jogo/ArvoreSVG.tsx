/**
 * Desenho da árvore em SVG.
 *
 * Este componente não sabe nada de AVL: ele só recebe a árvore e pede as
 * coordenadas, a altura e o FB de cada nó para src/lib/avl.ts.
 */

import { AnimatePresence, motion } from "framer-motion";

import {
  computeDegenerateLayout,
  computeLayout,
  formatBalance,
  type AVLNode,
  type LayoutNode,
} from "@/lib/avl";
import { cn } from "@/lib/utils";

const RAIO = 26;

export interface ArvoreSVGProps {
  readonly arvore: AVLNode | null;
  /** Quando falso, o nó não exibe FB nem as cores por FB (fases 3 e 4). */
  readonly mostrarFB: boolean;
  readonly noCritico: number | null;
  /** Mostra o anel tracejado no nó crítico (tutorial, ou depois de acertá-lo). */
  readonly destacarCritico: boolean;
  readonly noSelecionado: number | null;
  readonly noErrado: number | null;
  readonly selecionavel: boolean;
  readonly onSelecionar: ((chave: number) => void) | null;
  /** Nó que está sendo comparado agora na descida da inserção. */
  readonly chaveNoCaminho: number | null;
  /** Chave descendo pela árvore, ainda não inserida. */
  readonly chaveEmTransito: number | null;
  /** Muda de valor para disparar o tremor da árvore. */
  readonly tremor: number;
  readonly desmoronou: boolean;
  readonly className?: string;
}

/** Cor do nó pelo FB. Nunca é o único sinal: o número do FB aparece embaixo. */
function corDoNo(balance: number, mostrarFB: boolean): string {
  if (!mostrarFB) return "var(--fb-oculto)";
  const magnitude = Math.abs(balance);
  if (magnitude === 0) return "var(--fb-zero)";
  if (magnitude === 1) return "var(--fb-um)";
  return "var(--fb-dois)";
}

function rotuloDoNo(node: LayoutNode, mostrarFB: boolean): string {
  return mostrarFB ? `h=${node.height} · FB=${formatBalance(node.balance)}` : `h=${node.height}`;
}

function descricaoAcessivel(node: LayoutNode, mostrarFB: boolean): string {
  const base = `Nó ${node.key}, altura ${node.height}`;
  return mostrarFB ? `${base}, fator de balanceamento ${formatBalance(node.balance)}` : base;
}

export function ArvoreSVG({
  arvore,
  mostrarFB,
  noCritico,
  destacarCritico,
  noSelecionado,
  noErrado,
  selecionavel,
  onSelecionar,
  chaveNoCaminho,
  chaveEmTransito,
  tremor,
  desmoronou,
  className,
}: ArvoreSVGProps) {
  const layout = desmoronou ? computeDegenerateLayout(arvore) : computeLayout(arvore);
  const posicoes = new Map(layout.nodes.map((node) => [node.key, node]));
  const noDoCaminho = chaveNoCaminho === null ? undefined : posicoes.get(chaveNoCaminho);

  if (layout.nodes.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-painel-borda text-sm text-muted-foreground",
          className,
        )}
      >
        A árvore está vazia. A primeira chave da fila vira a raiz.
      </div>
    );
  }

  const alturaDesenho = layout.height + 26;
  // Árvores pequenas podem crescer um pouco (leitura em projetor), mas não a
  // ponto de virarem círculos gigantes numa tela larga.
  const AMPLIACAO_MAXIMA = 1.7;

  return (
    <div className={cn("flex w-full items-center justify-center overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${layout.width} ${alturaDesenho}`}
        className="h-full w-full"
        style={{
          maxWidth: `${Math.round(layout.width * AMPLIACAO_MAXIMA)}px`,
          maxHeight: `${Math.round(alturaDesenho * AMPLIACAO_MAXIMA)}px`,
        }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Árvore com ${layout.nodes.length} nós e altura ${layout.depth}.`}
      >
        <g key={tremor} className={tremor > 0 ? "animate-tremor" : undefined}>
          {/* Arestas primeiro, para ficarem atrás dos nós. */}
          <g>
            {layout.edges.map((edge) => (
              <motion.line
                key={`${edge.parentKey}->${edge.childKey}`}
                initial={{ x1: edge.x1, y1: edge.y1, x2: edge.x1, y2: edge.y1, opacity: 0 }}
                animate={{
                  x1: edge.x1,
                  y1: edge.y1,
                  x2: edge.x2,
                  y2: edge.y2,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                stroke="var(--aresta)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
          </g>

          <AnimatePresence>
            {layout.nodes.map((node) => {
              const ehCritico = node.key === noCritico && destacarCritico;
              const ehSelecionado = node.key === noSelecionado;
              const ehErrado = node.key === noErrado;
              const ehComparado = node.key === chaveNoCaminho;
              const clicavel = selecionavel && onSelecionar !== null;

              return (
                <motion.g
                  key={node.key}
                  initial={{ x: node.x, y: node.y, opacity: 0, scale: 0.4 }}
                  animate={{ x: node.x, y: node.y, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 210, damping: 24 }}
                  style={{ cursor: clicavel ? "pointer" : "default" }}
                  onClick={clicavel ? () => onSelecionar(node.key) : undefined}
                  onKeyDown={
                    clicavel
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelecionar(node.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clicavel ? 0 : -1}
                  role={clicavel ? "button" : undefined}
                  aria-label={
                    clicavel
                      ? `${descricaoAcessivel(node, mostrarFB)}. Selecionar como nó crítico.`
                      : descricaoAcessivel(node, mostrarFB)
                  }
                  className="focus:outline-none"
                >
                  {ehCritico && (
                    <motion.circle
                      r={RAIO + 9}
                      fill="none"
                      stroke="var(--critico)"
                      strokeWidth={3}
                      strokeDasharray="7 6"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {ehSelecionado && !ehCritico && (
                    <circle r={RAIO + 7} fill="none" stroke="var(--destaque)" strokeWidth={3} />
                  )}
                  {ehErrado && (
                    <circle r={RAIO + 7} fill="none" stroke="var(--fb-dois)" strokeWidth={4} />
                  )}
                  {ehComparado && (
                    <circle
                      r={RAIO + 6}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth={2.5}
                      className="animate-pulso-alerta"
                    />
                  )}

                  <circle
                    r={RAIO}
                    fill={corDoNo(node.balance, mostrarFB)}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={20}
                    fontWeight={700}
                    fill="var(--background)"
                  >
                    {node.key}
                  </text>
                  <text
                    y={RAIO + 18}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill="var(--foreground)"
                    // Contorno na cor do fundo: o rótulo continua legível
                    // mesmo quando passa por cima de uma aresta.
                    stroke="var(--background)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {rotuloDoNo(node, mostrarFB)}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Chave descendo pelo caminho de comparações. */}
          <AnimatePresence>
            {chaveEmTransito !== null && noDoCaminho !== undefined && (
              <motion.g
                key="chave-em-transito"
                initial={{ x: noDoCaminho.x, y: noDoCaminho.y - 66, opacity: 0, scale: 0.6 }}
                animate={{ x: noDoCaminho.x, y: noDoCaminho.y - 58, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <circle r={19} fill="var(--destaque)" stroke="var(--foreground)" strokeWidth={2} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={15}
                  fontWeight={700}
                  fill="var(--background)"
                >
                  {chaveEmTransito}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
}
