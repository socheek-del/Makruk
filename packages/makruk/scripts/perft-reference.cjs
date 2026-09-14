/**
 * Generates perft reference counts from Fairy-Stockfish (ffish WASM) into
 * src/testing/perft-reference.json. Run: npm run perft:reference -w packages/makruk
 */
globalThis.fetch = undefined; // ffish's Emscripten loader must read the wasm from disk, not fetch it.
const fs = require('node:fs');
const path = require('node:path');
const ffish = require('ffish');

const START = 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1';

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function perft(board, depth) {
  if (depth === 1) return board.numberLegalMoves();
  let nodes = 0;
  for (const m of board.legalMoves().split(' ').filter(Boolean)) {
    board.push(m);
    nodes += perft(board, depth - 1);
    board.pop();
  }
  return nodes;
}

function randomPosition(seed, plies) {
  const rand = mulberry32(seed);
  const board = new ffish.Board('makruk');
  for (let i = 0; i < plies && !board.isGameOver(true); i++) {
    const moves = board.legalMoves().split(' ').filter(Boolean);
    const captures = moves.filter((m) => board.isCapture(m));
    const pool = captures.length && rand() < 0.5 ? captures : moves;
    board.push(pool[Math.floor(rand() * pool.length)]);
  }
  const fen = board.fen();
  board.delete();
  return fen;
}

ffish.onRuntimeInitialized = () => {
  const cases = [
    { name: 'start', fen: START, depth: 5 },
    { name: 'pawn race with promotions', fen: '4k3/8/8/1P1p4/8/8/8/4K3 w - - 0 1', depth: 6 },
    { name: 'in check with block', fen: '4r2k/8/8/8/8/8/R7/4K3 w - - 0 1', depth: 5 },
    { name: 'khon and met endgame', fen: 'r1s1k1s1/2m5/8/8/8/8/2M5/R1S1K1S1 w - - 0 1', depth: 4 },
    { name: 'counting endgame', fen: '4k3/8/8/8/8/8/8/RN2K3 w - - 0 1', depth: 4 },
    { name: 'promoted met present', fen: '4k3/8/M~7/8/3p4/8/8/4K3 b - - 0 1', depth: 5 },
  ];
  [11, 23, 37, 41, 59, 73].forEach((seed, i) => {
    cases.push({ name: `random seed ${seed}`, fen: randomPosition(seed, 14 + i * 10), depth: 4 });
  });

  const positions = cases.map(({ name, fen, depth }) => {
    const board = new ffish.Board('makruk', fen);
    const counts = [];
    for (let d = 1; d <= depth; d++) {
      const started = Date.now();
      counts.push(perft(board, d));
      console.log(`${name} depth ${d}: ${counts[d - 1]} (${Date.now() - started} ms)`);
    }
    board.delete();
    return { name, fen, perft: counts };
  });

  const out = path.join(__dirname, '..', 'src', 'testing', 'perft-reference.json');
  fs.writeFileSync(out, JSON.stringify({ generator: 'ffish@0.7.10 (Fairy-Stockfish)', positions }, null, 2) + '\n');
  console.log(`wrote ${out}`);
};
