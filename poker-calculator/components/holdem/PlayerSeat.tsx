import type { PlayerState } from '@/lib/holdem/engine';
import { PlayingCard } from './PlayingCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlayerSeatProps {
  player: PlayerState;
  isActive: boolean;
  isDealer: boolean;
  position: 'top' | 'bottom';
  timeLeft?: number;
  displayBet?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ player, isActive }: { player: PlayerState; isActive: boolean }) {
  const label = player.id === 'player' ? 'Y' : 'B';

  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: player.id === 'player' ? '#254441' : '#3d2b1f',
        border: isActive
          ? '3px solid #43aa8b'
          : '3px solid rgba(255,255,255,0.15)',
        boxShadow: isActive
          ? '0 0 14px 4px rgba(67,170,139,0.55)'
          : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
        color: isActive ? '#43aa8b' : '#b2b09b',
        flexShrink: 0,
        transition: 'box-shadow 0.25s, border-color 0.25s',
        position: 'relative',
      }}
    >
      {label}
    </div>
  );
}

function DealerChip() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#f0d060',
        border: '2px solid #c8a020',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 800,
        color: '#5a3a00',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      D
    </div>
  );
}

function ChipBadge({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div
      style={{
        background: 'rgba(180,130,0,0.22)',
        border: '1.5px solid #d4a017',
        borderRadius: 12,
        padding: '2px 10px',
        fontSize: 13,
        fontWeight: 700,
        color: '#f0d060',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        minWidth: 40,
        textAlign: 'center',
      }}
    >
      {amount}
    </div>
  );
}

function TimerBar({ timeLeft }: { timeLeft: number }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / 10) * 100));
  const isUrgent = timeLeft < 3;

  return (
    <div
      style={{
        width: '100%',
        height: 4,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: isUrgent ? '#ef3054' : '#43aa8b',
          borderRadius: 2,
          transition: 'width 0.9s linear, background 0.3s',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlayerSeat({
  player,
  isActive,
  isDealer,
  position,
  timeLeft,
  displayBet,
}: PlayerSeatProps) {
  const isBottom = position === 'bottom';
  const playerLabel = player.id === 'player' ? 'You' : 'Opponent';
  const betAmount = displayBet ?? player.currentBet;

  // Chip badge sits between the two players:
  // bottom player → badge above the seat; top player → badge below the seat
  const chipBadgeOrder = isBottom ? -1 : 1; // negative = rendered before cards (above), positive = after (below)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Chip badge towards the center (shown ABOVE avatar for bottom, BELOW for top) */}
      {isBottom && (
        <div style={{ order: chipBadgeOrder }}>
          <ChipBadge amount={betAmount} />
        </div>
      )}

      {/* Avatar row: avatar + dealer chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Avatar player={player} isActive={isActive} />

          {/* ALL-IN badge */}
          {player.allIn && (
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ef3054',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                borderRadius: 4,
                padding: '1px 5px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.05em',
              }}
            >
              ALL-IN
            </div>
          )}
        </div>

        {isDealer && <DealerChip />}

        {/* Player info: name + stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 64 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? '#43aa8b' : '#b2b09b',
              transition: 'color 0.2s',
            }}
          >
            {playerLabel}
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {player.stack} <span style={{ fontSize: 11, color: '#b2b09b', fontWeight: 400 }}>chips</span>
          </span>
        </div>
      </div>

      {/* Timer bar (only for active player when timeLeft is provided) */}
      {isActive && timeLeft !== undefined && (
        <div style={{ width: 160 }}>
          <TimerBar timeLeft={timeLeft} />
        </div>
      )}

      {/* Hole cards */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          position: 'relative',
        }}
      >
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <PlayingCard key={i} card={card} size="md" />
          ))
        ) : (
          // Placeholder slots when no cards dealt yet
          <>
            <PlayingCard card={null} size="md" faceDown />
            <PlayingCard card={null} size="md" faceDown />
          </>
        )}

        {/* FOLDED overlay on top of cards */}
        {player.folded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#ff6f59',
                letterSpacing: '0.1em',
              }}
            >
              FOLDED
            </span>
          </div>
        )}
      </div>

      {/* Chip badge towards the center for the TOP player (below avatar/cards) */}
      {!isBottom && (
        <div>
          <ChipBadge amount={betAmount} />
        </div>
      )}
    </div>
  );
}
