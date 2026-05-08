// =============================================================================
// Texas Hold'em No-Limit Heads-Up Game Engine
// Pure functional — no side effects. All functions take state, return new state.
// =============================================================================

import { evaluateHand as evalHand, compareHands, type EvaluatedHand } from './evaluator';
export { HandRank, type EvaluatedHand } from './evaluator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface PlayerState {
  id: 'player' | 'bot';
  stack: number;
  holeCards: Card[];
  /** Chips committed in the current betting round */
  currentBet: number;
  /** Total chips committed this street */
  totalBetThisRound: number;
  folded: boolean;
  allIn: boolean;
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type GamePhase = 'waiting' | 'betting' | 'showdown' | 'ended';

export interface SidePot {
  amount: number;
  /** Player ids eligible for this pot */
  eligible: Array<'player' | 'bot'>;
}

export interface WinnerInfo {
  playerId: 'player' | 'bot';
  amount: number;
  handDescription?: string;
  potType: 'main' | 'side';
}

export interface HandHistoryEntry {
  street: Street;
  playerId: 'player' | 'bot';
  action: Action;
  potAfter: number;
}

export interface GameState {
  // Config (constant across hands)
  startingStack: number;
  smallBlind: number;
  bigBlind: number;

  // Per-hand state
  players: [PlayerState, PlayerState]; // index 0 = player, index 1 = bot
  pot: number;
  sidePots: SidePot[];
  communityCards: Card[];
  deck: Card[];

  street: Street;
  phase: GamePhase;

  /** Index into players array: 0 or 1 */
  activePlayerIndex: number;
  /** Index into players array: 0 = player is dealer this hand */
  dealerIndex: number;

  /** Minimum legal raise size (the increment, not the total bet) */
  minRaiseSize: number;
  /** The amount of the last raise increment */
  lastRaiseSize: number;
  /** Number of actions taken in this betting round (to detect when round is over) */
  actionsThisRound: number;
  /** Whether the last aggressive action was a bet/raise (not a call) */
  lastAggressorIndex: number | null;
  /** Has the big blind had their option preflop (i.e., can still raise after a call) */
  bbOptionAvailable: boolean;

  winners: WinnerInfo[];
  handHistory: HandHistoryEntry[];

  // Score (persisted externally, but carried in state for convenience)
  score: { wins: number; losses: number; draws: number };

  handNumber: number;
}

export interface Action {
  type: 'fold' | 'check' | 'call' | 'raise' | 'allin';
  /** For raise: the total bet amount (not just the increment) */
  amount?: number;
}

