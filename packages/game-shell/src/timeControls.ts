export interface TimeControl {
  initialMs: number;
  incrementMs: number;
}

export type TimeCategory = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface TimeControlPreset {
  id: string;
  minutes: number;
  increment: number;
  category: TimeCategory;
}

export type TimeControlChoice =
  | { kind: 'none' }
  | { kind: 'preset'; id: string }
  | { kind: 'custom'; minutes: number; increment: number };

export const TIME_CATEGORIES: readonly TimeCategory[] = ['bullet', 'blitz', 'rapid', 'classical'];

const preset = (minutes: number, increment: number, category: TimeCategory): TimeControlPreset => ({
  id: `${minutes}+${increment}`,
  minutes,
  increment,
  category,
});

export const PRESETS: readonly TimeControlPreset[] = [
  preset(1, 0, 'bullet'),
  preset(2, 1, 'bullet'),
  preset(3, 0, 'blitz'),
  preset(3, 2, 'blitz'),
  preset(5, 0, 'blitz'),
  preset(5, 3, 'blitz'),
  preset(10, 0, 'rapid'),
  preset(10, 5, 'rapid'),
  preset(15, 10, 'rapid'),
  preset(30, 0, 'classical'),
  preset(30, 20, 'classical'),
];

/** Pools offered by online quick match. */
export const QUICK_MATCH_PRESET_IDS = ['3+2', '5+0', '10+0'] as const;

export const CUSTOM_LIMITS = { minMinutes: 1, maxMinutes: 180, minIncrement: 0, maxIncrement: 60 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Math.round(value), min), max);

export function toTimeControl(choice: TimeControlChoice): TimeControl | null {
  switch (choice.kind) {
    case 'none':
      return null;
    case 'preset': {
      const found = PRESETS.find((p) => p.id === choice.id);
      return found ? { initialMs: found.minutes * 60_000, incrementMs: found.increment * 1000 } : null;
    }
    case 'custom': {
      const minutes = clamp(choice.minutes, CUSTOM_LIMITS.minMinutes, CUSTOM_LIMITS.maxMinutes);
      const increment = clamp(choice.increment, CUSTOM_LIMITS.minIncrement, CUSTOM_LIMITS.maxIncrement);
      return { initialMs: minutes * 60_000, incrementMs: increment * 1000 };
    }
  }
}
