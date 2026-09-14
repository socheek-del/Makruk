import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, makruk } from '@chaturanga/makruk';
import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, UNITS } from './lessons';
import { PRODUCT } from '../../../product.config';
import type { L10n } from './types';

/** Positions parse, solutions are legal, and every string exists in th and en. */
describeLessons(PRODUCT, makruk, ALL_LESSONS);

const filled = (text: L10n) => PRODUCT.locales.every((lang) => (text[lang] ?? '').trim().length > 0);

describe('Makruk lesson content', () => {
  for (const unit of UNITS) {
    it(`unit ${unit.id} has both languages`, () => {
      expect(filled(unit.title)).toBe(true);
    });
  }

  it('covers the board, every piece, promotion, check and checkmate', () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual(
      expect.arrayContaining(['board', 'khun', 'met', 'khon', 'ma', 'ruea', 'bia', 'promotion', 'check', 'checkmate', 'counting', 'guided']),
    );
  });

  it('counting examples match the engine (learn-003)', () => {
    const examples = ALL_LESSONS.flatMap((l) => l.steps).filter((s) => s.verify);
    expect(examples.length).toBeGreaterThan(0);
    for (const step of examples) {
      const example = step.verify!;
      const game = new Game(example.fen);
      game.move(example.move);
      const state = game.counting();
      if (example.limitMoves === 0) {
        expect(state).toBeNull();
      } else {
        expect(state?.limitPlies).toBe(example.limitMoves * 2);
        if (example.kind) expect(state?.kind).toBe(example.kind);
      }
      // The position shown to the learner (if any) is the engine's position after the example move.
      const fen = 'fen' in step ? step.fen : undefined;
      if (fen) expect(fen.replace(/~/g, '')).toBe(game.fen().replace(/~/g, ''));
    }
  });

  it('counting lesson answers name the engine limits (learn-003)', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'counting')!;
    const quizzes = lesson.steps.filter((s) => s.kind === 'quiz');
    expect(quizzes.length).toBeGreaterThanOrEqual(4);
    for (const quiz of quizzes) {
      if (quiz.kind !== 'quiz' || !quiz.verify) throw new Error('a counting quiz needs an engine example');
      const game = new Game(quiz.verify.fen);
      game.move(quiz.verify.move);
      const limit = (game.counting()?.limitPlies ?? 0) / 2;
      const answer = quiz.choices[quiz.correct]!;
      expect(answer.en).toBe(limit > 0 ? `${limit} moves` : 'No');
    }
  });

  it('checkmate lesson solutions really checkmate', () => {
    const mate = ALL_LESSONS.find((l) => l.id === 'checkmate')!;
    for (const step of mate.steps) {
      if (step.kind !== 'move') continue;
      for (const solution of step.solutions) {
        const game = new Game(step.fen);
        game.move(solution);
        expect(game.status().kind, `${step.fen} ${solution}`).toBe('checkmate');
      }
    }
  });
});
