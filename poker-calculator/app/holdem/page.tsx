'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameStoreProvider, useGame } from '@/lib/holdem/useGameStore';
import { applyAction, type Card } from '@/lib/holdem/engine';
import { PlayerSeat } from '@/components/holdem/PlayerSeat';
import { CommunityCards } from '@/components/holdem/CommunityCards';
import { ActionPanel } from '@/components/holdem/ActionPanel';

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Game-over screen
// ---------------------------------------------------------------------------

function GameOverScreen({
  score,
  onReset,
}: {
  score: { wins: number; losses: number; draws: number };
  onReset: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: '#1a3530',
          border: '2px solid #43aa8b',
          borderRadius: 16,
          padding: '40px 56px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🃏</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Game Over
        </div>
        <div style={{ fontSize: 14, color: '#b2b09b', marginBottom: 24 }}>
          W {score.wins} · L {score.losses} · D {score.draws}
        </div>
        <button
          onClick={onReset}
          style={{
            background: '#43aa8b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ score }: { score: { wins: number; losses: number; draws: number } }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.3)',
        fontSize: 13,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span style={{ color: '#43aa8b', fontWeight: 700 }}>W {score.wins}</span>
      <span style={{ color: '#ef3054', fontWeight: 700 }}>L {score.losses}</span>
      <span style={{ color: '#b2b09b', fontWeight: 700 }}>D {score.draws}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner game (uses useGame — must be inside provider)
// ---------------------------------------------------------------------------

function HoldemGame() {
  const { gameState, score, dispatch, startNewHand, resetGame } = useGame();
  const handStartedRef = useRef(false);
  const [transition, setTransition] = useState<{ bets: [number, number]; cards: Card[] } | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Auto-start first hand on mount
  useEffect(() => {
    if (!handStartedRef.current && gameState.phase === 'waiting') {
      handStartedRef.current = true;
      startNewHand();
    }
  }, [gameState.phase, startNewHand]);

  // After hand ends, auto-start next hand after 1.5s so the inline result is visible.
  // Does NOT fire when a stack hits 0 — the game-over screen handles that instead.
  useEffect(() => {
    if (gameState.phase !== 'ended' || gameState.winners.length === 0) return;
    const [p0, p1] = gameState.players;
    if (p0.stack === 0 || p1.stack === 0) return;
    const timeout = setTimeout(() => {
      startNewHand();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [gameState.phase, gameState.handNumber, gameState.players, gameState.winners.length, startNewHand]);

  const handleAction = useCallback(
    (action: Parameters<typeof dispatch>[0]) => {
      // Preview the action to detect an upcoming street change
      const preview = applyAction(gameState, action);
      const willChangeStreet =
        preview.valid &&
        !preview.handOver &&
        preview.newState.street !== gameState.street;

      if (willChangeStreet) {
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        // Capture bets and current cards before the engine resets them
        setTransition({
          bets: [gameState.players[0].currentBet, gameState.players[1].currentBet],
          cards: [...gameState.communityCards],
        });
        dispatch(action);
        transitionTimeoutRef.current = setTimeout(() => setTransition(null), 950);
      } else {
        dispatch(action);
      }
    },
    [gameState, dispatch],
  );

  const handleReset = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    setTransition(null);
    resetGame();
    handStartedRef.current = false;
  }, [resetGame]);

  const [player, bot] = gameState.players;

  // During street transitions use captured cards/bets; otherwise use live state
  const displayCards = transition ? transition.cards : gameState.communityCards;
  const displayBet0  = transition ? transition.bets[0] : player.currentBet;
  const displayBet1  = transition ? transition.bets[1] : bot.currentBet;

  // Derive result text purely from game state — no extra state means no setState-during-render risk
  const handResult = (() => {
    if (gameState.phase !== 'ended' || gameState.winners.length === 0) return null;
    const playerWon = gameState.winners.some(w => w.playerId === 'player');
    const botWon    = gameState.winners.some(w => w.playerId === 'bot');
    const desc      = gameState.winners[0]?.handDescription;
    if (playerWon && botWon) return { text: '🤝 Split pot', color: '#d4a017', desc };
    if (playerWon)           return { text: '✓ You win',   color: '#d4a017', desc };
    return                          { text: '✗ Opponent wins', color: '#ef3054', desc };
  })();

  const isGameOver =
    gameState.phase === 'ended' &&
    (player.stack === 0 || bot.stack === 0);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Score */}
      <ScoreBar score={score} />

      {/* Felt table wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 10px 90px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
            padding: 16,
            background: 'radial-gradient(ellipse at 50% 50%, #3d0c0c 0%, #250808 100%)',
            border: '5px solid #5a1515',
            borderRadius: 22,
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 6px 28px rgba(0,0,0,0.55)',
          }}
        >
          {/* Opponent (top) */}
          <PlayerSeat
            player={bot}
            isActive={gameState.activePlayerIndex === 1}
            isDealer={gameState.dealerIndex === 1}
            position="top"
            displayBet={displayBet1}
          />

          {/* Community cards (center) */}
          <CommunityCards
            communityCards={displayCards}
            pot={gameState.pot}
            sidePots={gameState.sidePots.length > 0 ? gameState.sidePots : undefined}
            street={gameState.street}
          />

          {/* Player (bottom) */}
          <PlayerSeat
            player={player}
            isActive={gameState.activePlayerIndex === 0}
            isDealer={gameState.dealerIndex === 0}
            position="bottom"
            displayBet={displayBet0}
          />

          {/* Subtle inline result */}
          <div style={{ minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {handResult && (
              <>
                <span style={{ fontWeight: 700, fontSize: 13, color: handResult.color }}>
                  {handResult.text}
                </span>
                {handResult.desc && (
                  <span style={{ fontSize: 11, color: '#b2b09b' }}>
                    — {handResult.desc}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action panel — disabled=false so both players use the same buttons */}
      <ActionPanel
        gameState={gameState}
        onAction={handleAction}
        disabled={false}
      />

      {/* Game-over screen */}
      {isGameOver && (
        <GameOverScreen score={score} onReset={handleReset} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (with provider wrapper)
// ---------------------------------------------------------------------------

export default function HoldemPage() {
  return (
    <GameStoreProvider>
      <HoldemGame />
    </GameStoreProvider>
  );
}
