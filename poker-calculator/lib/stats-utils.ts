import type { PlayerSessionResult } from './stats';

export interface PlayerMeta {
  id: number;
  name: string;
  total: number;
  color: string;
}

export interface PlayerSeriesData {
  players: PlayerMeta[];
  chartData: ChartPoint[];
  minTime: number;
  maxTime: number;
}

export interface ChartPoint {
  time: number;
  [playerKey: string]: number | null;
}

export interface DateRange {
  start?: number | null;
  end?: number | null;
}

/**
 * Stable palette used to color player lines. Starts with the poker theme
 * colors, then adds distinct hues for additional players.
 */
export const PLAYER_COLORS = [
  '#43aa8b', // poker light green
  '#ff6f59', // poker coral
  '#ef3054', // poker watermelon
  '#f9c74f', // yellow
  '#577590', // steel blue
  '#b2b09b', // poker sage
  '#9b5de5', // purple
  '#00bbf9', // cyan
  '#f15bb5', // pink
  '#80b918', // lime
  '#ff924c', // orange
  '#4d908e', // teal
  '#e07a5f', // terracotta
  '#3d5a80', // navy
  '#c9ada7', // dusty rose
  '#8ac926', // green
  '#ffca3a', // amber
  '#6a4c93', // deep purple
];

/**
 * Builds a data key for a player used in the chart data objects.
 */
export function playerKey(playerId: number): string {
  return `p${playerId}`;
}

/**
 * Computes per-player metadata (all-time total, stable color, ranking) from the
 * full set of session results. Players are sorted by total net winnings
 * descending so the top players and their colors stay stable regardless of any
 * date-range filtering applied to the chart itself.
 */
export function getPlayerMeta(rows: PlayerSessionResult[]): PlayerMeta[] {
  const totals = new Map<number, { name: string; total: number }>();

  for (const row of rows) {
    const existing = totals.get(row.player_id);
    if (existing) {
      existing.total += row.net_amount;
    } else {
      totals.set(row.player_id, { name: row.player_name, total: row.net_amount });
    }
  }

  return Array.from(totals.entries())
    .map(([id, { name, total }]) => ({ id, name, total }))
    .sort((a, b) => b.total - a.total)
    .map((player, index) => ({
      ...player,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));
}

/**
 * Returns the ids of the top N players by all-time net winnings.
 */
export function getTopPlayerIds(players: PlayerMeta[], n: number): number[] {
  return players.slice(0, n).map(player => player.id);
}

/**
 * Builds the chart data as a merged timeline across all sessions.
 *
 * For each unique session timestamp, each player's value is their cumulative
 * net winnings up to and including that time. A player's value is `null` before
 * their first game and after their last game, so their line cuts off cleanly
 * instead of extending as a flat line to the edges of the chart. Between a
 * player's own games the cumulative value carries forward (a flat segment),
 * which produces only leading/trailing nulls — safe for `connectNulls={false}`.
 *
 * Cumulative values are always computed from all-time history; an optional date
 * range only clips which timestamps are shown, so a line entering the visible
 * window reflects the player's true running balance at that point.
 */
export function buildChartData(
  rows: PlayerSessionResult[],
  range?: DateRange,
): ChartPoint[] {
  if (rows.length === 0) return [];

  // Per-player first/last game time (all-time) for null clipping.
  const bounds = new Map<number, { first: number; last: number }>();
  const timeSet = new Set<number>();

  for (const row of rows) {
    const t = new Date(row.created_at).getTime();
    timeSet.add(t);
    const existing = bounds.get(row.player_id);
    if (existing) {
      existing.first = Math.min(existing.first, t);
      existing.last = Math.max(existing.last, t);
    } else {
      bounds.set(row.player_id, { first: t, last: t });
    }
  }

  const times = Array.from(timeSet).sort((a, b) => a - b);
  const playerIds = Array.from(bounds.keys());

  // Running cumulative per player as we sweep timestamps in order.
  const cumulative = new Map<number, number>();
  for (const id of playerIds) cumulative.set(id, 0);

  // Group net amounts by timestamp for efficient sweeping.
  const netByTime = new Map<number, Map<number, number>>();
  for (const row of rows) {
    const t = new Date(row.created_at).getTime();
    let perPlayer = netByTime.get(t);
    if (!perPlayer) {
      perPlayer = new Map<number, number>();
      netByTime.set(t, perPlayer);
    }
    perPlayer.set(row.player_id, (perPlayer.get(row.player_id) ?? 0) + row.net_amount);
  }

  const start = range?.start ?? null;
  const end = range?.end ?? null;

  const points: ChartPoint[] = [];

  for (const t of times) {
    // Apply this timestamp's results to the running totals first.
    const perPlayer = netByTime.get(t);
    if (perPlayer) {
      for (const [id, net] of perPlayer) {
        cumulative.set(id, (cumulative.get(id) ?? 0) + net);
      }
    }

    // Skip timestamps outside the requested range (after updating totals).
    if (start !== null && t < start) continue;
    if (end !== null && t > end) continue;

    const point: ChartPoint = { time: t };
    for (const id of playerIds) {
      const b = bounds.get(id)!;
      point[playerKey(id)] = t >= b.first && t <= b.last ? cumulative.get(id)! : null;
    }
    points.push(point);
  }

  return points;
}

/**
 * Computes the full player series (metadata + chart data + time bounds) for a
 * given set of session results and optional date range.
 */
export function computePlayerSeries(
  rows: PlayerSessionResult[],
  range?: DateRange,
): PlayerSeriesData {
  const players = getPlayerMeta(rows);
  const chartData = buildChartData(rows, range);

  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const row of rows) {
    const t = new Date(row.created_at).getTime();
    if (t < minTime) minTime = t;
    if (t > maxTime) maxTime = t;
  }

  return {
    players,
    chartData,
    minTime: Number.isFinite(minTime) ? minTime : 0,
    maxTime: Number.isFinite(maxTime) ? maxTime : 0,
  };
}
