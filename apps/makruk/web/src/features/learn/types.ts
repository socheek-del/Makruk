import { type L10n, type Lesson as SharedLesson, type LessonStep as SharedStep, type Unit as SharedUnit, resolveLocale } from '@chaturanga/game-shell';
import type { PieceType } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { PRODUCT } from '../../../product.config';

export type { L10n };

/** A counting-rule example the engine must agree with (checked in lessons.test.ts). */
export interface CountingExample {
  fen: string;
  move: string;
  /** Expected limit in moves after `move`; 0 means no counting applies. */
  limitMoves: number;
  kind?: 'board' | 'pieces';
}

/** Makruk lessons carry counting examples, so the shared step types verify against them. */
export type LessonStep = SharedStep<CountingExample>;
export type Lesson = SharedLesson<CountingExample>;
export type Unit = SharedUnit<CountingExample>;

export type LessonIcon = PieceType | 'board' | 'promotion' | 'check' | 'mate' | 'count' | 'game';

export function useL10n() {
  const { i18n } = useTranslation();
  const lang = resolveLocale(PRODUCT, i18n.language);
  return (text: L10n) => text[lang]!;
}
