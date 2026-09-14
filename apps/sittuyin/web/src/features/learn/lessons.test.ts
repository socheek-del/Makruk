import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, sittuyin } from '@chaturanga/sittuyin';
import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, UNITS } from './lessons';
import { PRODUCT } from '../../../product.config';
import type { L10n } from './types';

/** Positions parse, move solutions are legal, squares answers match the engine, and my+en are filled. */
describeLessons(PRODUCT, sittuyin, ALL_LESSONS);

const filled = (text: L10n) => PRODUCT.locales.every((lang) => (text[lang] ?? '').trim().length > 0);

describe('Sittuyin lesson content', () => {
  for (const unit of UNITS) {
    it(`unit ${unit.id} has both languages`, () => {
      expect(filled(unit.title)).toBe(true);
    });
  }

  it('covers the board, the setup, every piece, promotion, check, checkmate and counting', () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual([
      'board',
      'setup',
      'ne',
      'yahhta',
      'myin',
      'sin',
      'sitke',
      'mingyi',
      'promotion',
      'check',
      'mate',
      'counting',
    ]);
  });

  it('every piece type has its own lesson', () => {
    const icons = new Set(ALL_LESSONS.map((l) => l.icon));
    for (const type of sittuyin.pieceTypes) expect(icons.has(type), type).toBe(true);
  });

  it('counting claims match the engine', () => {
    // A counting step shows the position *before* its example move, and claims the limit that move produces.
    const examples = ALL_LESSONS.flatMap((l) => l.steps).filter((s) => s.verify);
    expect(examples.length).toBeGreaterThan(0);
    for (const step of examples) {
      const example = step.verify!;
      expect('fen' in step ? step.fen : undefined, 'the board shown must be the example position').toBe(example.fen);
      const game = new Game(example.fen);
      game.move(example.move);
      const state = game.counting();
      if (example.limitPlies === 0) expect(state, `${example.fen} ${example.move}`).toBeNull();
      else expect(state?.limitPlies, `${example.fen} ${example.move}`).toBe(example.limitPlies);
    }
  });

  it('counting quiz answers name the engine limit', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'counting')!;
    const quizzes = lesson.steps.filter((s) => s.kind === 'quiz');
    expect(quizzes.length).toBeGreaterThanOrEqual(2);
    for (const quiz of quizzes) {
      if (quiz.kind !== 'quiz' || !quiz.verify) throw new Error('a counting quiz needs an engine example');
      const game = new Game(quiz.verify.fen);
      game.move(quiz.verify.move);
      const limit = (game.counting()?.limitPlies ?? 0) / 2;
      expect(quiz.choices[quiz.correct]!.en).toBe(limit > 0 ? `${limit} moves` : 'No');
    }
  });

  it('the checkmate solution really checkmates', () => {
    const mate = ALL_LESSONS.find((l) => l.id === 'mate')!;
    const moves = mate.steps.filter((s) => s.kind === 'move');
    expect(moves.length).toBeGreaterThan(0);
    for (const step of moves) {
      if (step.kind !== 'move') continue;
      for (const solution of step.solutions) {
        const game = new Game(step.fen);
        game.move(solution);
        expect(game.status().kind, `${step.fen} ${solution}`).toBe('checkmate');
      }
    }
  });

  it('the promotion solutions all produce a Sit-ke', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'promotion')!;
    for (const step of lesson.steps) {
      if (step.kind !== 'move') continue;
      for (const solution of step.solutions) {
        const game = new Game(step.fen);
        const record = game.move(solution);
        expect(game.pieceAt(record.to)?.type, solution).toBe('f');
      }
    }
  });

  it('the setup lesson only accepts back-rank Yahhta placements', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'setup')!;
    const step = lesson.steps.find((s) => s.kind === 'move');
    if (step?.kind !== 'move') throw new Error('the setup lesson needs a placement step');
    // The claim under test: every legal Yahhta placement is a solution, and every one is on rank 1.
    const legalYahhta = new Game(step.fen).legalUci().filter((uci) => uci.startsWith('R@'));
    expect([...step.solutions].sort()).toEqual([...legalYahhta].sort());
    for (const uci of legalYahhta) expect(uci.endsWith('1'), uci).toBe(true);
  });
});
