/**
 * Generates perft reference counts from Fairy-Stockfish (ffish WASM) into
 * src/testing/perft-reference.json. Run: npm run perft:reference -w packages/sittuyin
 */
globalThis.fetch = undefined; // ffish's Emscripten loader must read the wasm from disk, not fetch it.
const fs = require('node:fs');
const path = require('node:path');
const ffish = require('ffish');

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

/** A position after a seeded random game from the start, setup included. */
function randomPosition(seed, plies) {
  const rand = mulberry32(seed);
  const board = new ffish.Board('sittuyin');
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
    { name: 'setup start', fen: '8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w - - 0 1', depth: 3 },
    { name: 'last placement', fen: 'kn2r2r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[s] b - - 0 8', depth: 4 },
    { name: 'after setup', fen: 'kn2rs1r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[] w - - 0 9', depth: 4 },
    { name: 'promotion squares', fen: '4k3/8/8/3P4/4p3/8/P6p/4K3[] w - - 0 1', depth: 5 },
    { name: 'last Ne promotes anywhere', fen: '4k3/8/8/8/P7/8/7p/4K3[] w - - 0 1', depth: 5 },
    { name: 'promotion may not attack', fen: '8/1k6/8/3P4/8/8/P7/4K3[] w - - 0 1', depth: 5 },
    { name: 'in check with block', fen: '4r2k/8/8/8/8/8/R7/4K3[] w - - 0 1', depth: 5 },
  ];
  [11, 23, 37, 41, 59, 73].forEach((seed, i) => {
    cases.push({ name: `random seed ${seed}`, fen: randomPosition(seed, 30 + i * 20), depth: 4 });
  });

  const positions = cases.map(({ name, fen, depth }) => {
    const board = new ffish.Board('sittuyin', fen);
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
