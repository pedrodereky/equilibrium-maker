import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Play, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Equilíbrium — jogo de Árvores AVL" },
      {
        name: "description",
        content:
          "Jogo educativo de Árvores AVL para Estruturas de Dados II: identifique o nó crítico e escolha a rotação certa antes que a árvore degenere.",
      },
      { property: "og:title", content: "Equilíbrium — jogo de Árvores AVL" },
      {
        property: "og:description",
        content: "Aqui a árvore não se rebalanceia sozinha. Quem corrige é você.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Menu,
});

function Menu() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-critico">
          Estruturas de Dados II
        </p>
        <h1 className="mt-3 text-6xl font-black tracking-tight text-foreground sm:text-7xl">
          Equilíbrium
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          No VisuAlgo você digita a chave e assiste. Aqui a árvore{" "}
          <strong className="text-foreground">nunca se rebalanceia sozinha</strong>: a cada
          desequilíbrio, é você quem acha o nó crítico e escolhe a rotação. Errar demais e a AVL
          degenera em lista encadeada — O(log n) vira O(n).
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
            <Link to="/fases">
              <Play className="size-5" aria-hidden />
              Jogar
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
            <Link to="/como-jogar">
              <BookOpen className="size-5" aria-hidden />
              Como jogar
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full gap-2 sm:w-auto">
            <Link to="/recordes">
              <Trophy className="size-5" aria-hidden />
              Recordes
            </Link>
          </Button>
        </div>

        <dl className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { t: "4 fases", d: "Do tutorial de rotações simples ao modo contra o tempo." },
            { t: "4 casos", d: "LL, RR, LR e RL, com explicação a cada acerto e a cada erro." },
            { t: "Sem AVL", d: "Compare, a cada chave, com a BST comum que ninguém equilibra." },
          ].map((item) => (
            <div key={item.t} className="rounded-xl border border-painel-borda bg-painel p-3">
              <dt className="text-sm font-bold text-foreground">{item.t}</dt>
              <dd className="mt-1 text-xs leading-snug text-muted-foreground">{item.d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
