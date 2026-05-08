import type { Card, SidePot, Street } from '@/lib/holdem/engine';
import { PlayingCard } from './PlayingCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommunityCardsProps {
  communityCards: Card[];
  pot: number;
  sidePots?: SidePot[];
  street?: Street;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STREET_LABELS: Partial<Record<Street, string>> = {
  flop:     'FLOP',
  turn:     'TURN',
  river:    'RIVER',
  showdown: 'SHOWDOWN',
};

// Empty card slot placeholder
function EmptySlot() {
  return (
    <div
      style={{
        width: 56,
        height: 80,
        borderRadius: 6,
        border: '1.5px dashed rgba(67,170,139,0.3)',
        background: 'rgba(255,255,255,0.03)',
        flexShrink: 0,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityCards({ communityCards, pot, sidePots, street }: CommunityCardsProps) {
  const streetLabel = street ? STREET_LABELS[street] : undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0',
      }}
    >
      {/* Pot amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            background: 'rgba(180,130,0,0.18)',
            border: '1px solid #d4a017',
            borderRadius: 20,
            padding: '3px 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#f0d060',
            letterSpacing: '0.02em',
          }}
        >
          Pot: {pot}
        </div>

        {/* Street label */}
        {streetLabel && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#43aa8b',
              letterSpacing: '0.12em',
              opacity: 0.75,
            }}
          >
            {streetLabel}
          </span>
        )}
      </div>

      {/* 5 card slots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const card = communityCards[i];
          return card
            ? <PlayingCard key={i} card={card} size="md" />
            : <EmptySlot key={i} />;
        })}
      </div>

      {/* Side pots */}
      {sidePots && sidePots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {sidePots.map((sp, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                color: '#b2b09b',
              }}
            >
              Side pot: {sp.amount} chips
              <span style={{ color: '#43aa8b88', marginLeft: 4 }}>
                ({sp.eligible.join(' & ')})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
