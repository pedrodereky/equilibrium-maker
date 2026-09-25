import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LEVELS } from "@/data/levels";
import { limparProgresso, lerProgresso, PROGRESSO_INICIAL, type Progresso } from "@/lib/storage";

export const Route = createFileRoute("/recordes")({
  head: () => ({
    meta: [
      { title: "Recordes — Equilíbrium" },
      { name: "description", content: "Suas melhores pontuações em cada fase do Equilíbrium." },
    ],
  }),
  component: Recordes,
});

function Recordes() {
  const [progresso, setProgresso] = useState<Progresso>(PROGRESSO_INICIAL);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    setProgresso(lerProgresso());
    setCarregou(true);
  }, []);

  const temAlgum = Object.keys(progresso.recordes).length > 0;

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/">
            <ChevronLeft className="size-4" aria-hidden />
            Menu
          </Link>
        </Button>

        <h1 className="mt-4 text-4xl font-black text-foreground">Recordes</h1>
        <p className="mt-2 text-muted-foreground">
          Guardados neste navegador (localStorage). Sem ranking online nesta versão.
        </p>

        <div className="mt-7 overflow-x-auto rounded-xl border border-painel-borda bg-painel">
          <table className="w-full text-sm">
            <caption className="sr-only">Melhor pontuação por fase</caption>
            <thead>
              <tr className="border-b border-painel-borda text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-2 font-semibold">
                  Fase
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Pontuação
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Acertos
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Erros
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  AVL / BST
                </th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((level) => {
                const recorde = progresso.recordes[String(level.id)];
                return (
                  <tr key={level.id} className="border-b border-painel-borda/60 last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                      {level.id}. {level.nome}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {level.subtitulo}
                      </span>
                    </th>
                    {recorde === undefined ? (
                      <td colSpan={4} className="px-4 py-3 text-right text-muted-foreground">
                        {carregou ? "ainda sem recorde" : "…"}
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                          {recorde.pontuacao.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-fb-zero">
                          {recorde.acertos}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-fb-dois">
                          {recorde.erros}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          altura {recorde.alturaAVL} / {recorde.alturaBST}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/fases">Jogar</Link>
          </Button>
          {temAlgum && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setProgresso(limparProgresso())}
            >
              <Trash2 className="size-4" aria-hidden />
              Apagar recordes e progresso
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
