/** Tela de jogo: junta HUD, árvore, painel de ação e painéis laterais. */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Eye, Lightbulb, RotateCcw } from "lucide-react";

import { ArvoreSVG } from "@/components/jogo/ArvoreSVG";
import { BotoesRotacao } from "@/components/jogo/BotoesRotacao";
import { FilaDeChegada } from "@/components/jogo/FilaDeChegada";
import { PainelHud } from "@/components/jogo/PainelHud";
import { PainelSemAVL } from "@/components/jogo/PainelSemAVL";
import { TelaFinal } from "@/components/jogo/TelaFinal";
import { Button } from "@/components/ui/button";
import { useEquilibrium } from "@/hooks/useEquilibrium";
import { dicasDoCaso, height, minPossibleHeight, size } from "@/lib/avl";
import { registrarVitoria } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Level } from "@/data/levels";
import type { GameState, TomDoAviso } from "@/hooks/useEquilibrium";

const ESTILO_DO_AVISO: Record<TomDoAviso, string> = {
  acerto: "border-fb-zero/50 bg-fb-zero/10",
  erro: "border-fb-dois/50 bg-fb-dois/10",
  alerta: "border-fb-um/50 bg-fb-um/10",
  info: "border-painel-borda bg-background/50",
};

function instrucaoDaVez(state: GameState): string {
  switch (state.status) {
    case "carregando":
      return "Montando a fila de chaves…";
    case "preparando":
      return "Preparando a próxima chave da fila.";
    case "descendo":
      return `Descendo com a chave ${state.chaveEmTransito ?? ""}: comparando com o nó ${state.caminho[state.passoCaminho] ?? ""}.`;
    case "escolher-no":
      return "Estrutura instável! Clique no nó crítico — o mais profundo com |FB| = 2.";
    case "escolher-rotacao":
      return `Nó crítico ${state.noCritico ?? ""} selecionado. Qual rotação conserta esta subárvore?`;
    case "rotacionando":
      return state.etapasPendentes.length > 0
        ? "Etapa 1 de 2: endireitando o filho antes da rotação final."
        : "Aplicando a rotação e recalculando alturas e FB.";
    case "vitoria":
      return "Fase concluída!";
    case "derrota":
      return "A estrutura degenerou.";
    default:
      return "";
  }
}

export interface TelaDeJogoProps {
  readonly level: Level;
}

export function TelaDeJogo({ level }: TelaDeJogoProps) {
  const { state, resumo, clicarNo, escolherRotacao, revelarFB, reiniciar } = useEquilibrium(level);

  // Recorde e desbloqueio da fase seguinte só na vitória.
  useEffect(() => {
    if (state.status !== "vitoria") return;
    registrarVitoria(level.id, {
      pontuacao: resumo.pontuacao,
      acertos: resumo.acertos,
      erros: resumo.erros,
      melhorCombo: resumo.melhorCombo,
      alturaAVL: resumo.alturaAVL,
      alturaBST: resumo.alturaBST,
      chaves: resumo.chaves,
      data: new Date().toISOString(),
    });
  }, [state.status, level.id, resumo]);

  const escolhendoNo = state.status === "escolher-no";
  const escolhendoRotacao = state.status === "escolher-rotacao";
  const podeRevelar =
    level.custoRevelarFB !== null && !state.fbRevelado && (escolhendoNo || escolhendoRotacao);
  const dicas =
    level.dicas && state.noCritico !== null ? dicasDoCaso(state.arvore, state.noCritico) : [];

  return (
    <main className="min-h-screen bg-background px-3 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/fases">
                <ChevronLeft className="size-4" aria-hidden />
                Fases
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Fase {level.id} · {level.nome}
              </h1>
              <p className="text-xs text-muted-foreground">{level.subtitulo}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={reiniciar} className="gap-1.5">
            <RotateCcw className="size-4" aria-hidden />
            Reiniciar fase
          </Button>
        </header>

        <PainelHud
          level={level}
          pontuacao={state.pontuacao}
          combo={state.combo}
          estabilidade={state.estabilidade}
          chavesRestantes={state.sequencia.length - state.cursor}
          totalDeChaves={state.sequencia.length}
          alturaAtual={height(state.arvore)}
          alturaMinima={minPossibleHeight(size(state.arvore))}
          tempoRestante={state.tempoRestante}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "rounded-xl border bg-painel p-3",
                escolhendoNo || escolhendoRotacao ? "border-fb-dois/60" : "border-painel-borda",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    escolhendoNo || escolhendoRotacao
                      ? "text-fb-dois animate-pulso-alerta"
                      : "text-muted-foreground",
                  )}
                  aria-live="polite"
                >
                  {instrucaoDaVez(state)}
                </p>
                {podeRevelar && (
                  <Button size="sm" variant="secondary" onClick={revelarFB} className="gap-1.5">
                    <Eye className="size-4" aria-hidden />
                    Revelar FB ({level.custoRevelarFB} pts)
                  </Button>
                )}
              </div>

              <div className="h-[clamp(300px,50vh,520px)] rounded-lg bg-background/40 p-2">
                <ArvoreSVG
                  arvore={state.arvore}
                  mostrarFB={state.fbRevelado}
                  noCritico={state.noCritico}
                  destacarCritico={state.noSelecionado !== null || level.destacarCritico}
                  noSelecionado={state.noSelecionado}
                  noErrado={state.noErrado}
                  selecionavel={escolhendoNo}
                  onSelecionar={escolhendoNo ? clicarNo : null}
                  chaveNoCaminho={
                    state.status === "descendo" ? (state.caminho[state.passoCaminho] ?? null) : null
                  }
                  chaveEmTransito={state.chaveEmTransito}
                  tremor={state.tremor}
                  desmoronou={state.desmoronou}
                  className="h-full"
                />
              </div>
            </div>

            <section className="rounded-xl border border-painel-borda bg-painel p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Escolha a rotação {escolhendoRotacao ? "(atalhos 1 a 4)" : ""}
              </h2>
              <BotoesRotacao habilitado={escolhendoRotacao} onEscolher={escolherRotacao} />
              {!escolhendoRotacao && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Os botões liberam quando houver um nó crítico selecionado. O jogo nunca
                  rebalanceia sozinho.
                </p>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-3">
            <FilaDeChegada
              sequencia={state.sequencia}
              cursor={state.cursor}
              chaveEmTransito={state.chaveEmTransito}
            />

            <div className="min-h-[104px]">
              <AnimatePresence mode="wait">
                {state.aviso !== null && (
                  <motion.div
                    key={state.aviso.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.22 }}
                    className={cn("rounded-xl border p-3", ESTILO_DO_AVISO[state.aviso.tom])}
                    role="status"
                    aria-live="polite"
                  >
                    <h2 className="text-sm font-bold text-foreground">{state.aviso.titulo}</h2>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      {state.aviso.texto}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {dicas.length > 0 && (
              <section className="rounded-xl border border-critico/40 bg-critico/10 p-3">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-critico">
                  <Lightbulb className="size-3.5" aria-hidden />
                  Dica passo a passo
                </h2>
                <ol className="mt-2 space-y-1.5 text-sm leading-snug text-foreground">
                  {dicas.map((dica) => (
                    <li key={dica}>{dica}</li>
                  ))}
                </ol>
              </section>
            )}

            <PainelSemAVL bst={state.bst} avl={state.arvore} />
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {(state.status === "vitoria" || state.status === "derrota") && (
          <TelaFinal
            tipo={state.status}
            level={level}
            resumo={resumo}
            onTentarNovamente={reiniciar}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
