'use client';

import { useState, useEffect } from 'react';
import type { Action, GameState } from '@/lib/holdem/engine';
import { getLegalActions } from '@/lib/holdem/engine';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ActionPanelProps {
  gameState: GameState;
  onAction: (action: Action) => void;
  disabled: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ActionPanel({ gameState, onAction, disabled }: ActionPanelProps) {
  const legal = getLegalActions(gameState);
  const actor = gameState.players[gameState.activePlayerIndex];
  const bigBlind = gameState.bigBlind;
  const isAllIn = actor.allIn || actor.stack === 0;
  const raiseLabel = legal.callAmount > 0 ? 'Raise' : 'Bet';

  const [raiseValue, setRaiseValue] = useState(legal.minRaiseTotal);

  // Reset raise value when active player changes or new hand/street starts
  useEffect(() => {
    setRaiseValue(legal.minRaiseTotal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.activePlayerIndex, gameState.handNumber, gameState.street]);

  const clampedRaise = Math.max(
    legal.minRaiseTotal,
    Math.min(raiseValue, legal.maxRaiseTotal),
  );

  const handleFold  = () => onAction({ type: 'fold' });
  const handleCheck = () => onAction({ type: 'check' });
  const handleCall  = () => onAction({ type: 'call' });
  const handleRaise = () => onAction({ type: 'raise', amount: clampedRaise });

  const decreaseRaise = () =>
    setRaiseValue(v => Math.max(legal.minRaiseTotal, v - bigBlind));
  const increaseRaise = () =>
    setRaiseValue(v => Math.min(legal.maxRaiseTotal, v + bigBlind));

  if (gameState.phase !== 'betting') return null;

  const activeId = gameState.players[gameState.activePlayerIndex].id;

  const stepBtnStyle = (greyed: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 6,
    border: '1px solid rgba(67,170,139,0.4)',
    background: greyed ? 'rgba(255,255,255,0.04)' : 'rgba(67,170,139,0.15)',
    color: greyed ? '#555' : '#43aa8b',
    fontSize: 20,
    fontWeight: 700,
    cursor: greyed ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
    padding: 0,
  });

  const neutralStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    border: 'none',
    background: '#2d5a4f',
    color: '#fff',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(18, 42, 38, 0.97)',
        borderTop: '1.5px solid rgba(67,170,139,0.25)',
        backdropFilter: 'blur(8px)',
        padding: '10px 16px 14px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Action buttons row — centered */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', justifyContent: 'center' }}>
        {legal.canFold && (
          <button
            style={{ ...neutralStyle, background: '#7a2020' }}
            onClick={handleFold}
            disabled={disabled}
          >
            Fold
          </button>
        )}

        {legal.canCheck ? (
          <button style={neutralStyle} onClick={handleCheck} disabled={disabled}>
            Check
          </button>
        ) : legal.canCall ? (
          <button style={neutralStyle} onClick={handleCall} disabled={disabled}>
            Call {legal.callAmount}
          </button>
        ) : null}

        {legal.canRaise && !isAllIn && (
          <button
            style={{ ...neutralStyle, background: '#43aa8b' }}
            onClick={handleRaise}
            disabled={disabled}
          >
            {raiseLabel} {clampedRaise}
          </button>
        )}
      </div>

      {/* Raise slider with ±BB step buttons — only when raise is possible */}
      {legal.canRaise && !isAllIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
          <button
            onClick={decreaseRaise}
            disabled={disabled || clampedRaise <= legal.minRaiseTotal}
            style={stepBtnStyle(disabled || clampedRaise <= legal.minRaiseTotal)}
          >
            −
          </button>

          <div style={{ flex: 1 }}>
            <input
              type="range"
              min={legal.minRaiseTotal}
              max={legal.maxRaiseTotal}
              step={1}
              value={clampedRaise}
              disabled={disabled}
              onChange={e => setRaiseValue(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#43aa8b', cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#b2b09b', marginTop: 1 }}>
              <span>{legal.minRaiseTotal}</span>
              <span style={{ fontWeight: 700, color: '#f0d060' }}>{clampedRaise}</span>
              <span>{legal.maxRaiseTotal}</span>
            </div>
          </div>

          <button
            onClick={increaseRaise}
            disabled={disabled || clampedRaise >= legal.maxRaiseTotal}
            style={stepBtnStyle(disabled || clampedRaise >= legal.maxRaiseTotal)}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
