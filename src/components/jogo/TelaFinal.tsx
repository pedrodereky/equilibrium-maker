/** Telas de resultado: vitória e derrota (árvore degenerada em lista). */

import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Home, RotateCcw, Trophy, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LEVELS, type Level } from "@/data/levels";
import type { ResumoDaPartida } from "@/hooks/useEquilibrium";

export interface TelaFinalProps {
  readonly tipo: "vitoria" | "derrota";
  readonly level: Level;
  readonly resumo: ResumoDaPartida;
  readonly onTentarNovamente: () => void;
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-lg border border-painel-borda bg-background/60 px-3 py-2 text-center">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</div>
      <div className="text-2xl font-bold tabular-nums text-foreground">{valor}</div>
      {detalhe !== undefined && <div className="text-[11px] text-muted-foreground">{detalhe}</div>}
    </div>
  );
}

export function TelaFinal({ tipo, level, resumo, onTentarNovamente }: TelaFinalProps) {
  const proxima = LEVELS.find((l) => l.id === level.id + 1);
  const economia = resumo.alturaBST - resumo.alturaAVL;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: tipo === "derrota" ? 1.8 : 0.3, duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={tipo === "vitoria" ? "Fase concluída" : "Fim de jogo"}
    >
      <motion.div
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{
          delay: tipo === "derrota" ? 1.9 : 0.35,
          type: "spring",
          stiffness: 180,
          damping: 22,
        }}
        className="w-full max-w-2xl rounded-2xl border border-painel-borda bg-painel p-6 shadow-2xl"
      >
        {tipo === "vitoria" ? (
          <>
            <div className="flex items-center gap-3">
              <Trophy className="size-8 text-fb-um" aria-hidden />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Fase {level.id} concluída: {level.nome}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Todas as chaves entraram e a árvore continua AVL válida.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Numero rotulo="Pontuação" valor={resumo.pontuacao.toLocaleString("pt-BR")} />
              <Numero rotulo="Acertos" valor={`${resumo.acertos}`} />
              <Numero rotulo="Erros" valor={`${resumo.erros}`} />
              <Numero rotulo="Melhor combo" valor={`${resumo.melhorCombo}`} />
            </div>

            <div className="mt-3 rounded-lg border border-painel-borda bg-background/60 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Altura final com as mesmas {resumo.chaves} chaves
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Sua AVL
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-fb-zero">
                    {resumo.alturaAVL}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    BST comum
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-fb-dois">
                    {resumo.alturaBST}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {economia > 0
                  ? `A AVL ficou ${economia} ${economia === 1 ? "nível" : "níveis"} mais baixa: no pior caso, são ${economia} ${economia === 1 ? "comparação" : "comparações"} a menos em cada busca.`
                  : "Nesta sequência a BST comum já nasceu equilibrada — mas basta uma ordem infeliz de chaves para ela degenerar."}
              </p>
              <p className="mt-2 font-mono text-xs break-words text-muted-foreground">
                Pré-ordem final: {resumo.preOrdem.join(", ")}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <TriangleAlert className="size-8 text-fb-dois" aria-hidden />
              <div>
                <h2 className="text-2xl font-bold text-foreground">A estrutura desabou</h2>
                <p className="text-sm text-muted-foreground">
                  A barra de estabilidade chegou a zero na fase {level.id}.
                </p>
              </div>
            </div>

            <p className="mt-5 rounded-lg border border-fb-dois/40 bg-fb-dois/10 p-4 text-base leading-relaxed text-foreground">
              Sem rebalanceamento, a árvore degenerou em lista encadeada: a busca passou de O(log n)
              para O(n). Tente novamente!
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Numero rotulo="Pontuação" valor={resumo.pontuacao.toLocaleString("pt-BR")} />
              <Numero rotulo="Acertos" valor={`${resumo.acertos}`} />
              <Numero rotulo="Erros" valor={`${resumo.erros}`} />
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onTentarNovamente} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            {tipo === "vitoria" ? "Jogar de novo" : "Tentar de novo"}
          </Button>
          {tipo === "vitoria" && proxima !== undefined && (
            <Button asChild variant="secondary">
              <Link to="/jogo/$faseId" params={{ faseId: String(proxima.id) }}>
                Próxima fase: {proxima.nome}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="gap-2">
            <Link to="/fases">Seleção de fase</Link>
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/">
              <Home className="size-4" aria-hidden />
              Menu
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
