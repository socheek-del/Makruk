/**
 * Bot strength ladder (ai-002): each level must beat the level below in a majority of games.
 * Slow — run with `npm run test:strength -w packages/ai`. Set STRENGTH_PAIR=n to run only
 * level n+1 vs level n (lets pairs run in parallel processes), STRENGTH_GAMES to change the count.
 *
 * Resumable: every finished game is appended to strength-games.log with a signature of both bot
 * configs. Games already logged for the current configs are skipped, so an interrupted run
 * continues where it stopped. Delete the log (or change a bot) to start over. With STRENGTH_SHARD,
 * run n shards in parallel, then run once more without it to record the verdict from the log.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game } from '@makruk/engine';
import { describe, expect, it } from 'vitest';
import { BOTS, chooseMove, mulberry32, positionKey } from './index';

const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const ONLY_PAIR = process.env.STRENGTH_PAIR ? Number(process.env.STRENGTH_PAIR) : null;
/** STRENGTH_SHARD=k/n plays only games with index % n === k, so one pair can use several processes. */
const SHARD = process.env.STRENGTH_SHARD
  ? (([index, count]) => ({ index: Number(index), count: Number(count) }))(process.env.STRENGTH_SHARD.split('/'))
  : null;
const MAX_PLIES = 400;
/**
 * Strong bots have no noise, so every game from the start position would repeat exactly. Each pair of
 * games starts from its own seeded random opening, played once with each colour.
 */
const OPENING_PLIES = 6;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GAMES_LOG = join(ROOT, 'strength-games.log');
const RESULTS_LOG = join(ROOT, 'strength-results.log');

type Outcome = 'win' | 'loss' | 'draw';

function playGame(
  whiteLevel: number,
  blackLevel: number,
  seed: number,
  openingSeed: number,
): { winner: 'w' | 'b' | 'draw'; plies: number; reason: string; fen: string } {
  const game = new Game();
  const rng = mulberry32(seed);
  const history = [positionKey(game.fen())];
  const openingRng = mulberry32(openingSeed);
  for (let p = 0; p < OPENING_PLIES && !game.isGameOver(); p++) {
    const legal = game.legalMoves();
    history.push(positionKey(game.move(legal[Math.floor(openingRng() * legal.length)]!).fenAfter));
  }
  while (!game.isGameOver() && game.moves().length < MAX_PLIES) {
    const move = chooseMove(game.fen(), game.turn === 'w' ? whiteLevel : blackLevel, { rng, ignoreTime: true, history });
    if (!move) break;
    history.push(positionKey(game.move(move.uci).fenAfter));
  }
  const status = game.status();
  return {
    winner: status.kind === 'checkmate' ? status.winner : 'draw',
    plies: game.moves().length,
    reason: status.kind === 'ongoing' ? 'max-plies' : status.kind,
    fen: game.fen(),
  };
}

/** Games already played with exactly these bot configs, by game index. */
function loggedGames(signature: string): Map<number, Outcome> {
  const done = new Map<number, Outcome>();
  if (!existsSync(GAMES_LOG)) return done;
  for (const line of readFileSync(GAMES_LOG, 'utf8').split('\n')) {
    if (!line) continue;
    const entry = JSON.parse(line) as { signature: string; game: number; outcome: Outcome };
    if (entry.signature === signature) done.set(entry.game, entry.outcome);
  }
  return done;
}

describe('bot strength ladder (ai-002)', () => {
  for (let i = 1; i < BOTS.length; i++) {
    const strong = BOTS[i]!;
    const weak = BOTS[i - 1]!;
    it.runIf(ONLY_PAIR === null || ONLY_PAIR === i)(
      `${strong.key} (L${strong.id}) beats ${weak.key} (L${weak.id}) in a majority of ${GAMES} games`,
      { timeout: 6 * 3_600_000 },
      () => {
        const signature = JSON.stringify({ strong, weak, maxPlies: MAX_PLIES, openingPlies: OPENING_PLIES });
        for (let g = 0; g < GAMES; g++) {
          if (SHARD && g % SHARD.count !== SHARD.index) continue;
          // Re-read before each game: parallel shards and earlier runs share the log.
          if (loggedGames(signature).has(g)) continue;
          const strongIsWhite = g % 2 === 0;
          const { winner, plies, reason, fen } = playGame(strongIsWhite ? strong.id : weak.id, strongIsWhite ? weak.id : strong.id, 1_000 * i + g, 7_919 * (Math.floor(g / 2) + 1));
          const outcome: Outcome = winner === 'draw' ? 'draw' : winner === (strongIsWhite ? 'w' : 'b') ? 'win' : 'loss';
          appendFileSync(GAMES_LOG, `${JSON.stringify({ at: new Date().toISOString(), pair: `L${strong.id}-L${weak.id}`, game: g, outcome, plies, reason, fen, signature })}\n`);
        }
        const done = loggedGames(signature);
        // A shard only plays its own games; the verdict needs every game.
        if (SHARD && [...Array(GAMES).keys()].some((g) => !done.has(g))) return;
        const results = [...done].filter(([g]) => g < GAMES).map(([, outcome]) => outcome);
        const wins = results.filter((o) => o === 'win').length;
        const losses = results.filter((o) => o === 'loss').length;
        const draws = results.filter((o) => o === 'draw').length;
        const line = `${new Date().toISOString()} L${strong.id} ${strong.key} vs L${weak.id} ${weak.key}: +${wins} -${losses} =${draws} (${GAMES} games)\n`;
        // Vitest swallows console output from passing tests; keep a durable record for evidence.
        appendFileSync(RESULTS_LOG, line);
        expect(wins).toBeGreaterThan(GAMES / 2);
      },
    );
  }
});