export interface ActionResult {
  newState: GameState;
  valid: boolean;
  error?: string;
  handOver: boolean;
  winners?: WinnerInfo[];
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function opponent(idx: number): number {
  return idx === 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Public: createDeck
// ---------------------------------------------------------------------------

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return shuffleArray(deck);
}

// ---------------------------------------------------------------------------
// Public: createGame
// ---------------------------------------------------------------------------

export function createGame(
  startingStack = 50,
  smallBlind = 1,
  bigBlind = 2,
): GameState {
  const makePlayer = (id: 'player' | 'bot'): PlayerState => ({
    id,
    stack: startingStack,
    holeCards: [],
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
  });

  return {
    startingStack,
    smallBlind,
    bigBlind,
    players: [makePlayer('player'), makePlayer('bot')],
    pot: 0,
    sidePots: [],
    communityCards: [],
    deck: [],
    street: 'preflop',
    phase: 'waiting',
    activePlayerIndex: 0,
    dealerIndex: 0, // player starts as dealer (SB heads-up)
    minRaiseSize: bigBlind,
    lastRaiseSize: bigBlind,
    actionsThisRound: 0,
    lastAggressorIndex: null,
    bbOptionAvailable: false,
    winners: [],
    handHistory: [],
    score: { wins: 0, losses: 0, draws: 0 },
    handNumber: 0,
  };
}

// ---------------------------------------------------------------------------
// Public: startHand
// ---------------------------------------------------------------------------

export function startHand(state: GameState): GameState {
  const s = deepCloneState(state);

  // Alternate dealer each hand
  const newDealerIndex = opponent(s.dealerIndex);
  s.dealerIndex = newDealerIndex;
  s.handNumber += 1;

  // Reset per-hand fields
  s.communityCards = [];
  s.sidePots = [];
  s.winners = [];
  s.handHistory = [];
  s.street = 'preflop';
  s.phase = 'betting';
  s.actionsThisRound = 0;
  s.lastAggressorIndex = null;

  // Reset players
  for (const p of s.players) {
    p.holeCards = [];
    p.currentBet = 0;
    p.totalBetThisRound = 0;
    p.folded = false;
    p.allIn = false;
  }

  // Fresh deck
  s.deck = createDeck();

  // Deal 2 hole cards each
  for (let i = 0; i < 2; i++) {
    for (const p of s.players) {
      p.holeCards.push(s.deck.pop()!);
    }
  }

  // Heads-up blind rule: dealer = small blind, acts first preflop
  const sbIndex = newDealerIndex;          // dealer is SB heads-up
  const bbIndex = opponent(newDealerIndex);

  s.pot = 0;
  s.minRaiseSize = s.bigBlind;
  s.lastRaiseSize = s.bigBlind;

  // Post small blind
  const sbPost = Math.min(s.smallBlind, s.players[sbIndex].stack);
  s.players[sbIndex].stack -= sbPost;
  s.players[sbIndex].currentBet = sbPost;
  s.players[sbIndex].totalBetThisRound = sbPost;
  if (s.players[sbIndex].stack === 0) s.players[sbIndex].allIn = true;
  s.pot += sbPost;

  // Post big blind
  const bbPost = Math.min(s.bigBlind, s.players[bbIndex].stack);
  s.players[bbIndex].stack -= bbPost;
  s.players[bbIndex].currentBet = bbPost;
  s.players[bbIndex].totalBetThisRound = bbPost;
  if (s.players[bbIndex].stack === 0) s.players[bbIndex].allIn = true;
  s.pot += bbPost;

  // BB has option to raise preflop (even if SB just calls)
  s.bbOptionAvailable = true;

  // Preflop: SB (dealer) acts first
  s.activePlayerIndex = sbIndex;

  // If either player is already all-in after posting blinds:
  // resolve any unequal contributions, run out all community cards, and go straight to showdown.
  if (s.players[sbIndex].allIn || s.players[bbIndex].allIn) {
    resolveSidePots(s);
    const boardState = runOutBoard(s);
    const result = endWithShowdown(boardState);
    return result.newState;
  }

  return s;
}

// ---------------------------------------------------------------------------
// Public: applyAction
// ---------------------------------------------------------------------------

export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.phase !== 'betting') {
    return { newState: state, valid: false, error: 'Not in a betting phase', handOver: false };
  }

  const s = deepCloneState(state);
  const actorIdx = s.activePlayerIndex;
  const actor = s.players[actorIdx];
  const opp = s.players[opponent(actorIdx)];

  // ---------------------------------------------------------------------------
  // Validate & apply action
  // ---------------------------------------------------------------------------

  const callAmount = Math.max(0, opp.currentBet - actor.currentBet);

  switch (action.type) {
    // --- FOLD ---
    case 'fold': {
      if (callAmount === 0 && actor.currentBet === opp.currentBet) {
        return { newState: state, valid: false, error: 'Cannot fold when you can check', handOver: false };
      }
      actor.folded = true;
      recordHistory(s, action);
      const winners = awardPotToOpponent(s, actorIdx);
      s.phase = 'ended';
      s.winners = winners;
      return { newState: s, valid: true, handOver: true, winners };
    }

    // --- CHECK ---
    case 'check': {
      if (callAmount > 0) {
        return { newState: state, valid: false, error: `Must call ${callAmount} or fold`, handOver: false };
      }
      recordHistory(s, action);
      s.actionsThisRound += 1;
      break;
    }

    // --- CALL ---
    case 'call': {
      if (callAmount === 0) {
        return { newState: state, valid: false, error: 'Nothing to call — use check', handOver: false };
      }
      const actualCall = Math.min(callAmount, actor.stack);
      actor.stack -= actualCall;
      actor.currentBet += actualCall;
      actor.totalBetThisRound += actualCall;
      s.pot += actualCall;
      if (actor.stack === 0) actor.allIn = true;
      recordHistory(s, action);
      s.actionsThisRound += 1;
      break;
    }

    // --- RAISE ---
    case 'raise': {
      if (actor.allIn) {
        return { newState: state, valid: false, error: 'Player is all-in', handOver: false };
      }
      const totalBet = action.amount ?? 0;
      const raiseIncrement = totalBet - opp.currentBet;
      if (raiseIncrement < s.minRaiseSize && actor.stack > raiseIncrement) {
        return {
          newState: state, valid: false,
          error: `Minimum raise is ${s.minRaiseSize} (total bet ${opp.currentBet + s.minRaiseSize})`,
          handOver: false,
        };
      }
      const chipsNeeded = totalBet - actor.currentBet;
      if (chipsNeeded > actor.stack) {
        return { newState: state, valid: false, error: 'Not enough chips — use allin', handOver: false };
      }
      actor.stack -= chipsNeeded;
      actor.currentBet = totalBet;
      actor.totalBetThisRound += chipsNeeded;
      s.pot += chipsNeeded;
      if (actor.stack === 0) actor.allIn = true;
      s.lastRaiseSize = raiseIncrement;
      s.minRaiseSize = raiseIncrement; // next min-raise = size of this raise
      s.lastAggressorIndex = actorIdx;
      s.bbOptionAvailable = false; // aggression resets BB option flag
      recordHistory(s, action);
      s.actionsThisRound += 1;
      break;
    }

    // --- ALL-IN ---
    case 'allin': {
      if (actor.allIn) {
        return { newState: state, valid: false, error: 'Already all-in', handOver: false };
      }
      const allInTotal = actor.currentBet + actor.stack;
      // If the all-in is a raise (bigger than current bet), update raise tracking
      if (allInTotal > opp.currentBet) {
        const increment = allInTotal - opp.currentBet;
        if (increment > s.lastRaiseSize) {
          s.lastRaiseSize = increment;
          s.minRaiseSize = increment;
        }
        s.lastAggressorIndex = actorIdx;
        s.bbOptionAvailable = false;
      }
      s.pot += actor.stack;
      actor.currentBet = allInTotal;
      actor.totalBetThisRound += actor.stack;
      actor.stack = 0;
      actor.allIn = true;
      recordHistory(s, { ...action, amount: allInTotal });
      s.actionsThisRound += 1;
      break;
    }

    default:
      return { newState: state, valid: false, error: 'Unknown action', handOver: false };
  }

  // ---------------------------------------------------------------------------
  // Determine if betting round is complete
  // ---------------------------------------------------------------------------

  const roundOver = isBettingRoundOver(s, actorIdx, action.type);

  if (roundOver) {
    // Resolve side pots before advancing
    resolveSidePots(s);

    if (s.street === 'river') {
      // Showdown
      return endWithShowdown(s);
    }

    // Check if both players are all-in — run out board immediately
    if (s.players[0].allIn || s.players[1].allIn) {
      return endWithShowdown(runOutBoard(s));
    }

    // Advance to next street
    advanceStreet(s);
    return { newState: s, valid: true, handOver: false };
  }

  // Pass action to opponent
  s.activePlayerIndex = opponent(actorIdx);
  return { newState: s, valid: true, handOver: false };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function recordHistory(s: GameState, action: Action) {
  s.handHistory.push({
    street: s.street,
    playerId: s.players[s.activePlayerIndex].id,
    action,
    potAfter: s.pot,
  });
}

