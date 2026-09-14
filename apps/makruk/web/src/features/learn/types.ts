import type { PieceType } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';

/** Lesson text lives with the lesson data, in both languages. */
export interface L10n {
  th: string;
  en: string;
}

/** A counting-rule example the engine must agree with (checked in lessons.test.ts). */
export interface CountingExample {
  fen: string;
  move: string;
  /** Expected limit in moves after `move`; 0 means no counting applies. */
  limitMoves: number;
  kind?: 'board' | 'pieces';
}

export type LessonStep =
  /** Explanation, optionally with a position and highlighted squares. */
  | { kind: 'info'; text: L10n; fen?: string; highlight?: string[]; counting?: CountingExample }
  /** Play one of the solution moves (coordinate notation). */
  | { kind: 'move'; text: L10n; fen: string; solutions: string[]; hint?: L10n; success?: L10n }
  /**
   * Tap exactly the answer squares, then check. When `targetsOf` is set, the answer must equal
   * that piece's legal destinations (enforced by lessons.test.ts).
   */
  | { kind: 'squares'; text: L10n; fen: string; answer: string[]; targetsOf?: string; hint?: L10n }
  /** Multiple choice. */
  | { kind: 'quiz'; text: L10n; choices: L10n[]; correct: number; fen?: string; hint?: L10n; counting?: CountingExample };

export type LessonIcon = PieceType | 'board' | 'promotion' | 'check' | 'mate' | 'count' | 'game';

export interface Lesson {
  id: string;
  icon: LessonIcon;
  title: L10n;
  summary: L10n;
  xp: number;
  steps: LessonStep[];
  /** Special lessons open a dedicated route instead of the step player. */
  route?: string;
}

export interface Unit {
  id: string;
  title: L10n;
  lessons: Lesson[];
}

export function useL10n() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'th';
  return (text: L10n) => text[lang];
}
