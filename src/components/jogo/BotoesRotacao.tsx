/** Os quatro botões de rotação, com atalhos de teclado 1–4. */

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ROTATION_CASES, ROTATION_LABELS, type RotationCase } from "@/lib/avl";
import { cn } from "@/lib/utils";

const DESENHO: Record<RotationCase, string> = {
  LL: "z pende para a esquerda e o filho também → sobe o filho esquerdo",
  RR: "z pende para a direita e o filho também → sobe o filho direito",
  LR: "z pende para a esquerda e o filho para a direita → sobe o neto",
  RL: "z pende para a direita e o filho para a esquerda → sobe o neto",
};

export interface BotoesRotacaoProps {
  readonly habilitado: boolean;
  readonly onEscolher: (rotacao: RotationCase) => void;
}

export function BotoesRotacao({ habilitado, onEscolher }: BotoesRotacaoProps) {
  useEffect(() => {
    if (!habilitado) return undefined;
    const aoTeclar = (evento: KeyboardEvent) => {
      const indice = Number.parseInt(evento.key, 10) - 1;
      const rotacao = ROTATION_CASES[indice];
      if (rotacao === undefined) return;
      evento.preventDefault();
      onEscolher(rotacao);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [habilitado, onEscolher]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ROTATION_CASES.map((rotacao, indice) => (
        <Button
          key={rotacao}
          type="button"
          variant="outline"
          disabled={!habilitado}
          onClick={() => onEscolher(rotacao)}
          className={cn(
            "h-auto min-h-16 flex-col items-start gap-1 whitespace-normal border-painel-borda bg-painel px-3 py-2.5 text-left",
            habilitado && "hover:border-destaque hover:bg-accent",
          )}
        >
          <span className="flex w-full items-center gap-2 text-sm font-semibold text-foreground">
            <kbd className="rounded border border-painel-borda bg-background px-1.5 py-0.5 text-[11px] font-mono">
              {indice + 1}
            </kbd>
            {ROTATION_LABELS[rotacao]}
          </span>
          <span className="text-[11px] leading-snug font-normal text-muted-foreground">
            {DESENHO[rotacao]}
          </span>
        </Button>
      ))}
    </div>
  );
}
