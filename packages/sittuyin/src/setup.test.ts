import { describe, expect, it } from 'vitest';
import { START_FEN } from './fen';
import { Game, IllegalMoveError, moveToUci } from './game';
import { type FfishBoard, loadFfish, mulberry32, normalizeFen } from './testing/ffish';

const uciList = (game: Game) => game.legalMoves().map(moveToUci).sort();
const dropSquares = (game: Game, piece: string) =>
  uciList(game)
    .filter((m) => m.startsWith(`${piece}@`))
    .map((m) => m.slice(2))
    .sort();

describe('setup phase (sit-001)', () => {
  it('starts with every piece but the Ne in hand and White to place', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.turn).toBe('w');
    expect(game.inSetup()).toBe(true);
    expect(game.hand('w')).toEqual(['k', 's', 's', 'f', 'r', 'r', 'n', 'n']);
    expect(game.pieces()).toHaveLength(16);
    // Fairy-Stockfish lists 88 placements for White's first ply.
    expect(game.legalMoves()).toHaveLength(88);
  });

  it("places pieces on the side's own three ranks, and a Yahhta only on the back rank", () => {
    const game = new Game();
    expect(dropSquares(game, 'N')).toEqual(
      'a1 a2 b1 b2 c1 c2 d1 d2 e1 e2 e3 f1 f2 f3 g1 g2 g3 h1 h2 h3'.split(' '),
    );
    expect(dropSquares(game, 'R')).toEqual('a1 b1 c1 d1 e1 f1 g1 h1'.split(' '));
    game.move('N@a1');
    expect(dropSquares(game, 'K')).toEqual(
      'a6 a7 a8 b6 b7 b8 c6 c7 c8 d6 d7 d8 e7 e8 f7 f8 g7 g8 h7 h8'.split(' '),
    );
    expect(dropSquares(game, 'R')).toEqual('a8 b8 c8 d8 e8 f8 g8 h8'.split(' '));
  });

  it('alternates placements and ends after 16 plies with nothing in hand', () => {
    const game = new Game();
    for (let ply = 0; ply < 16; ply++) {
      expect(game.inSetup()).toBe(true);
      expect(game.turn).toBe(ply % 2 ? 'b' : 'w');
      game.move(game.legalMoves()[0]!);
    }
    expect(game.inSetup()).toBe(false);
    expect(game.hand('w')).toEqual([]);
    expect(game.hand('b')).toEqual([]);
    expect(game.fen()).toMatch(/\[\] w - - 0 9$/);
    expect(game.legalMoves().every((m) => m.kind === 'move')).toBe(true);
  });

  it('a side with pieces in hand must place one; a side without moves its pieces', () => {
    const black = new Game('8/8/4pppp/pppp4/4PPPP/PPPP4/8/R3K3[kr] b - - 0 1');
    expect(black.legalMoves().every((m) => m.kind === 'drop')).toBe(true);
    const white = new Game('8/8/4pppp/pppp4/4PPPP/PPPP4/8/R3K3[kr] w - - 0 1');
    expect(white.legalMoves().some((m) => m.kind === 'drop')).toBe(false);
    expect(uciList(white)).toContain('a3a4');
  });

  it('moves pieces when no placement square is free', () => {
    const game = new Game('k7/8/8/8/8/PPPPPPPP/PPPPPPPP/PPPPPPPK[N] w - - 0 1');
    expect(uciList(game)).toEqual('a3a4 b3b4 c3c4 d3d4 e3e4 f3f4 g3g4 h3h4'.split(' '));
  });

  it('only placements that block a check are legal', () => {
    const game = new Game('4k3/8/8/8/8/8/8/r3K3[RN] w - - 0 1');
    expect(uciList(game)).toEqual('N@b1 N@c1 N@d1 R@b1 R@c1 R@d1'.split(' '));
  });

  it('writes placements like Fairy-Stockfish, with check marks', () => {
    const game = new Game('3k4/8/8/8/8/8/8/K7[R] w - - 0 1');
    const record = game.move('R@d1');
    expect(record).toMatchObject({
      kind: 'drop',
      type: 'r',
      uci: 'R@d1',
      san: 'R@d1+',
      piece: { color: 'w', type: 'r', promoted: false },
      color: 'w',
      captured: null,
    });
    expect(game.inCheck()).toBe(true);
  });

  it('a placement resets the halfmove clock', () => {
    const game = new Game('r3k3/p7/8/8/8/8/P7/7K[F] w - - 5 10');
    game.move('F@b1');
    expect(game.fen()).toBe('r3k3/p7/8/8/8/8/P7/1F5K[] b - - 0 10');
  });

  it('undo returns the piece to hand', () => {
    const game = new Game();
    game.move('K@e2');
    game.move('R@a8');
    expect(game.undo()?.uci).toBe('R@a8');
    expect(game.undo()?.uci).toBe('K@e2');
    expect(game.fen()).toBe(START_FEN);
    expect(game.undo()).toBeNull();
  });

  it.each(['R@a2', 'K@e7', 'P@a2', 'Q@a1', 'e3e4', 'a3a4'])('rejects %s during White’s first placement', (uci) => {
    expect(() => new Game().move(uci)).toThrow(IllegalMoveError);
  });
});

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 100;

function compare(game: Game, ref: FfishBoard, context: () => string): void {
  expect(uciList(game), `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(normalizeFen(game.fen()), `fen ${context()}`).toBe(ref.fen());
}

describe('setup lock-step vs Fairy-Stockfish (sit-001)', () => {
  it(`${GAMES} seeded setups agree on every ply`, { timeout: 600_000 }, async () => {
    const ffish = await loadFfish();
    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const game = new Game();
      const ref = new ffish.Board('sittuyin');
      const played: string[] = [];
      const context = () => `seed=${seed} moves=${played.join(' ')}`;
      try {
        compare(game, ref, context);
        while (game.inSetup()) {
          const moves = game.legalMoves();
          const uci = moveToUci(moves[Math.floor(rand() * moves.length)]!);
          expect(game.move(uci).san, `san ${context()} ${uci}`).toBe(ref.sanMove(uci));
          ref.push(uci);
          played.push(uci);
          compare(game, ref, context);
        }
        expect(played).toHaveLength(16);
      } finally {
        ref.delete();
      }
    }
  });
});
