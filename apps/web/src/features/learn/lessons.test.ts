import { Game, moveToUci, parseSquare, squareName } from '@makruk/engine';
import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, UNITS } from './lessons';
import type { L10n, LessonStep } from './types';

const filled = (text: L10n | undefined) => !text || (text.th.trim().length > 0 && text.en.trim().length > 0);

describe('lesson content', () => {
  it('lesson ids are unique', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const unit of UNITS) {
    it(`unit ${unit.id} has both languages`, () => {
      expect(filled(unit.title)).toBe(true);
    });
  }

  for (const lesson of ALL_LESSONS) {
    describe(`lesson ${lesson.id}`, () => {
      it('has titles and XP in both languages', () => {
        expect(filled(lesson.title) && filled(lesson.summary)).toBe(true);
        expect(lesson.xp).toBeGreaterThan(0);
        expect(lesson.route || lesson.steps.length > 0).toBeTruthy();
      });

      lesson.steps.forEach((step: LessonStep, i) => {
        it(`step ${i + 1} (${step.kind}) is valid`, () => {
          expect(filled(step.text)).toBe(true);
          if ('hint' in step) expect(filled(step.hint)).toBe(true);
          const fen = 'fen' in step ? step.fen : undefined;
          const game = fen ? new Game(fen) : null;

          if ('counting' in step && step.counting) {
            const example = new Game(step.counting.fen);
            example.move(step.counting.move);
            const state = example.counting();
            if (step.counting.limitMoves === 0) {
              expect(state).toBeNull();
            } else {
              expect(state?.limitPlies).toBe(step.counting.limitMoves * 2);
              if (step.counting.kind) expect(state?.kind).toBe(step.counting.kind);
            }
            // The position shown to the learner (if any) is the engine's position after the example move.
            if (fen) expect(fen.replace(/~/g, '')).toBe(example.fen().replace(/~/g, ''));
          }

          switch (step.kind) {
            case 'info':
              for (const sq of step.highlight ?? []) expect(parseSquare(sq)).toBeGreaterThanOrEqual(0);
              break;
            case 'move': {
              const legal = game!.legalMoves().map(moveToUci);
              expect(step.solutions.length).toBeGreaterThan(0);
              for (const s of step.solutions) expect(legal.map((m) => m.slice(0, 4))).toContain(s.slice(0, 4));
              expect(legal.length, 'there must be a wrong move to make').toBeGreaterThan(step.solutions.length);
              if (step.success) expect(filled(step.success)).toBe(true);
              break;
            }
            case 'squares':
              expect(step.answer.length).toBeGreaterThan(0);
              for (const sq of step.answer) expect(parseSquare(sq)).toBeGreaterThanOrEqual(0);
              if (step.targetsOf) {
                const targets = game!
                  .legalMovesFrom(parseSquare(step.targetsOf))
                  .map((m) => squareName(m.to))
                  .sort();
                expect([...step.answer].sort()).toEqual(targets);
              }
              break;
            case 'quiz':
              expect(step.choices.length).toBeGreaterThanOrEqual(2);
              expect(step.correct).toBeGreaterThanOrEqual(0);
              expect(step.correct).toBeLessThan(step.choices.length);
              for (const c of step.choices) expect(filled(c)).toBe(true);
              break;
          }
        });
      });
    });
  }

  it('covers the board, every piece, promotion, check and checkmate', () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual(
      expect.arrayContaining(['board', 'khun', 'met', 'khon', 'ma', 'ruea', 'bia', 'promotion', 'check', 'checkmate', 'counting', 'guided']),
    );
  });

  it('counting lesson answers match the engine limits (learn-003)', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'counting')!;
    const quizzes = lesson.steps.filter((s) => s.kind === 'quiz');
    expect(quizzes.length).toBeGreaterThanOrEqual(4);
    for (const quiz of quizzes) {
      if (quiz.kind !== 'quiz' || !quiz.counting) throw new Error('counting quiz needs an engine example');
      const game = new Game(quiz.counting.fen);
      game.move(quiz.counting.move);
      const limit = (game.counting()?.limitPlies ?? 0) / 2;
      const answer = quiz.choices[quiz.correct]!;
      if (limit > 0) expect(answer.en).toBe(`${limit} moves`);
      else expect(answer.en).toBe('No');
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
