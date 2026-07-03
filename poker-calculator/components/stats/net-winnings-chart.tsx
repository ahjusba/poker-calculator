'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { PlayerSessionResult } from '@/lib/stats';
import {
  buildChartData,
  getPlayerMeta,
  getTopPlayerIds,
  playerKey,
  type PlayerMeta,
} from '@/lib/stats-utils';

interface NetWinningsChartProps {
  rows: PlayerSessionResult[];
}

const TOP_VISIBLE = 10;
const TOP_SELECTED = 5;
const UNLOCK_PASSWORD = 'kakkosseiska';

const euroCompact = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const euroFull = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an epoch timestamp as e.g. "Jan 2026". */
function formatMonth(time: number): string {
  return new Date(time).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/** Formats an epoch timestamp as a full date for tooltips. */
function formatFullDate(time: number): string {
  return new Date(time).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Converts an epoch timestamp to a yyyy-mm-dd string for date inputs. */
function toDateInputValue(time: number): string {
  const d = new Date(time);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | null;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: number;
  payload?: readonly TooltipEntry[];
  playersById: Map<string, PlayerMeta>;
  isSession?: boolean;
}

function CustomTooltip({ active, payload, label, playersById, isSession }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter(entry => entry.value !== null && entry.value !== undefined)
    .sort((a, b) => (b.value as number) - (a.value as number));

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/20 bg-poker-dark-green/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-poker-sage">
        {isSession ? `Session #${label}` : formatFullDate(label as number)}
      </div>
      <div className="space-y-1">
        {rows.map(entry => {
          const meta = playersById.get(entry.dataKey as string);
          return (
            <div key={entry.dataKey as string} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="mr-2">{meta?.name ?? entry.name}</span>
              <span className="ml-auto font-mono font-semibold">
                {euroFull.format(entry.value as number)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NetWinningsChart({ rows }: NetWinningsChartProps) {
  const players = useMemo(() => getPlayerMeta(rows), [rows]);
  const topIds = useMemo(() => getTopPlayerIds(players, TOP_SELECTED), [players]);

  const bounds = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of rows) {
      const t = new Date(row.created_at).getTime();
      if (t < min) min = t;
      if (t > max) max = t;
    }
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    };
  }, [rows]);

  // Full (unfiltered) timeline — used for the session-count mode and totals.
  const fullData = useMemo(() => buildChartData(rows), [rows]);
  const totalSessions = fullData.length;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(topIds));
  const [startDate, setStartDate] = useState<string>(() => toDateInputValue(bounds.min));
  const [endDate, setEndDate] = useState<string>(() => toDateInputValue(bounds.max));
  const [xMode, setXMode] = useState<'time' | 'session'>('time');
  const [lastN, setLastN] = useState<number | ''>('');
  const [unlocked, setUnlocked] = useState(false);
  const [secret, setSecret] = useState('');

  const isSession = xMode === 'session';

  const range = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;
    return { start, end };
  }, [startDate, endDate]);

  const timeData = useMemo(() => buildChartData(rows, range), [rows, range]);

  // Session-count data: the last N sessions of the full timeline, numbered.
  const sessionData = useMemo(() => {
    const n = lastN === '' ? totalSessions : Math.max(1, Math.min(lastN, totalSessions));
    return fullData
      .map((point, i) => ({ ...point, sessionNo: i + 1 }))
      .slice(totalSessions - n);
  }, [fullData, lastN, totalSessions]);

  const chartData = isSession ? sessionData : timeData;
  const xKey = isSession ? 'sessionNo' : 'time';

  const playersByKey = useMemo(() => {
    const map = new Map<string, PlayerMeta>();
    for (const player of players) map.set(playerKey(player.id), player);
    return map;
  }, [players]);

  // Only the top N players are available unless unlocked with the password.
  const visiblePlayers = unlocked ? players : players.slice(0, TOP_VISIBLE);
  const selectedPlayers = players.filter(player => selectedIds.has(player.id));

  const xTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    const key = isSession ? 'sessionNo' : 'time';
    const first = (chartData[0] as Record<string, number>)[key];
    const last = (chartData[chartData.length - 1] as Record<string, number>)[key];
    return first === last ? [first] : [first, last];
  }, [chartData, isSession]);

  const togglePlayer = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (on: boolean) => {
    setSelectedIds(on ? new Set(visiblePlayers.map(p => p.id)) : new Set());
  };

  const handleSecret = (value: string) => {
    setSecret(value);
    if (value.trim().toLowerCase() === UNLOCK_PASSWORD) {
      setUnlocked(true);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-poker-sage text-lg">
          No session data yet. Submit sessions to see the winnings chart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart area — only shown in landscape orientation */}
      <div className="card">
        {/* Rotate prompt (portrait only) */}
        <div className="landscape:hidden flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 animate-pulse text-6xl">🔄</div>
          <p className="text-lg font-semibold text-poker-light-green">
            Rotate your device
          </p>
          <p className="mt-1 text-sm text-poker-sage">
            Turn your phone sideways to view the winnings chart.
          </p>
        </div>

        {/* Chart (landscape only) */}
        <div className="hidden landscape:block">
          {selectedPlayers.length === 0 || chartData.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center text-center text-poker-sage">
              No players selected. Toggle players on below to see the chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, bottom: 8, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey={xKey}
                  type="number"
                  scale={isSession ? 'linear' : 'time'}
                  domain={['dataMin', 'dataMax']}
                  ticks={xTicks}
                  allowDecimals={false}
                  tickFormatter={value =>
                    isSession ? `#${value}` : formatMonth(value as number)
                  }
                  stroke="#b2b09b"
                  tick={{ fontSize: 12, fill: '#b2b09b' }}
                />
                <YAxis
                  tickFormatter={value => euroCompact.format(value as number)}
                  stroke="#b2b09b"
                  tick={{ fontSize: 12, fill: '#b2b09b' }}
                  width={64}
                />
                <Tooltip
                  content={props => (
                    <CustomTooltip
                      active={props.active}
                      label={props.label as number | undefined}
                      payload={props.payload as readonly TooltipEntry[] | undefined}
                      playersById={playersByKey}
                      isSession={isSession}
                    />
                  )}
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                />
                {selectedPlayers.map(player => (
                  <Line
                    key={player.id}
                    type="linear"
                    dataKey={playerKey(player.id)}
                    name={player.name}
                    stroke={player.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Player toggles */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-poker-light-green">👥 Players</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => toggleAll(true)} className="btn-primary">
              Toggle all: On
            </button>
            <button type="button" onClick={() => toggleAll(false)} className="btn-secondary">
              Toggle all: Off
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visiblePlayers.map(player => {
            const selected = selectedIds.has(player.id);
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  selected
                    ? 'border-transparent text-white shadow-md'
                    : 'border-white/20 text-poker-sage opacity-60 hover:opacity-100'
                }`}
                style={selected ? { backgroundColor: player.color } : undefined}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                {player.name}
              </button>
            );
          })}
        </div>

        {/* Secret unlock for all players */}
        {unlocked ? (
          <p className="mt-4 text-sm text-poker-light-green">
            🔓 All {players.length} players unlocked.
          </p>
        ) : (
          <div className="mt-4">
            <p className="mb-1 text-xs text-poker-sage">
              Showing the top {Math.min(TOP_VISIBLE, players.length)} players.
            </p>
            <input
              type="password"
              value={secret}
              onChange={e => handleSecret(e.target.value)}
              placeholder="🔒 Password to unlock all players"
              className="input-field max-w-xs"
              autoComplete="off"
            />
          </div>
        )}
      </div>

      {/* X-axis mode + range / session controls (below Players) */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-poker-light-green">📈 X-axis</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setXMode('time')}
              aria-pressed={!isSession}
              className={!isSession ? 'btn-primary' : 'btn-secondary opacity-70'}
            >
              Time
            </button>
            <button
              type="button"
              onClick={() => setXMode('session')}
              aria-pressed={isSession}
              className={isSession ? 'btn-primary' : 'btn-secondary opacity-70'}
            >
              Session count
            </button>
          </div>
        </div>

        {isSession ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm text-poker-sage">
              Show last N sessions (of {totalSessions})
              <input
                type="number"
                min={1}
                max={totalSessions}
                value={lastN}
                placeholder={String(totalSessions)}
                onChange={e =>
                  setLastN(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="input-field"
              />
            </label>
            <button
              type="button"
              onClick={() => setLastN('')}
              className="btn-secondary whitespace-nowrap"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm text-poker-sage">
              From
              <input
                type="date"
                value={startDate}
                min={toDateInputValue(bounds.min)}
                max={endDate || toDateInputValue(bounds.max)}
                onChange={e => setStartDate(e.target.value)}
                className="input-field"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-poker-sage">
              To
              <input
                type="date"
                value={endDate}
                min={startDate || toDateInputValue(bounds.min)}
                max={toDateInputValue(bounds.max)}
                onChange={e => setEndDate(e.target.value)}
                className="input-field"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setStartDate(toDateInputValue(bounds.min));
                setEndDate(toDateInputValue(bounds.max));
              }}
              className="btn-secondary whitespace-nowrap"
            >
              Reset range
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
