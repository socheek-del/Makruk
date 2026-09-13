import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LessonProgress {
  stars: 1 | 2 | 3;
  completedAt: string;
}

export interface Streak {
  count: number;
  /** Local calendar day (YYYY-MM-DD) of the last completed lesson. */
  lastDay: string | null;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  xp: number;
  streak: Streak;
  completeLesson: (id: string, stars: 1 | 2 | 3, xp: number, now?: Date) => void;
  reset: () => void;
}

/** XP for replaying a lesson that was already completed. */
export const REPLAY_XP = 5;

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function previousDay(date: Date): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return dayKey(copy);
}

export function nextStreak(streak: Streak, now: Date): Streak {
  const today = dayKey(now);
  if (streak.lastDay === today) return streak;
  return { count: streak.lastDay === previousDay(now) ? streak.count + 1 : 1, lastDay: today };
}

/** Streak shown to the user: broken if neither today nor yesterday had a lesson. */
export function currentStreak(streak: Streak, now: Date): number {
  if (!streak.lastDay) return 0;
  return streak.lastDay === dayKey(now) || streak.lastDay === previousDay(now) ? streak.count : 0;
}

const EMPTY = { lessons: {}, xp: 0, streak: { count: 0, lastDay: null } };

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...EMPTY,
      completeLesson: (id, stars, xp, now = new Date()) =>
        set((s) => {
          const previous = s.lessons[id];
          return {
            lessons: {
              ...s.lessons,
              [id]: { stars: previous ? (Math.max(previous.stars, stars) as 1 | 2 | 3) : stars, completedAt: now.toISOString() },
            },
            xp: s.xp + (previous ? REPLAY_XP : xp),
            streak: nextStreak(s.streak, now),
          };
        }),
      reset: () => set(EMPTY),
    }),
    {
      name: 'makruk.progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lessons, xp, streak }) => ({ lessons, xp, streak }),
    },
  ),
);
