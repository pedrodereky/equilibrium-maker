/**
 * Persistência local do Equilíbrium: fases desbloqueadas e recordes.
 * Sem backend nesta versão — tudo em localStorage.
 */

const CHAVE_ARMAZENAMENTO = "equilibrium:v1";

export interface Recorde {
  readonly pontuacao: number;
  readonly acertos: number;
  readonly erros: number;
  readonly melhorCombo: number;
  readonly alturaAVL: number;
  readonly alturaBST: number;
  readonly chaves: number;
  readonly data: string;
}

export interface Progresso {
  readonly fasesDesbloqueadas: number;
  readonly recordes: Readonly<Record<string, Recorde>>;
}

export const PROGRESSO_INICIAL: Progresso = { fasesDesbloqueadas: 1, recordes: {} };

function disponivel(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function lerProgresso(): Progresso {
  if (!disponivel()) return PROGRESSO_INICIAL;
  try {
    const bruto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (bruto === null) return PROGRESSO_INICIAL;
    const dados = JSON.parse(bruto) as Partial<Progresso>;
    return {
      fasesDesbloqueadas:
        typeof dados.fasesDesbloqueadas === "number" ? dados.fasesDesbloqueadas : 1,
      recordes: typeof dados.recordes === "object" && dados.recordes !== null ? dados.recordes : {},
    };
  } catch {
    return PROGRESSO_INICIAL;
  }
}

function gravar(progresso: Progresso): Progresso {
  if (!disponivel()) return progresso;
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(progresso));
  } catch {
    // Modo privado ou cota cheia: o jogo continua, só não guarda o progresso.
  }
  return progresso;
}

/** Guarda o recorde se ele for melhor que o anterior e libera a fase seguinte. */
export function registrarVitoria(faseId: number, recorde: Recorde): Progresso {
  const atual = lerProgresso();
  const anterior = atual.recordes[String(faseId)];
  const melhor =
    anterior === undefined || recorde.pontuacao > anterior.pontuacao ? recorde : anterior;

  return gravar({
    fasesDesbloqueadas: Math.max(atual.fasesDesbloqueadas, faseId + 1),
    recordes: { ...atual.recordes, [String(faseId)]: melhor },
  });
}

export function limparProgresso(): Progresso {
  if (disponivel()) {
    try {
      window.localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    } catch {
      // ignorado
    }
  }
  return PROGRESSO_INICIAL;
}

export function faseDesbloqueada(progresso: Progresso, faseId: number): boolean {
  return faseId <= progresso.fasesDesbloqueadas;
}
