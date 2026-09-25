/**
 * Painel "Sem AVL": a mesma sequência de chaves numa BST comum, que ninguém
 * rebalanceia. Serve para ver a altura dela crescendo ao lado da AVL.
 */

import { height, minPossibleHeight, size, type AVLNode } from "@/lib/avl";
import { MiniArvore } from "@/components/jogo/MiniArvore";
import { cn } from "@/lib/utils";

export interface PainelSemAVLProps {
  readonly bst: AVLNode | null;
  readonly avl: AVLNode | null;
}

export function PainelSemAVL({ bst, avl }: PainelSemAVLProps) {
  const alturaBST = height(bst);
  const alturaAVL = height(avl);
  const n = size(avl);
  const diferenca = alturaBST - alturaAVL;

  return (
    <section className="rounded-xl border border-painel-borda bg-painel p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sem AVL — a mesma sequência numa BST comum
      </h2>

      <div className="mt-2 h-40 rounded-lg border border-painel-borda bg-background/40 p-1">
        <MiniArvore arvore={bst} corPorFB={false} vazia="Ainda sem chaves" />
      </div>

      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">BST comum</dt>
          <dd className="text-lg font-bold tabular-nums text-fb-dois">{alturaBST}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Sua AVL</dt>
          <dd className="text-lg font-bold tabular-nums text-fb-zero">{alturaAVL}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Mínima ⌊log₂ n⌋
          </dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">
            {n === 0 ? "—" : minPossibleHeight(n)}
          </dd>
        </div>
      </dl>

      <p
        className={cn(
          "mt-1 text-[11px] leading-snug",
          diferenca > 0 ? "text-fb-um" : "text-muted-foreground",
        )}
      >
        {diferenca > 0
          ? `A BST comum já está ${diferenca} ${diferenca === 1 ? "nível" : "níveis"} mais alta. Cada nível a mais é uma comparação a mais na busca.`
          : "Empatadas por enquanto — a diferença aparece conforme as chaves chegam."}
      </p>
    </section>
  );
}
