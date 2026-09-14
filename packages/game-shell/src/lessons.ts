/**
 * Interactive lesson data, shared by the sites. The shapes here are game-independent: a step names a
 * position by FEN and an answer in coordinate notation, and the product's own rules engine decides
 * whether the answer is legal (`describeLessons` in ./testing checks exactly that).
 *
 * Lesson text lives with the lesson data rather than in the locale files, because a step's prompt,
 * hint and choices only make sense together.
 */

/** One piece of lesson text, in every language the product declares (plat-004). */
export type L10n = Record<string, string>;

/**
 * A step of a lesson. `Verify` is a product-defined payload a step can carry for its own tests to
 * verify against its engine — Makruk uses it for counting examples. The player never reads it.
 */
export type LessonStep<Verify = never> =
  /** Explanation, optionally with a position and highlighted squares. */
  | { kind: 'info'; text: L10n; fen?: string; highlight?: string[]; verify?: Verify }
  /** Play one of the solution moves (coordinate notation). */
  | { kind: 'move'; text: L10n; fen: string; solutions: string[]; hint?: L10n; success?: L10n; verify?: Verify }
  /**
   * Tap exactly the answer squares, then check. When `targetsOf` is set, the answer must equal that
   * piece's legal destinations, which `describeLessons` enforces against the engine.
   */
  | { kind: 'squares'; text: L10n; fen: string; answer: string[]; targetsOf?: string; hint?: L10n; verify?: Verify }
  /** Multiple choice. */
  | { kind: 'quiz'; text: L10n; choices: L10n[]; correct: number; fen?: string; hint?: L10n; verify?: Verify };

export interface Lesson<Verify = never> {
  id: string;
  /** Product-defined icon name; the product's lesson list decides what to draw. */
  icon: string;
  title: L10n;
  summary: L10n;
  xp: number;
  steps: LessonStep<Verify>[];
  /** Special lessons open a dedicated route instead of the step player. */
  route?: string;
}

export interface Unit<Verify = never> {
  id: string;
  title: L10n;
  lessons: Lesson<Verify>[];
}

/** Three stars for a clean run; a mistake or two still earns two. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
