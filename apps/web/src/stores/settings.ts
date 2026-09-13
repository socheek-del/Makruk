import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'th' | 'en';
export type ColorScheme = 'system' | 'light' | 'dark';

export interface Settings {
  language: Language;
  colorScheme: ColorScheme;
  boardTheme: string;
  pieceSet: string;
  sound: boolean;
  showCoordinates: boolean;
  autoRotate: boolean;
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
  showCoordinates: true,
  autoRotate: false,
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
