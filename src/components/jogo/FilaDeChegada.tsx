/** Fila de chegada: a chave atual e as próximas três. */

import { cn } from "@/lib/utils";

export interface FilaDeChegadaProps {
  readonly sequencia: readonly number[];
  readonly cursor: number;
  readonly chaveEmTransito: number | null;
}

export function FilaDeChegada({ sequencia, cursor, chaveEmTransito }: FilaDeChegadaProps) {
  const proximas = sequencia.slice(cursor, cursor + 3);
  const restantes = Math.max(0, sequencia.length - cursor - proximas.length);

  return (
    <section className="rounded-xl border border-painel-borda bg-painel p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Fila de chegada
      </h2>

      <div className="mt-2 flex items-center gap-2">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-bold tabular-nums",
            chaveEmTransito === null
              ? "border-dashed border-painel-borda text-muted-foreground"
              : "border-destaque bg-destaque text-background",
          )}
          aria-label={
            chaveEmTransito === null
              ? "Nenhuma chave descendo"
              : `Chave ${chaveEmTransito} sendo inserida`
          }
        >
          {chaveEmTransito ?? "—"}
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {proximas.length === 0 ? (
            <span className="text-sm text-muted-foreground">Fila vazia.</span>
          ) : (
            proximas.map((chave, indice) => (
              <span
                key={`${chave}-${indice}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border text-sm font-semibold tabular-nums",
                  indice === 0
                    ? "border-foreground/40 bg-background text-foreground"
                    : "border-painel-borda bg-background/50 text-muted-foreground",
                )}
              >
                {chave}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {chaveEmTransito === null ? "Próximas chaves" : "Descendo agora"} · mais {restantes} depois
        destas.
      </p>
    </section>
  );
}
