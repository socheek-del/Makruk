import { type L10n, type Lesson as SharedLesson, type LessonStep as SharedStep, type Unit as SharedUnit, resolveLocale } from '@chaturanga/game-shell';
import type { PieceType } from '@chaturanga/sittuyin';
import { useTranslation } from 'react-i18next';
import { PRODUCT } from '../../../product.config';

export type { L10n };

/**
 * An ASEAN-counting claim a lesson makes, which the engine must agree with (checked in lessons.test.ts).
 * Sittuyin limits depend only on the strongest attacking piece, so a lesson that names a limit is
 * making a testable claim rather than a decorative one.
 */
export interface CountingExample {
  fen: string;
  move: string;
  /** Expected limit in plies after `move`; 0 means no count runs. */
  limitPlies: number;
}

/** Sittuyin lessons carry counting examples, so the shared step types verify against them. */
export type LessonStep = SharedStep<CountingExample>;
export type Lesson = SharedLesson<CountingExample>;
export type Unit = SharedUnit<CountingExample>;

export type LessonIcon = PieceType | 'board' | 'setup' | 'promotion' | 'check' | 'mate' | 'count';

export function useL10n() {
  const { i18n } = useTranslation();
  const lang = resolveLocale(PRODUCT, i18n.language);
  return (text: L10n) => text[lang]!;
}
