// =============================================================================
// Texas Hold'em 7-Card Hand Evaluator
// Standalone, pure functional. No side effects.
// =============================================================================

import type { Card, Rank, Suit } from './engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum HandRank {
  HIGH_CARD       = 1,
  ONE_PAIR        = 2,
  TWO_PAIR        = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT        = 5,
  FLUSH           = 6,
  FULL_HOUSE      = 7,
  FOUR_OF_A_KIND  = 8,
  STRAIGHT_FLUSH  = 9,
  ROYAL_FLUSH     = 10,
}

export interface EvaluatedHand {
  rank: HandRank;
  /** Single comparable integer — higher always wins */
  score: number;
  description: string;
  bestCards: Card[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates the best 5-card hand from up to 7 cards.
 * Works with 2–7 cards (e.g., preflop with only hole cards).
 */
export function evaluateHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const all = [...holeCards, ...communityCards];
  if (all.length < 2) {
    throw new Error('Need at least 2 cards to evaluate');
  }
  return bestHandFromCards(all);
}

/**
 * Compares two evaluated hands.
 * @returns positive if a wins, negative if b wins, 0 for tie.
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  return a.score - b.score;
}

// ---------------------------------------------------------------------------
// Rank values
// ---------------------------------------------------------------------------

const RANK_VALUE: Record<string, number> = {
  '2': 2,  '3': 3,  '4': 4,  '5': 5,  '6': 6,
  '7': 7,  '8': 8,  '9': 9,  '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

function rv(rank: Rank): number {
  return RANK_VALUE[String(rank)];
}

// ---------------------------------------------------------------------------
// Core: pick best 5 from n
// ---------------------------------------------------------------------------

function bestHandFromCards(cards: Card[]): EvaluatedHand {
  if (cards.length <= 5) {
    return evaluateFive(cards);
  }

  let best: EvaluatedHand | null = null;
  for (const combo of combinations(cards, 5)) {
    const result = evaluateFive(combo);
    if (!best || result.score > best.score) {
      best = result;
    }
  }
  return best!;
}

// ---------------------------------------------------------------------------
// Evaluate exactly 5 cards
// ---------------------------------------------------------------------------

function evaluateFive(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => rv(b.rank) - rv(a.rank));
  const values = sorted.map(c => rv(c.rank));
  const suits  = sorted.map(c => c.suit);

  const isFlush  = suits.every(s => s === suits[0]);
  const straight = detectStraight(values);

  // Rank frequency map: value → count
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);

  // Groups sorted by (count desc, value desc)
  const groups = [...freq.entries()]
    .sort(([va, ca], [vb, cb]) => cb !== ca ? cb - ca : vb - va);

  const counts = groups.map(([, c]) => c);

  // --- Royal Flush ---
  if (isFlush && straight.is && !straight.isWheel && values[0] === 14) {
    return make(HandRank.ROYAL_FLUSH, [14], 'Royal Flush', sorted);
  }

  // --- Straight Flush ---
  if (isFlush && straight.is) {
    const high = straight.isWheel ? 5 : values[0];
    return make(HandRank.STRAIGHT_FLUSH, [high], `Straight Flush, ${rankName(high)} high`, sorted);
  }

  // --- Four of a Kind ---
  if (counts[0] === 4) {
    const quad   = groups[0][0];
    const kicker = groups[1][0];
    return make(HandRank.FOUR_OF_A_KIND, [quad, kicker], `Four of a Kind, ${rankName(quad)}s`, sorted);
  }

  // --- Full House ---
  if (counts[0] === 3 && counts[1] === 2) {
    const trip = groups[0][0];
    const pair = groups[1][0];
    return make(HandRank.FULL_HOUSE, [trip, pair], `Full House, ${rankName(trip)}s full of ${rankName(pair)}s`, sorted);
  }

  // --- Flush ---
  if (isFlush) {
    return make(HandRank.FLUSH, values, `${rankName(values[0])}-high Flush`, sorted);
  }

  // --- Straight ---
  if (straight.is) {
    const high = straight.isWheel ? 5 : values[0];
    const bestCards = straight.isWheel ? wheelCards(sorted) : sorted;
    return make(HandRank.STRAIGHT, [high], `Straight, ${rankName(high)} high`, bestCards);
  }

  // --- Three of a Kind ---
  if (counts[0] === 3) {
    const trip    = groups[0][0];
    const kickers = groups.filter(([, c]) => c === 1).map(([v]) => v);
    return make(HandRank.THREE_OF_A_KIND, [trip, ...kickers], `Three of a Kind, ${rankName(trip)}s`, sorted);
  }

  // --- Two Pair ---
  if (counts[0] === 2 && counts[1] === 2) {
    const topPair = groups[0][0];
    const botPair = groups[1][0];
    const kicker  = groups[2][0];
    return make(HandRank.TWO_PAIR, [topPair, botPair, kicker],
      `Two Pair, ${rankName(topPair)}s and ${rankName(botPair)}s`, sorted);
  }

  // --- One Pair ---
  if (counts[0] === 2) {
    const pair    = groups[0][0];
    const kickers = groups.filter(([, c]) => c === 1).map(([v]) => v);
    return make(HandRank.ONE_PAIR, [pair, ...kickers], `Pair of ${rankName(pair)}s`, sorted);
  }

  // --- High Card ---
  return make(HandRank.HIGH_CARD, values, `${rankName(values[0])}-high`, sorted);
}

// ---------------------------------------------------------------------------
// Score encoding
// ---------------------------------------------------------------------------

// Score = handRank * BASE^6 + tb[0]*BASE^5 + tb[1]*BASE^4 + ... + tb[4]*BASE^0
// BASE = 15 (ranks 2–14 + 0-pad), giving enough headroom for 6 tiebreakers.
const BASE = 15;

function make(
  handRank: HandRank,
  tiebreakers: number[],
  description: string,
  bestCards: Card[],
): EvaluatedHand {
  let score = handRank * Math.pow(BASE, 6);
  for (let i = 0; i < 5; i++) {
    score += (tiebreakers[i] ?? 0) * Math.pow(BASE, 5 - i);
  }
  return { rank: handRank, score: Math.round(score), description, bestCards };
}

// ---------------------------------------------------------------------------
// Straight detection
// ---------------------------------------------------------------------------

interface StraightResult { is: boolean; isWheel: boolean; }

function detectStraight(sortedDesc: number[]): StraightResult {
  // Normal straight: 5 consecutive values
  if (sortedDesc.length === 5) {
    const normal = sortedDesc.every((v, i) => i === 0 || sortedDesc[i - 1] - v === 1);
    if (normal) return { is: true, isWheel: false };
  }
  // Wheel: A-2-3-4-5  →  sorted desc: [14,5,4,3,2]
  const wheel = [14, 5, 4, 3, 2];
  if (sortedDesc.length === 5 && wheel.every((v, i) => sortedDesc[i] === v)) {
    return { is: true, isWheel: true };
  }
  return { is: false, isWheel: false };
}

/** Re-orders wheel cards so Ace is low (for display purposes) */
function wheelCards(sorted: Card[]): Card[] {
  const ace = sorted.find(c => rv(c.rank) === 14)!;
  const rest = sorted.filter(c => rv(c.rank) !== 14);
  return [...rest, ace];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankName(v: number): string {
  const names: Record<number, string> = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack',
    10: '10', 9: '9', 8: '8', 7: '7', 6: '6',
    5: '5', 4: '4', 3: '3', 2: '2',
  };
  return names[v] ?? String(v);
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

// ---------------------------------------------------------------------------
// Re-export Card type for consumers who only import from evaluator
// ---------------------------------------------------------------------------
export type { Card, Rank, Suit };
