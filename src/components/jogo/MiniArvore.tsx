/**
 * Miniatura de árvore em SVG, usada no painel "Sem AVL" e nos mini-diagramas
 * da tela "Como jogar". As coordenadas também vêm de src/lib/avl.ts.
 */

import { computeLayout, formatBalance, type AVLNode } from "@/lib/avl";
import { cn } from "@/lib/utils";

const RAIO = 13;

export interface MiniArvoreProps {
  readonly arvore: AVLNode | null;
  readonly corPorFB?: boolean;
  readonly destaque?: number | null;
  readonly mostrarFB?: boolean;
  readonly className?: string;
  readonly vazia?: string;
}

function cor(balance: number, corPorFB: boolean): string {
  if (!corPorFB) return "var(--fb-oculto)";
  const magnitude = Math.abs(balance);
  if (magnitude === 0) return "var(--fb-zero)";
  if (magnitude === 1) return "var(--fb-um)";
  return "var(--fb-dois)";
}

export function MiniArvore({
  arvore,
  corPorFB = true,
  destaque = null,
  mostrarFB = false,
  className,
  vazia = "Árvore vazia",
}: MiniArvoreProps) {
  const layout = computeLayout(arvore, { spacingX: 40, spacingY: 52, padding: 26 });

  if (layout.nodes.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}
      >
        {vazia}
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height + (mostrarFB ? 18 : 6)}`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Miniatura de árvore com ${layout.nodes.length} nós e altura ${layout.depth}.`}
    >
      {layout.edges.map((edge) => (
        <line
          key={`${edge.parentKey}->${edge.childKey}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke="var(--aresta)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {layout.nodes.map((node) => (
        <g key={node.key} transform={`translate(${node.x}, ${node.y})`}>
          {node.key === destaque && (
            <circle r={RAIO + 5} fill="none" stroke="var(--critico)" strokeWidth={2.5} />
          )}
          <circle
            r={RAIO}
            fill={cor(node.balance, corPorFB)}
            stroke="var(--background)"
            strokeWidth={1.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight={700}
            fill="var(--background)"
          >
            {node.key}
          </text>
          {mostrarFB && (
            <text y={RAIO + 13} textAnchor="middle" fontSize={10} fill="var(--foreground)">
              {formatBalance(node.balance)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
