import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft } from "lucide-react";

import { MiniArvore } from "@/components/jogo/MiniArvore";
import { Button } from "@/components/ui/button";
import {
  applyCorrection,
  explainCase,
  findCriticalNode,
  insertBST,
  ROTATION_CASES,
  ROTATION_LABELS,
  type AVLNode,
  type RotationCase,
} from "@/lib/avl";

export const Route = createFileRoute("/como-jogar")({
  head: () => ({
    meta: [
      { title: "Como jogar — Equilíbrium" },
      {
        name: "description",
        content: "BST, altura, fator de balanceamento e os quatro casos de rotação da AVL.",
      },
    ],
  }),
  component: ComoJogar,
});

/** Sequência mínima que produz cada caso, na ordem em que o jogador vai encontrá-los. */
const SEQUENCIAS: Record<RotationCase, readonly number[]> = {
  LL: [30, 20, 10],
  RR: [10, 20, 30],
  LR: [30, 10, 20],
  RL: [10, 30, 20],
};

/** Os diagramas não são desenhados à mão: saem de avl.ts, como tudo no jogo. */
const DIAGRAMAS = ROTATION_CASES.map((caso) => {
  const chaves = SEQUENCIAS[caso];
  const antes = chaves.reduce<AVLNode | null>(
    (arvore, chave) => insertBST(arvore, chave).root,
    null,
  ) as AVLNode;
  const critico = findCriticalNode(antes, chaves[chaves.length - 1] as number) as number;
  return {
    caso,
    antes,
    depois: applyCorrection(antes, critico, caso),
    critico,
    explicacao: explainCase(antes, critico),
  };
});

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-painel-borda bg-painel p-5">
      <h2 className="text-xl font-bold text-foreground">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function ComoJogar() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/">
            <ChevronLeft className="size-4" aria-hidden />
            Menu
          </Link>
        </Button>

        <h1 className="mt-4 text-4xl font-black text-foreground">Como jogar</h1>
        <p className="mt-2 text-muted-foreground">
          Tudo o que o Equilíbrium cobra: BST, altura, fator de balanceamento e os quatro casos de
          rotação.
        </p>

        <div className="mt-7 space-y-4">
          <Secao titulo="1. Árvore binária de busca (BST)">
            <p>
              Cada nó guarda uma chave inteira única. Tudo que está à esquerda de um nó é menor que
              ele; tudo à direita é maior. Buscar uma chave é descer comparando — por isso o custo
              da busca é a <strong className="text-foreground">altura</strong> da árvore.
            </p>
            <p>Chave repetida é rejeitada com aviso: a árvore não aceita duplicatas.</p>
          </Secao>

          <Secao titulo="2. Altura">
            <p>
              Um nó nulo tem altura <strong className="text-foreground">−1</strong> e uma folha tem
              altura <strong className="text-foreground">0</strong>. A altura de um nó é 1 + a maior
              altura entre seus filhos. No jogo, o “h” aparece embaixo de cada nó.
            </p>
          </Secao>

          <Secao titulo="3. Fator de balanceamento (FB)">
            <p>FB(n) = altura(subárvore esquerda) − altura(subárvore direita).</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                FB em <strong className="text-fb-zero">0</strong>,{" "}
                <strong className="text-fb-um">+1</strong> ou{" "}
                <strong className="text-fb-um">−1</strong>: o nó está equilibrado.
              </li>
              <li>
                <strong className="text-fb-dois">|FB| = 2</strong>: o nó está desbalanceado e a AVL
                foi violada.
              </li>
            </ul>
            <p>
              O <strong className="text-foreground">nó crítico</strong> é o primeiro com |FB| = 2
              que você encontra subindo do nó recém-inserido até a raiz — ou seja, o mais profundo.
              É nele, e só nele, que a rotação acontece: na inserção, uma única correção no nó
              crítico rebalanceia a árvore inteira.
            </p>
            <p className="rounded-lg border border-painel-borda bg-background/50 p-3">
              As cores (verde para 0, amarelo para ±1, vermelho para ±2) são só um reforço: o número
              do FB está sempre escrito embaixo do nó.
            </p>
          </Secao>

          <Secao titulo="4. Os quatro casos">
            <p>
              Chame de <strong className="text-foreground">z</strong> o nó crítico. O sinal do FB de
              z diz de que lado está o peso; o FB do filho desse lado diz se uma rotação basta.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {DIAGRAMAS.map(({ caso, antes, depois, critico, explicacao }) => (
                <article
                  key={caso}
                  className="rounded-lg border border-painel-borda bg-background/50 p-3"
                >
                  <h3 className="text-sm font-bold text-foreground">
                    Caso {caso} — {ROTATION_LABELS[caso]}
                  </h3>
                  <p className="mt-1 text-xs leading-snug">{explicacao}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-40 flex-1">
                      <p className="text-center text-[10px] uppercase tracking-wide">antes</p>
                      <MiniArvore arvore={antes} destaque={critico} mostrarFB className="h-36" />
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-critico" aria-hidden />
                    <div className="h-40 flex-1">
                      <p className="text-center text-[10px] uppercase tracking-wide">depois</p>
                      <MiniArvore arvore={depois} mostrarFB className="h-36" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Secao>

          <Secao titulo="5. A rodada">
            <ol className="ml-5 list-decimal space-y-1.5">
              <li>A próxima chave sai da fila de chegada e desce comparando nó a nó.</li>
              <li>Ela é inserida na posição de BST. Alturas e FB são recalculados.</li>
              <li>
                Se todos os FB continuarem em {"{-1, 0, +1}"}, a rodada acaba e vem a próxima chave.
              </li>
              <li>
                Se houver |FB| = 2, a árvore treme e aparece “Estrutura instável!”. Clique no nó
                crítico e escolha uma das quatro rotações (atalhos 1 a 4).
              </li>
              <li>
                Acertou: a rotação é animada — nas duplas, as duas etapas aparecem em sequência — e
                você ganha 100 pontos por acerto, dobrados a partir de 3 acertos seguidos.
              </li>
              <li>
                Errou: perde 1 ponto de estabilidade e vê o porquê. A rotação errada{" "}
                <strong className="text-foreground">nunca</strong> é aplicada na árvore: você tenta
                de novo.
              </li>
            </ol>
            <p>
              Cada etapa tem seu som: o tique da descida, o alarme do desbalanceamento, a varredura
              da rotação. O botão no topo da tela de jogo liga e desliga os efeitos sonoros, pelo
              clique ou pelo atalho <strong className="text-foreground">M</strong>.
            </p>
          </Secao>

          <Secao titulo="6. Vitória e derrota">
            <p>
              <strong className="text-fb-zero">Vitória:</strong> inserir todas as chaves da fase
              mantendo a AVL válida. No fim você vê a altura da sua AVL ao lado da altura que uma
              BST comum teria com as mesmas chaves, na mesma ordem.
            </p>
            <p>
              <strong className="text-fb-dois">Derrota:</strong> a barra “Estabilidade da estrutura”
              chega a zero. Sem rebalanceamento a árvore degenera em lista encadeada e a busca passa
              de O(log n) para O(n).
            </p>
          </Secao>
        </div>

        <div className="mt-6 flex gap-2">
          <Button asChild size="lg">
            <Link to="/fases">Começar pela fase 1</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
