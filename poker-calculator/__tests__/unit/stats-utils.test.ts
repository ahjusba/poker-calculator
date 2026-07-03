import { describe, it, expect } from 'vitest';
import {
  getPlayerMeta,
  getTopPlayerIds,
  buildChartData,
  computePlayerSeries,
  playerKey,
} from '@/lib/stats-utils';
import type { PlayerSessionResult } from '@/lib/stats';

/**
 * Unit tests for stats utility functions (pure functions that don't require a database).
 */

function row(
  playerId: number,
  name: string,
  isoDate: string,
  net: number,
): PlayerSessionResult {
  return {
    player_id: playerId,
    player_name: name,
    session_id: `s-${isoDate}-${playerId}`,
    created_at: new Date(isoDate).toISOString(),
    net_amount: net,
  };
}

describe('Stats Utils - Unit Tests', () => {
  describe('getPlayerMeta', () => {
    it('sums net winnings per player and sorts by total descending', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 50),
        row(2, 'Bob', '2026-01-01', -50),
        row(1, 'Alice', '2026-02-01', 30),
        row(2, 'Bob', '2026-02-01', 10),
      ];

      const meta = getPlayerMeta(rows);

      expect(meta.map(m => m.name)).toEqual(['Alice', 'Bob']);
      expect(meta[0].total).toBe(80);
      expect(meta[1].total).toBe(-40);
    });

    it('assigns a stable color to each player', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 10),
        row(2, 'Bob', '2026-01-01', -10),
      ];

      const meta = getPlayerMeta(rows);
      expect(meta[0].color).toBeDefined();
      expect(meta[1].color).toBeDefined();
      expect(meta[0].color).not.toBe(meta[1].color);
    });
  });

  describe('getTopPlayerIds', () => {
    it('returns the top N player ids by total', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 100),
        row(2, 'Bob', '2026-01-01', 50),
        row(3, 'Cara', '2026-01-01', -150),
      ];

      const meta = getPlayerMeta(rows);
      expect(getTopPlayerIds(meta, 2)).toEqual([1, 2]);
    });
  });

  describe('buildChartData', () => {
    it('produces cumulative running totals per player', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 50),
        row(1, 'Alice', '2026-02-01', 30),
      ];

      const data = buildChartData(rows);
      const key = playerKey(1);

      expect(data).toHaveLength(2);
      expect(data[0][key]).toBe(50);
      expect(data[1][key]).toBe(80);
    });

    it('is null before a player first plays and after they last play (cutoff)', () => {
      const rows: PlayerSessionResult[] = [
        // Alice plays at t0 and t2; Bob plays only at t1.
        row(1, 'Alice', '2026-01-01', 20),
        row(2, 'Bob', '2026-01-15', -10),
        row(1, 'Alice', '2026-02-01', 5),
      ];

      const data = buildChartData(rows);
      const alice = playerKey(1);
      const bob = playerKey(2);

      // t0: Alice active (20), Bob not yet played -> null
      expect(data[0][alice]).toBe(20);
      expect(data[0][bob]).toBeNull();

      // t1: Alice carries forward flat (20), Bob active (-10)
      expect(data[1][alice]).toBe(20);
      expect(data[1][bob]).toBe(-10);

      // t2: Alice active (25), Bob already finished -> null (cutoff, no flat line)
      expect(data[2][alice]).toBe(25);
      expect(data[2][bob]).toBeNull();
    });

    it('supports negative cumulative values', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', -30),
        row(1, 'Alice', '2026-02-01', -20),
      ];

      const data = buildChartData(rows);
      const key = playerKey(1);
      expect(data[0][key]).toBe(-30);
      expect(data[1][key]).toBe(-50);
    });

    it('clips displayed points to a date range while keeping all-time cumulative', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 40),
        row(1, 'Alice', '2026-02-01', 10),
        row(1, 'Alice', '2026-03-01', 25),
      ];

      const start = new Date('2026-02-01T00:00:00').getTime();
      const end = new Date('2026-03-31T23:59:59').getTime();
      const data = buildChartData(rows, { start, end });
      const key = playerKey(1);

      // Only Feb and Mar points shown, but cumulative includes January (40).
      expect(data).toHaveLength(2);
      expect(data[0][key]).toBe(50); // 40 + 10
      expect(data[1][key]).toBe(75); // 40 + 10 + 25
    });

    it('returns an empty array when there are no rows', () => {
      expect(buildChartData([])).toEqual([]);
    });
  });

  describe('computePlayerSeries', () => {
    it('returns players, chart data and time bounds', () => {
      const rows: PlayerSessionResult[] = [
        row(1, 'Alice', '2026-01-01', 40),
        row(2, 'Bob', '2026-03-01', -40),
      ];

      const series = computePlayerSeries(rows);

      expect(series.players).toHaveLength(2);
      expect(series.chartData.length).toBeGreaterThan(0);
      expect(series.minTime).toBe(new Date('2026-01-01').getTime());
      expect(series.maxTime).toBe(new Date('2026-03-01').getTime());
    });
  });
});
