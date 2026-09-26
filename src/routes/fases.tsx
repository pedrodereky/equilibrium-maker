import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Lock, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LEVELS } from "@/data/levels";
import { lerProgresso, PROGRESSO_INICIAL, type Progresso } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fases")({
  head: () => ({
    meta: [
      { title: "Seleção de fase — Equilíbrium" },
      { name: "description", content: "Escolha uma das quatro fases do Equilíbrium." },
    ],
  }),
  component: SelecaoDeFase,
});

function SelecaoDeFase() {
  // O progresso vive no localStorage, então só pode ser lido depois da hidratação.
  const [progresso, setProgresso] = useState<Progresso>(PROGRESSO_INICIAL);
  useEffect(() => setProgresso(lerProgresso()), []);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/">
            <ChevronLeft className="size-4" aria-hidden />
            Menu
          </Link>
        </Button>

        <h1 className="mt-4 text-4xl font-black text-foreground">Seleção de fase</h1>
        <p className="mt-2 text-muted-foreground">
          As fases liberam em ordem: conclua uma para abrir a próxima.
        </p>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((level) => {
            const liberada = level.id <= progresso.fasesDesbloqueadas;
            const recorde = progresso.recordes[String(level.id)];

            return (
              <li key={level.id}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-xl border bg-painel p-4",
                    liberada ? "border-painel-borda" : "border-painel-borda/50 opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-critico">
                        Fase {level.id}
                      </p>
                      <h2 className="text-xl font-bold text-foreground">{level.nome}</h2>
                      <p className="text-sm text-muted-foreground">{level.subtitulo}</p>
                    </div>
                    {!liberada && <Lock className="size-5 text-muted-foreground" aria-hidden />}
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-snug text-muted-foreground">
                    {level.descricao}
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    <li className="rounded border border-painel-borda px-1.5 py-0.5">
                      {level.estabilidade} de estabilidade
                    </li>
                    <li className="rounded border border-painel-borda px-1.5 py-0.5">
                      {level.mostrarFB ? "FB visível" : "FB oculto"}
                    </li>
                    {level.destacarCritico && (
                      <li className="rounded border border-painel-borda px-1.5 py-0.5">
                        nó crítico destacado
                      </li>
                    )}
                    {level.tempoPorCorrecao !== null && (
                      <li className="rounded border border-painel-borda px-1.5 py-0.5">
                        {level.tempoPorCorrecao}s por correção
                      </li>
                    )}
                  </ul>

                  {recorde !== undefined && (
                    <p className="mt-2 text-xs text-fb-um">
                      Recorde: {recorde.pontuacao.toLocaleString("pt-BR")} pontos
                    </p>
                  )}

                  <div className="mt-4">
                    {liberada ? (
                      <Button asChild className="w-full gap-2">
                        <Link to="/jogo/$faseId" params={{ faseId: String(level.id) }}>
                          <Play className="size-4" aria-hidden />
                          Jogar fase {level.id}
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="w-full gap-2">
                        <Lock className="size-4" aria-hidden />
                        Conclua a fase {level.id - 1}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
