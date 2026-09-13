import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TimeControlChoice } from '../features/game/timeControls';

export type Language = 'th' | 'en';
export type ColorScheme = 'system' | 'light' | 'dark';
/** Pass-and-play board view: fixed, rotate to the side to move, or tabletop (opponent's bar upside down). */
export type PassAndPlayView = 'fixed' | 'rotate' | 'tabletop';

export interface Settings {
  language: Language;
  colorScheme: ColorScheme;
  boardTheme: string;
  pieceSet: string;
  sound: boolean;
  haptics: boolean;
  showCoordinates: boolean;
  passAndPlayView: PassAndPlayView;
  timeControl: TimeControlChoice;
  computerLevel: number;
  computerSide: 'w' | 'b' | 'random';
  onlineTimeControl: TimeControlChoice;
  onlineColor: 'w' | 'b' | 'random';
  onlineRated: boolean;
}

export interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'th',
  colorScheme: 'system',
  boardTheme: 'teak',
  pieceSet: 'classic',
  sound: true,
  haptics: true,
  showCoordinates: true,
  passAndPlayView: 'fixed',
  timeControl: { kind: 'none' },
  computerLevel: 2,
  computerSide: 'w',
  onlineTimeControl: { kind: 'preset', id: '5+0' },
  onlineColor: 'random',
  onlineRated: true,
};

export const SETTINGS_STORAGE_KEY = 'makruk.settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ update: _update, ...settings }) => settings,
    },
  ),
);