function isBettingRoundOver(s: GameState, justActedIdx: number, actionType: string): boolean {
  const actor = s.players[justActedIdx];
  const opp = s.players[opponent(justActedIdx)];

  // Obvious terminal conditions
  if (opp.folded)  return true;
  if (actor.folded) return true;

  // Both all-in
  if (actor.allIn && opp.allIn) return true;

  // Opponent is already all-in — actor just responded, no further action possible
  if (opp.allIn) return true;

  // Actor called all-in for LESS than the required amount (short call)
  // Opponent already put in more and can't raise further; excess returned by resolveSidePots
  if (actor.allIn && actor.currentBet < opp.currentBet) return true;

  const betsEqual = actor.currentBet === opp.currentBet;

  if (!betsEqual) return false; // opponent still needs to respond to a bet/raise

  // Preflop special: BB has option if bets are equal after SB call (no raise yet)
  if (s.street === 'preflop' && s.bbOptionAvailable) {
    const bbIdx = opponent(s.dealerIndex);
    if (justActedIdx !== bbIdx && actionType === 'call') {
      // SB called — BB gets option to raise or check
      s.bbOptionAvailable = true;
      s.activePlayerIndex = bbIdx;
      return false;
    }
    // BB just acted (checked or raised their option) — round over
    if (justActedIdx === bbIdx) {
      s.bbOptionAvailable = false;
      return true;
    }
  }

  // Normal case: both players have had at least one action and bets are equal
  return s.actionsThisRound >= 2 && betsEqual;
}

