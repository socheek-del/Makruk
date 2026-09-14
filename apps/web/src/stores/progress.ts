import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LessonProgress {
  stars: 1 | 2 | 3;
  completedAt: string;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  xp: number;
  completeLesson: (id: string, stars: 1 | 2 | 3, xp: number, now?: Date) => void;
  reset: () => void;
}

/** XP for replaying a lesson that was already completed. */
export const REPLAY_XP = 5;

const EMPTY = { lessons: {}, xp: 0 };

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
          };
        }),
      reset: () => set(EMPTY),
    }),
    {
      name: 'makruk.progress',
      // v2 dropped the daily streak; lessons and XP carry over.
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lessons, xp }) => ({ lessons, xp }),
      migrate: (saved) => {
        const { lessons = {}, xp = 0 } = (saved ?? {}) as Partial<Pick<ProgressState, 'lessons' | 'xp'>>;
        return { lessons, xp };
      },
    },
  ),
);
