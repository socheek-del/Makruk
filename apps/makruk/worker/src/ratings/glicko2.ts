/**
 * Glicko-2 rating system (Mark Glickman, "Example of the Glicko-2 system", 2012).
 * Each finished game is treated as its own rating period.
 */
import type { TimeClass, TimeControl } from '@chaturanga/protocol';

export interface Rating {
  rating: number;
  rd: number;
  vol: number;
}

export interface GameScore {
  opponent: Rating;
  /** 1 = win, 0.5 = draw, 0 = loss */
  score: 0 | 0.5 | 1;
}

export const DEFAULT_RATING: Rating = { rating: 1500, rd: 350, vol: 0.06 };
/** Ratings with RD above this are shown as provisional ("?"). */
export const PROVISIONAL_RD = 110;

const SCALE = 173.7178;
const TAU = 0.5;
const EPSILON = 1e-6;

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const expected = (mu: number, muJ: number, phiJ: number) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

export function updateRating(player: Rating, results: readonly GameScore[], tau = TAU): Rating {
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.vol;

  if (results.length === 0) {
    return { ...player, rd: Math.min(Math.sqrt(phi * phi + sigma * sigma) * SCALE, DEFAULT_RATING.rd) };
  }

  let vInverse = 0;
  let improvement = 0;
  for (const { opponent, score } of results) {
    const muJ = (opponent.rating - 1500) / SCALE;
    const phiJ = opponent.rd / SCALE;
    const e = expected(mu, muJ, phiJ);
    const gJ = g(phiJ);
    vInverse += gJ * gJ * e * (1 - e);
    improvement += gJ * (score - e);
  }
  const v = 1 / vInverse;
  const delta = v * improvement;

  // Step 5: new volatility via the Illinois algorithm.
  const a = Math.log(sigma * sigma);
  const f = (x: number) => {
    const ex = Math.exp(x);
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (tau * tau);
  };
  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) k++;
    B = a - k * tau;
  }
  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA /= 2;
    }
    B = C;
    fB = fC;
  }
  const newSigma = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * improvement;
  return { rating: newMu * SCALE + 1500, rd: newPhi * SCALE, vol: newSigma };
}

/** Rates one game for both players at once (each uses the other's pre-game rating). */
export function rateGame(white: Rating, black: Rating, winner: 'w' | 'b' | null): { white: Rating; black: Rating } {
  const whiteScore = winner === 'w' ? 1 : winner === 'b' ? 0 : 0.5;
  return {
    white: updateRating(white, [{ opponent: black, score: whiteScore }]),
    black: updateRating(black, [{ opponent: white, score: (1 - whiteScore) as 0 | 0.5 | 1 }]),
  };
}

/** Estimated game duration = initial + 40 × increment (as on major chess sites). */
export function timeClassOf(timeControl: TimeControl): TimeClass {
  const seconds = timeControl.initialMs / 1000 + (40 * timeControl.incrementMs) / 1000;
  if (seconds < 180) return 'bullet';
  if (seconds < 480) return 'blitz';
  if (seconds < 1500) return 'rapid';
  return 'classical';
}
