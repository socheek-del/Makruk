import { createProgressStore } from '@chaturanga/game-shell';

export { REPLAY_XP } from '@chaturanga/game-shell';
export type { LessonProgress, ProgressState } from '@chaturanga/game-shell';

export const useProgress = createProgressStore('makruk.progress');