function advanceStreet(s: GameState) {
  // Reset bets for new street
  for (const p of s.players) {
    p.currentBet = 0;
    p.totalBetThisRound = 0;
  }
  s.actionsThisRound = 0;
  s.lastAggressorIndex = null;
  s.minRaiseSize = s.bigBlind;
  s.lastRaiseSize = s.bigBlind;

  switch (s.street) {
    case 'preflop':
      // Deal flop (3 cards)
      s.deck.pop(); // burn
      s.communityCards.push(s.deck.pop()!, s.deck.pop()!, s.deck.pop()!);
      s.street = 'flop';
      break;
    case 'flop':
      s.deck.pop(); // burn
      s.communityCards.push(s.deck.pop()!);
      s.street = 'turn';
      break;
    case 'turn':
      s.deck.pop(); // burn
      s.communityCards.push(s.deck.pop()!);
      s.street = 'river';
      break;
  }

  // Postflop: non-dealer acts first (BB = opponent of dealer)
  const bbIdx = opponent(s.dealerIndex);
  // If BB is folded or all-in, dealer acts first
  if (s.players[bbIdx].folded || s.players[bbIdx].allIn) {
    s.activePlayerIndex = s.dealerIndex;
  } else if (s.players[s.dealerIndex].folded || s.players[s.dealerIndex].allIn) {
    s.activePlayerIndex = bbIdx;
  } else {
    s.activePlayerIndex = bbIdx;
  }

  s.phase = 'betting';
}

function runOutBoard(s: GameState): GameState {
  // Deal remaining community cards without betting
  if (s.communityCards.length < 3) {
    s.deck.pop(); // burn
    s.communityCards.push(s.deck.pop()!, s.deck.pop()!, s.deck.pop()!);
  }
  if (s.communityCards.length < 4) {
    s.deck.pop();
    s.communityCards.push(s.deck.pop()!);
  }
  if (s.communityCards.length < 5) {
    s.deck.pop();
    s.communityCards.push(s.deck.pop()!);
  }
  s.street = 'river';
  return s;
}

function resolveSidePots(s: GameState) {
  // Only needed when a player is all-in
  // Simple heads-up side pot resolution:
  // If one player bet more than the other can call, the excess goes back
  const [p0, p1] = s.players;
  if (p0.allIn || p1.allIn) {
    const totalContrib0 = p0.totalBetThisRound;
    const totalContrib1 = p1.totalBetThisRound;
    const excess = Math.abs(totalContrib0 - totalContrib1);

    if (excess > 0) {
      const bigStackIdx = totalContrib0 > totalContrib1 ? 0 : 1;
      // Return excess to big stack player
      s.players[bigStackIdx].stack += excess;
      s.pot -= excess;
      s.players[bigStackIdx].totalBetThisRound -= excess;
    }
  }
}

