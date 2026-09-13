import { beforeEach, describe, expect, it } from 'vitest';
import { currentStreak, dayKey, nextStreak, REPLAY_XP, useProgress } from './progress';

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

  it('persists to localStorage', () => {
    useProgress.getState().completeLesson('khun', 3, 10, at('2026-09-13T10:00:00'));
    expect(JSON.parse(localStorage.getItem('makruk.progress')!).state.lessons.khun.stars).toBe(3);
  });
});

describe('streaks', () => {
  it('increments on consecutive days, not twice on the same day', () => {
    let streak = { count: 0, lastDay: null as string | null };
    streak = nextStreak(streak, at('2026-09-13T08:00:00'));
    streak = nextStreak(streak, at('2026-09-13T22:00:00'));
    expect(streak).toEqual({ count: 1, lastDay: '2026-09-13' });
    streak = nextStreak(streak, at('2026-09-14T07:00:00'));
    streak = nextStreak(streak, at('2026-09-15T23:59:00'));
    expect(streak.count).toBe(3);
  });

  it('resets after a missed day', () => {
    const streak = nextStreak({ count: 5, lastDay: '2026-09-10' }, at('2026-09-13T09:00:00'));
    expect(streak).toEqual({ count: 1, lastDay: '2026-09-13' });
  });

  it('shows 0 once the streak is broken', () => {
    const streak = { count: 4, lastDay: '2026-09-12' };
    expect(currentStreak(streak, at('2026-09-13T12:00:00'))).toBe(4);
    expect(currentStreak(streak, at('2026-09-14T12:00:00'))).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(nextStreak({ count: 2, lastDay: '2026-09-30' }, at('2026-10-01T10:00:00')).count).toBe(3);
    expect(dayKey(at('2026-01-05T10:00:00'))).toBe('2026-01-05');
  });
});
