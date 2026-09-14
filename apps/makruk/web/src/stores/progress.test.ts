import { beforeEach, describe, expect, it } from 'vitest';
import { REPLAY_XP, useProgress } from './progress';

const at = (iso: string) => new Date(iso);

describe('lesson progress', () => {
  beforeEach(() => useProgress.getState().reset());

  it('records completion, stars and XP', () => {
    useProgress.getState().completeLesson('board', 2, 10, at('2026-09-13T10:00:00'));
    const { lessons, xp } = useProgress.getState();
    expect(lessons.board?.stars).toBe(2);
    expect(xp).toBe(10);
  });

  it('keeps the best stars and gives replay XP', () => {
    const { completeLesson } = useProgress.getState();
    completeLesson('board', 3, 10, at('2026-09-13T10:00:00'));
    completeLesson('board', 1, 10, at('2026-09-13T11:00:00'));
    expect(useProgress.getState().lessons.board?.stars).toBe(3);
    expect(useProgress.getState().xp).toBe(10 + REPLAY_XP);
  });

  it('persists lessons and XP to localStorage, without a streak', () => {
    useProgress.getState().completeLesson('khun', 3, 10, at('2026-09-13T10:00:00'));
    const saved = JSON.parse(localStorage.getItem('makruk.progress')!);
    expect(saved.state.lessons.khun.stars).toBe(3);
    expect(saved.state).not.toHaveProperty('streak');
  });

  it('migrates saved progress from before streaks were removed', async () => {
    const migrate = useProgress.persist.getOptions().migrate!;
    const migrated = await migrate({ lessons: { board: { stars: 2, completedAt: 'x' } }, xp: 30, streak: { count: 4, lastDay: '2026-09-12' } }, 1);
    expect(migrated).toEqual({ lessons: { board: { stars: 2, completedAt: 'x' } }, xp: 30 });
  });
});
