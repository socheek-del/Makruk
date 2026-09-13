import type { GameStatus, MoveRecord } from '@makruk/engine';
import { useSettings } from '../../stores/settings';

/**
 * polish-003: tiny synthesized sound effects (Web Audio, no audio files) plus phone vibration.
 * Everything is best-effort: missing APIs or autoplay restrictions simply mean silence.
 */
export type SoundName = 'move' | 'capture' | 'check' | 'gameEnd' | 'correct' | 'wrong';

declare global {
  interface Window {
    /** Names of sounds played in this page — lets tests observe audio without real speakers. */
    __makrukSoundLog?: SoundName[];
  }
}

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
  context ??= new window.AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain: number, endFreq?: number) {
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const volume = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  volume.gain.setValueAtTime(gain, t);
  volume.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(volume).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** A short filtered noise burst: sounds like a wooden piece placed on the board. */
function knock(ac: AudioContext, start: number, gain: number, freq: number) {
  const length = Math.floor(ac.sampleRate * 0.06);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const volume = ac.createGain();
  volume.gain.value = gain;
  source.connect(filter).connect(volume).connect(ac.destination);
  source.start(ac.currentTime + start);
}

const PATTERNS: Record<SoundName, (ac: AudioContext) => void> = {
  move: (ac) => knock(ac, 0, 0.6, 900),
  capture: (ac) => {
    knock(ac, 0, 0.7, 650);
    knock(ac, 0.05, 0.45, 1200);
  },
  check: (ac) => {
    tone(ac, 880, 0, 0.09, 'triangle', 0.15);
    tone(ac, 660, 0.1, 0.12, 'triangle', 0.15);
  },
  gameEnd: (ac) => [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.09, 0.2, 'triangle', 0.12)),
  correct: (ac) => [660, 880, 1175].forEach((f, i) => tone(ac, f, i * 0.07, 0.14, 'sine', 0.16)),
  wrong: (ac) => tone(ac, 220, 0, 0.28, 'sawtooth', 0.07, 140),
};

const VIBRATION: Partial<Record<SoundName, number | number[]>> = {
  move: 12,
  capture: [18, 30, 18],
  check: [30, 40, 30],
  wrong: [40, 30, 40],
  gameEnd: [60, 40, 60],
};

export function playSound(name: SoundName): void {
  const { sound, haptics } = useSettings.getState();
  const pattern = VIBRATION[name];
  if (haptics && pattern !== undefined && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration blocked (e.g. no user gesture yet).
    }
  }
  if (!sound) return;
  (window.__makrukSoundLog ??= []).push(name);
  const ac = audio();
  if (!ac) return;
  try {
    PATTERNS[name](ac);
  } catch {
    // Audio unavailable.
  }
}

export function soundForMove(record: MoveRecord, status: GameStatus): SoundName {
  if (status.kind !== 'ongoing') return 'gameEnd';
  if (record.san.endsWith('+')) return 'check';
  return record.captured ? 'capture' : 'move';
}
