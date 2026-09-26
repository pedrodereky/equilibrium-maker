import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { TelaDeJogo } from "@/components/jogo/TelaDeJogo";
import { Button } from "@/components/ui/button";
import { getLevel } from "@/data/levels";

export const Route = createFileRoute("/jogo/$faseId")({
  loader: ({ params }) => {
    const level = getLevel(Number.parseInt(params.faseId, 10));
    if (level === undefined) throw notFound();
    return { level };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData === undefined
            ? "Equilíbrium"
            : `Fase ${loaderData.level.id}: ${loaderData.level.nome} — Equilíbrium`,
      },
      { name: "description", content: loaderData?.level.descricao ?? "Jogo de Árvores AVL." },
    ],
  }),
  notFoundComponent: FaseInexistente,
  component: Jogo,
});

function FaseInexistente() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Essa fase não existe</h1>
        <p className="mt-2 text-muted-foreground">O Equilíbrium tem quatro fases, de 1 a 4.</p>
        <Button asChild className="mt-5">
          <Link to="/fases">Voltar para a seleção de fase</Link>
        </Button>
      </div>
    </main>
  );
}

function Jogo() {
  const { level } = Route.useLoaderData();
  // A chave força um estado limpo ao trocar de fase sem sair da rota.
  return <TelaDeJogo key={level.id} level={level} />;
}
