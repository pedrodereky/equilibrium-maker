/** HUD da partida: fase, pontuação, combo, estabilidade, fila e alturas. */

import { Clock, Gauge, Layers, Sparkles, Target, TrendingUp } from "lucide-react";

import { COMBO_PARA_MULTIPLICAR } from "@/hooks/useEquilibrium";
import { cn } from "@/lib/utils";
import type { Level } from "@/data/levels";

export interface PainelHudProps {
  readonly level: Level;
  readonly pontuacao: number;
  readonly combo: number;
  readonly estabilidade: number;
  readonly chavesRestantes: number;
  readonly totalDeChaves: number;
  readonly alturaAtual: number;
  readonly alturaMinima: number;
  readonly tempoRestante: number | null;
}

function Cartao({
  icone,
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-painel-borda bg-painel px-3 py-2",
        destaque && "border-destaque",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{valor}</div>
      {detalhe !== undefined && <div className="text-[11px] text-muted-foreground">{detalhe}</div>}
    </div>
  );
}

/** Barra de estabilidade: um bloco por ponto, com o número sempre ao lado. */
function BarraDeEstabilidade({ atual, total }: { atual: number; total: number }) {
  return (
    <div className="rounded-lg border border-painel-borda bg-painel px-3 py-2">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Gauge className="size-3.5" aria-hidden />
          Estabilidade
        </span>
        <span className="tabular-nums text-foreground">
          {atual}/{total}
        </span>
      </div>
      <div
        className="mt-2 flex gap-1"
        role="meter"
        aria-valuenow={atual}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Estabilidade da estrutura"
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-full transition-colors",
              i < atual ? "bg-fb-zero" : "bg-muted",
              i < atual && atual === 1 && "bg-fb-dois",
              i < atual && atual === 2 && total > 3 && "bg-fb-um",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function PainelHud({
  level,
  pontuacao,
  combo,
  estabilidade,
  chavesRestantes,
  totalDeChaves,
  alturaAtual,
  alturaMinima,
  tempoRestante,
}: PainelHudProps) {
  const multiplicando = combo >= COMBO_PARA_MULTIPLICAR;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      <Cartao
        icone={<Layers className="size-3.5" aria-hidden />}
        rotulo="Fase"
        valor={`${level.id}`}
        detalhe={level.nome}
      />
      <Cartao
        icone={<Sparkles className="size-3.5" aria-hidden />}
        rotulo="Pontuação"
        valor={pontuacao.toLocaleString("pt-BR")}
      />
      <Cartao
        icone={<TrendingUp className="size-3.5" aria-hidden />}
        rotulo="Combo"
        valor={`${combo}`}
        detalhe={
          multiplicando ? "multiplicador ×2 ativo" : `×2 a partir de ${COMBO_PARA_MULTIPLICAR}`
        }
        {...(multiplicando ? { destaque: true } : {})}
      />
      <BarraDeEstabilidade atual={estabilidade} total={level.estabilidade} />
      <Cartao
        icone={<Target className="size-3.5" aria-hidden />}
        rotulo="Chaves restantes"
        valor={`${chavesRestantes}`}
        detalhe={`de ${totalDeChaves}`}
      />
      <Cartao
        icone={<Gauge className="size-3.5" aria-hidden />}
        rotulo="Altura da AVL"
        valor={`${alturaAtual}`}
        detalhe={`mínima possível: ${alturaMinima}`}
      />
      {tempoRestante !== null ? (
        <Cartao
          icone={<Clock className="size-3.5" aria-hidden />}
          rotulo="Tempo"
          valor={`${tempoRestante}s`}
          detalhe="para corrigir"
          destaque={tempoRestante <= 5}
        />
      ) : (
        <Cartao
          icone={<Clock className="size-3.5" aria-hidden />}
          rotulo="Tempo"
          valor="—"
          detalhe="sem cronômetro"
        />
      )}
    </div>
  );
}
