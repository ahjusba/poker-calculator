import type { Card, Rank } from '@/lib/holdem/engine';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUIT_SYMBOL: Record<string, string> = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
};

const SUIT_COLOR: Record<string, string> = {
  spades:   '#1a1a1a',
  hearts:   '#e53e3e',
  diamonds: '#3182ce',
  clubs:    '#38a169',
};

const SIZE_DIMS = {
  sm: { width: 40,  height: 56,  rankSize: 20, suitSize: 18 },
  md: { width: 56,  height: 80,  rankSize: 28, suitSize: 24 },
  lg: { width: 72,  height: 100, rankSize: 36, suitSize: 30 },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankLabel(rank: Rank): string {
  return String(rank);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlayingCardProps {
  card?: Card | null;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlayingCard({
  card = null,
  size = 'md',
  faceDown = false,
  className = '',
}: PlayingCardProps) {
  const { width, height } = SIZE_DIMS[size];
  const showFaceDown = faceDown || card === null;

  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: size === 'sm' ? 4 : size === 'md' ? 6 : 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    userSelect: 'none',
  };

  if (showFaceDown) {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#1e3a34',
          border: '1.5px solid #2d5a4f',
        }}
        className={className}
        aria-label="Card face down"
      >
        {/* Diagonal stripe back pattern */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          <defs>
            <pattern
              id={`back-${size}`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#43aa8b22" strokeWidth="3" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill={`url(#back-${size})`} />
          {/* Inner border inset */}
          <rect
            x={3} y={3}
            width={width - 6} height={height - 6}
            rx={size === 'sm' ? 2 : 4}
            fill="none"
            stroke="#43aa8b44"
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  }

  // Face-up card
  const color = SUIT_COLOR[card!.suit];
  const symbol = SUIT_SYMBOL[card!.suit];
  const label = rankLabel(card!.rank);
  const { rankSize, suitSize } = SIZE_DIMS[size];

  return (
    <div
      style={{
        ...baseStyle,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
      }}
      className={className}
      aria-label={`${label} of ${card!.suit}`}
    >
      {/* Big centered rank + suit stacked */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          gap: 1,
        }}
      >
        <span style={{ fontSize: rankSize, fontWeight: 800, lineHeight: 1, fontFamily: '"Georgia", serif' }}>
          {label}
        </span>
        <span style={{ fontSize: suitSize, lineHeight: 1 }}>{symbol}</span>
      </div>
    </div>
  );
}
