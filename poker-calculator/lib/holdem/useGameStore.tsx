'use client';

// =============================================================================
// Texas Hold'em Game Store
// useReducer + useContext pattern. Pure engine is wrapped here; no game logic
// lives in this file — it only bridges the engine to React state.
// =============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import {
  applyAction,
  createGame,
  getLegalActions,
  startHand,
  type Action,
  type ActionResult,
  type GameState,
  type WinnerInfo,
} from './engine';

// ---------------------------------------------------------------------------
// Score persistence
// ---------------------------------------------------------------------------

const SCORE_KEY = 'holdem-score';

interface Score {
  wins: number;
  losses: number;
  draws: number;
}

function loadScore(): Score {
  if (typeof window === 'undefined') return { wins: 0, losses: 0, draws: 0 };
  try {
    const raw = window.localStorage.getItem(SCORE_KEY);
    if (!raw) return { wins: 0, losses: 0, draws: 0 };
    return JSON.parse(raw) as Score;
  } catch {
    return { wins: 0, losses: 0, draws: 0 };
  }
}

function saveScore(score: Score): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCORE_KEY, JSON.stringify(score));
  } catch {
    // ignore
  }
}

function scoreFromWinners(winners: WinnerInfo[], prev: Score): Score {
  const playerWon  = winners.some(w => w.playerId === 'player');
  const botWon     = winners.some(w => w.playerId === 'bot');
  const isSplit    = playerWon && botWon;

  if (isSplit)     return { ...prev, draws:  prev.draws  + 1 };
  if (playerWon)   return { ...prev, wins:   prev.wins   + 1 };
  if (botWon)      return { ...prev, losses: prev.losses + 1 };
  return prev;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type StoreAction =
  | { type: 'DISPATCH_GAME_ACTION'; payload: Action }
  | { type: 'START_NEW_HAND' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_SCORE'; payload: Score };

interface StoreState {
  gameState: GameState;
  score: Score;
  lastResult: ActionResult | null;
}

function buildInitialState(): StoreState {
  const game = createGame(/* startingStack */ 50, /* sb */ 1, /* bb */ 2);
  return {
    gameState: game,
    score: { wins: 0, losses: 0, draws: 0 },
    lastResult: null,
  };
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {

    case 'LOAD_SCORE': {
      const merged: GameState = {
        ...state.gameState,
        score: action.payload,
      };
      return { ...state, gameState: merged, score: action.payload };
    }

    case 'START_NEW_HAND': {
      const newGame = startHand(state.gameState);
      return { ...state, gameState: newGame, lastResult: null };
    }

    case 'RESET_GAME': {
      const fresh = createGame(
        state.gameState.startingStack,
        state.gameState.smallBlind,
        state.gameState.bigBlind,
      );
      // Keep existing score
      const mergedFresh: GameState = { ...fresh, score: state.score };
      return { ...state, gameState: mergedFresh, lastResult: null };
    }

    case 'DISPATCH_GAME_ACTION': {
      const result = applyAction(state.gameState, action.payload);
      if (!result.valid) {
        // Invalid action — return unchanged state but surface the error
        return { ...state, lastResult: result };
      }

      let newScore = state.score;
      if (result.handOver && result.winners && result.winners.length > 0) {
        // Only count game wins/losses — when a player is eliminated (stack hits 0)
        const [p0, p1] = result.newState.players;
        if (p0.stack === 0 || p1.stack === 0) {
          newScore = scoreFromWinners(result.winners, state.score);
          saveScore(newScore);
        }
      }

      const newGameState: GameState = { ...result.newState, score: newScore };
      return {
        gameState: newGameState,
        score: newScore,
        lastResult: { ...result, newState: newGameState },
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GameContextValue {
  /** Full game state from the engine */
  gameState: GameState;
  /** Accumulated win/loss/draw score (also in gameState.score) */
  score: Score;
  /** The result of the last dispatched action, or null */
  lastResult: ActionResult | null;
  /** True when it is the human player's turn to act */
  isPlayerTurn: boolean;
  /** Dispatch a game action (fold / check / call / raise / allin) */
  dispatch: (action: Action) => void;
  /** Start the next hand (reuses existing stacks) */
  startNewHand: () => void;
  /** Reset the game to fresh stacks (score is preserved) */
  resetGame: () => void;
  /** Query what actions are currently legal for the active player */
  legalActions: () => ReturnType<typeof getLegalActions>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface GameStoreProviderProps {
  children: ReactNode;
}

export function GameStoreProvider({ children }: GameStoreProviderProps) {
  const [state, storeDispatch] = useReducer(reducer, undefined, buildInitialState);

  // Load persisted score once on mount (client-side only)
  const scoreLoaded = useRef(false);
  useEffect(() => {
    if (scoreLoaded.current) return;
    scoreLoaded.current = true;
    const saved = loadScore();
    storeDispatch({ type: 'LOAD_SCORE', payload: saved });
  }, []);

  const dispatch = useCallback((action: Action) => {
    storeDispatch({ type: 'DISPATCH_GAME_ACTION', payload: action });
  }, []);

  const startNewHand = useCallback(() => {
    storeDispatch({ type: 'START_NEW_HAND' });
  }, []);

  const resetGame = useCallback(() => {
    storeDispatch({ type: 'RESET_GAME' });
  }, []);

  const legalActions = useCallback(() => {
    return getLegalActions(state.gameState);
  }, [state.gameState]);

  const isPlayerTurn = useMemo(() => {
    return (
      state.gameState.phase === 'betting' &&
      state.gameState.players[state.gameState.activePlayerIndex].id === 'player'
    );
  }, [state.gameState]);

  const value = useMemo<GameContextValue>(
    () => ({
      gameState: state.gameState,
      score: state.score,
      lastResult: state.lastResult,
      isPlayerTurn,
      dispatch,
      startNewHand,
      resetGame,
      legalActions,
    }),
    [state, isPlayerTurn, dispatch, startNewHand, resetGame, legalActions],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside <GameStoreProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Re-export engine types so consumers only need to import from here
// ---------------------------------------------------------------------------
export type {
  Action,
  ActionResult,
  GameState,
  Score,
  WinnerInfo,
};