function awardPotToOpponent(s: GameState, foldedIdx: number): WinnerInfo[] {
  const winnerId = s.players[opponent(foldedIdx)].id;
  s.players[opponent(foldedIdx)].stack += s.pot;
  const winners: WinnerInfo[] = [{ playerId: winnerId, amount: s.pot, potType: 'main' }];
  s.pot = 0;
  return winners;
}

function endWithShowdown(s: GameState): ActionResult {
  s.street = 'showdown';
  s.phase = 'showdown';
  const winners = determineWinners(s);
  s.winners = winners;

  // Award chips
  for (const w of winners) {
    const p = s.players.find(p => p.id === w.playerId)!;
    p.stack += w.amount;
  }
  s.pot = 0;
  s.sidePots = [];
  s.phase = 'ended';

  return { newState: s, valid: true, handOver: true, winners };
}

// ---------------------------------------------------------------------------
// Public: evaluateHand — delegates to evaluator.ts
// ---------------------------------------------------------------------------

export function evaluateHand(
  holeCards: Card[],
  communityCards: Card[],
): EvaluatedHand {
  return evalHand(holeCards, communityCards);
}

// ---------------------------------------------------------------------------
// Public: determineWinners
// ---------------------------------------------------------------------------

export function determineWinners(state: GameState): WinnerInfo[] {
  const activePlayers = state.players.filter(p => !p.folded);

  if (activePlayers.length === 1) {
    return [{
      playerId: activePlayers[0].id,
      amount: state.pot,
      potType: 'main',
    }];
  }

  // Evaluate hands
  const evals = activePlayers.map(p => ({
    player: p,
    eval: evaluateHand(p.holeCards, state.communityCards),
  }));

  evals.sort((a, b) => compareHands(b.eval, a.eval));
  const best = evals[0].eval.score;
  const winners = evals.filter(e => e.eval.score === best);

  if (winners.length === 1) {
    return [{
      playerId: winners[0].player.id,
      amount: state.pot,
      handDescription: winners[0].eval.description,
      potType: 'main',
    }];
  }

  // Split pot — odd chip goes to first player left of dealer (index = dealer+1)
  const splitAmount = Math.floor(state.pot / winners.length);
  const remainder = state.pot % winners.length;
  return winners.map((w, i) => ({
    playerId: w.player.id,
    amount: splitAmount + (i === 0 ? remainder : 0),
    handDescription: w.eval.description,
    potType: 'main' as const,
  }));
}

// ---------------------------------------------------------------------------
// Utility exports (useful for bot/UI)
// ---------------------------------------------------------------------------

/** Returns the legal actions available for the active player */
export function getLegalActions(state: GameState): {
  canCheck: boolean;
  canCall: boolean;
  canFold: boolean;
  canRaise: boolean;
  callAmount: number;
  minRaiseTotal: number;
  maxRaiseTotal: number;
} {
  const actor = state.players[state.activePlayerIndex];
  const opp = state.players[opponent(state.activePlayerIndex)];
  const callAmount = Math.max(0, opp.currentBet - actor.currentBet);
  const canCheck = callAmount === 0 && !actor.allIn;
  const canCall = callAmount > 0 && !actor.allIn && actor.stack > 0;
  const canFold = callAmount > 0;
  const minRaiseTotal = opp.currentBet + state.minRaiseSize;
  const maxRaiseTotal = actor.currentBet + actor.stack; // all-in
  const canRaise = !actor.allIn && actor.stack > callAmount;

  return { canCheck, canCall, canFold, canRaise, callAmount, minRaiseTotal, maxRaiseTotal };
}
