/**
 * Efeitos sonoros do Equilíbrium.
 *
 * Os sons são sintetizados com a Web Audio API, sem nenhum arquivo de áudio:
 * o repositório continua leve, o jogo funciona offline e não há download para
 * atrasar a primeira rodada.
 *
 * O módulo é o dono da preferência de som: `tocar` não faz nada quando o
 * jogador desliga o áudio, então quem chama não precisa verificar nada.
 */

import { lerSomLigado, gravarSomLigado } from "@/lib/storage";

export type EfeitoSonoro =
  | "comparacao"
  | "insercao"
  | "instavel"
  | "acerto"
  | "rotacao"
  | "revelar"
  | "erro"
  | "tempo"
  | "vitoria"
  | "derrota";

interface Nota {
  readonly freq: number;
  /** Frequência final, quando a nota deve varrer (efeito de "whoosh"). */
  readonly freqFinal: number | null;
  /** Atraso em segundos desde o início do efeito. */
  readonly atraso: number;
  readonly duracao: number;
  readonly onda: OscillatorType;
  readonly volume: number;
}

function nota(
  freq: number,
  atraso: number,
  duracao: number,
  onda: OscillatorType,
  volume: number,
  freqFinal: number | null = null,
): Nota {
  return { freq, freqFinal, atraso, duracao, onda, volume };
}

/** Arpejo ascendente/descendente a partir de uma lista de frequências. */
function sequencia(
  freqs: readonly number[],
  passo: number,
  duracao: number,
  onda: OscillatorType,
  volume: number,
): Nota[] {
  return freqs.map((freq, i) => nota(freq, i * passo, duracao, onda, volume));
}

const RECEITAS: Record<EfeitoSonoro, readonly Nota[]> = {
  // Tique curto e discreto a cada comparação da descida.
  comparacao: [nota(680, 0, 0.05, "sine", 0.09)],
  // A chave assenta na posição de BST.
  insercao: [nota(523.25, 0, 0.09, "triangle", 0.16), nota(784, 0.07, 0.11, "triangle", 0.13)],
  // Alarme de |FB| = 2: grave e descendente.
  instavel: [
    nota(320, 0, 0.18, "sawtooth", 0.14, 190),
    nota(240, 0.16, 0.26, "sawtooth", 0.13, 150),
  ],
  // Nó crítico identificado.
  acerto: [nota(659.25, 0, 0.09, "sine", 0.17), nota(880, 0.08, 0.13, "sine", 0.17)],
  // Rotação aplicada: varredura ascendente, uma por etapa.
  rotacao: [nota(420, 0, 0.26, "triangle", 0.18, 960)],
  revelar: [nota(1046.5, 0, 0.1, "sine", 0.12)],
  erro: [nota(190, 0, 0.26, "square", 0.12, 110)],
  // Tique do cronômetro nos últimos segundos.
  tempo: [nota(1200, 0, 0.04, "square", 0.07)],
  vitoria: sequencia([523.25, 659.25, 783.99, 1046.5], 0.11, 0.24, "triangle", 0.18),
  // A árvore degenerando em lista encadeada.
  derrota: sequencia([392, 329.63, 261.63, 196], 0.17, 0.42, "sawtooth", 0.16),
};

type ConstrutorDeAudio = typeof AudioContext;

function obterConstrutor(): ConstrutorDeAudio | null {
  if (typeof window === "undefined") return null;
  const compativel = window as typeof window & { webkitAudioContext?: ConstrutorDeAudio };
  return window.AudioContext ?? compativel.webkitAudioContext ?? null;
}

let contexto: AudioContext | null = null;
let mestre: GainNode | null = null;
let ligado: boolean | null = null;

/** O contexto só nasce no primeiro som, depois de o jogador já ter interagido. */
function obterContexto(): { ctx: AudioContext; saida: GainNode } | null {
  if (contexto !== null && mestre !== null) return { ctx: contexto, saida: mestre };

  const Construtor = obterConstrutor();
  if (Construtor === null) return null;

  try {
    const ctx = new Construtor();
    const saida = ctx.createGain();
    saida.gain.value = 0.32;
    saida.connect(ctx.destination);
    contexto = ctx;
    mestre = saida;
    return { ctx, saida };
  } catch {
    // Sem áudio disponível: o jogo segue em silêncio.
    return null;
  }
}

export function somEstaLigado(): boolean {
  if (ligado === null) ligado = lerSomLigado();
  return ligado;
}

export function definirSom(novoValor: boolean): boolean {
  ligado = novoValor;
  gravarSomLigado(novoValor);
  if (novoValor)
    obterContexto()
      ?.ctx.resume()
      .catch(() => undefined);
  return novoValor;
}

export function alternarSom(): boolean {
  return definirSom(!somEstaLigado());
}

function agendar(ctx: AudioContext, saida: GainNode, n: Nota, inicio: number): void {
  const osc = ctx.createOscillator();
  const envelope = ctx.createGain();
  const t0 = inicio + n.atraso;
  const fim = t0 + n.duracao;

  osc.type = n.onda;
  osc.frequency.setValueAtTime(n.freq, t0);
  if (n.freqFinal !== null) osc.frequency.exponentialRampToValueAtTime(n.freqFinal, fim);

  // Ataque rápido e queda exponencial: sem estalo no início nem no fim.
  envelope.gain.setValueAtTime(0.0001, t0);
  envelope.gain.exponentialRampToValueAtTime(n.volume, t0 + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, fim);

  osc.connect(envelope);
  envelope.connect(saida);
  osc.start(t0);
  osc.stop(fim + 0.03);
}

/** Toca um efeito. Silencioso quando o som está desligado ou indisponível. */
export function tocar(efeito: EfeitoSonoro): void {
  if (!somEstaLigado()) return;

  const audio = obterContexto();
  if (audio === null) return;

  const { ctx, saida } = audio;
  // O navegador suspende o contexto até haver um gesto do jogador.
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

  const inicio = ctx.currentTime + 0.01;
  for (const n of RECEITAS[efeito]) {
    try {
      agendar(ctx, saida, n, inicio);
    } catch {
      // Um oscilador que falha não pode derrubar a rodada.
      return;
    }
  }
}
