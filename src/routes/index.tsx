import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "Uma página simples de boas-vindas." },
      { property: "og:title", content: "Hello World" },
      { property: "og:description", content: "Uma página simples de boas-vindas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Minha primeira página
        </p>
        <h1 className="text-5xl font-bold text-foreground sm:text-7xl">
          Hello World
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Olá, mundo! É muito bom ter você por aqui.
        </p>
      </section>
    </main>
  );
}
