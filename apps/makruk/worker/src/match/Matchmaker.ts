import { MatchmakerBase } from '@chaturanga/server-kit';
import type { Env } from '../env';

/** online-005: the shared quick-match Durable Object, opening Makruk rooms. */
export class Matchmaker extends MatchmakerBase<Env> {}
