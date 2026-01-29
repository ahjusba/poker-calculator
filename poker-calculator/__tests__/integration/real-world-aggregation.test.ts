import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPlayer, getAllPlayerStats, getPlayerStats, linkDeviceToPlayer } from '@/lib/players';
import { createSession, createSessionParticipant } from '@/lib/sessions';
import { cleanDatabase } from '../helpers/db-setup';
import { sessions_data } from '../fixtures/ledgers/real-data';

/**
 * Real-world aggregation tests based on actual poker session data.
 * 
 * This test suite validates the complete flow:
 * 1. Player creation and device linking
 * 2. Session creation with participants
 * 3. Aggregated statistics across multiple sessions
 * 
 * Data represents 3 real poker sessions with multiple players using different devices.
 */
describe('Real-World Multi-Session Aggregation', () => {
  // Store player IDs for reference
  const playerIds: Record<string, number> = {};

  beforeAll(async () => {
    await cleanDatabase();

    // Create all players and link their devices based on real data
    // Session 1 players
    const lauriP = await createPlayer('Lauri P.');
    playerIds['Lauri P.'] = lauriP.id;

    const akseli = await createPlayer('Akseli');
    playerIds['Akseli'] = akseli.id;

    const jussi = await createPlayer('Jussi');
    playerIds['Jussi'] = jussi.id;

    const lasse = await createPlayer('Lasse');
    playerIds['Lasse'] = lasse.id;

    const aleksiK = await createPlayer('Aleksi K.');
    playerIds['Aleksi K.'] = aleksiK.id;

    // Session 3 additional players
    const jaakko = await createPlayer('Jaakko');
    playerIds['Jaakko'] = jaakko.id;

    const mikko = await createPlayer('Mikko');
    playerIds['Mikko'] = mikko.id;

    // Link devices to players before creating sessions
    // Session 1 devices
    await linkDeviceToPlayer('RHb-0Unr50', lauriP.id);
    await linkDeviceToPlayer('HuFTNJLI6e', akseli.id);
    await linkDeviceToPlayer('nDCo0CjA_m', jussi.id);
    await linkDeviceToPlayer('2u4-SIis3W', lasse.id);
    await linkDeviceToPlayer('pvjSRj-p3k', aleksiK.id);
    
    // Session 2 new devices
    await linkDeviceToPlayer('KDBqjTtDCt', akseli.id);
    
    // Session 3 new devices
    await linkDeviceToPlayer('FQl3QSL8H6', jaakko.id);
    await linkDeviceToPlayer('7C7WggNp1M', lauriP.id);
    await linkDeviceToPlayer('yuW6MT27xi', lasse.id);
    await linkDeviceToPlayer('kzQ_mFJHzj', mikko.id);

    // Create Session 1
    await createSession('session-1', 'https://pokernow.com/games/session-1', sessions_data[0]);
    
    await createSessionParticipant('session-1', 'RHb-0Unr50', lauriP.id, 'Lauri P.', -1247, 15000, 13753, 0);
    await createSessionParticipant('session-1', 'HuFTNJLI6e', akseli.id, 'Haamu', -2000, 2000, 0, 0);
    await createSessionParticipant('session-1', 'nDCo0CjA_m', jussi.id, 'Perkins', 1006, 5000, 6006, 0);
    await createSessionParticipant('session-1', '2u4-SIis3W', lasse.id, 'Lasse', 97, 6222, 6319, 0);
    await createSessionParticipant('session-1', 'pvjSRj-p3k', aleksiK.id, 'LIMP=KUOLEMA', 2144, 2000, 4144, 0);

    // Create Session 2
    await createSession('session-2', 'https://pokernow.com/games/session-2', sessions_data[1]);
    
    await createSessionParticipant('session-2', 'RHb-0Unr50', lauriP.id, 'Lauri P.', -4000, 4000, 0, 0);
    await createSessionParticipant('session-2', 'KDBqjTtDCt', akseli.id, 'Haamu', 4000, 2000, 2000, 4000);

    // Create Session 3
    await createSession('session-3', 'https://pokernow.com/games/session-3', sessions_data[2]);
    
    await createSessionParticipant('session-3', 'FQl3QSL8H6', jaakko.id, 'jaakko', 576, 4000, 4576, 0);
    await createSessionParticipant('session-3', '7C7WggNp1M', lauriP.id, 'Lauri P.', 3017, 15000, 18017, 0);
    await createSessionParticipant('session-3', 'yuW6MT27xi', lasse.id, 'Lasse', 2639, 3000, 5639, 0);
    await createSessionParticipant('session-3', 'nDCo0CjA_m', jussi.id, 'Perkins', -3000, 3000, 0, 0);
    await createSessionParticipant('session-3', 'kzQ_mFJHzj', mikko.id, 'Mikko', -3232, 6000, 2768, 0);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('Individual Player Aggregation', () => {
    it('should correctly aggregate Lauri P. across 3 sessions with 2 different devices', async () => {
      const stats = await getPlayerStats(playerIds['Lauri P.']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Lauri P.');
      // -1247 + -4000 + 3017 = -2230
      expect(stats?.net_winnings).toBeCloseTo(-2230, 2);
      expect(stats?.sessions).toBe(3);
      expect(stats?.device_ids).toHaveLength(2);
      expect(stats?.device_ids).toContain('RHb-0Unr50');
      expect(stats?.device_ids).toContain('7C7WggNp1M');
    });

    it('should correctly aggregate Akseli across 2 sessions with 2 different devices', async () => {
      const stats = await getPlayerStats(playerIds['Akseli']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Akseli');
      // -2000 + 4000 = 2000
      expect(stats?.net_winnings).toBeCloseTo(2000, 2);
      expect(stats?.sessions).toBe(2);
      expect(stats?.device_ids).toHaveLength(2);
      expect(stats?.device_ids).toContain('HuFTNJLI6e');
      expect(stats?.device_ids).toContain('KDBqjTtDCt');
    });

    it('should correctly aggregate Jussi across 2 sessions with same device', async () => {
      const stats = await getPlayerStats(playerIds['Jussi']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Jussi');
      // 1006 + -3000 = -1994
      expect(stats?.net_winnings).toBeCloseTo(-1994, 2);
      expect(stats?.sessions).toBe(2);
      expect(stats?.device_ids).toHaveLength(1);
      expect(stats?.device_ids).toContain('nDCo0CjA_m');
    });

    it('should correctly aggregate Lasse across 2 sessions with 2 different devices', async () => {
      const stats = await getPlayerStats(playerIds['Lasse']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Lasse');
      // 97 + 2639 = 2736
      expect(stats?.net_winnings).toBeCloseTo(2736, 2);
      expect(stats?.sessions).toBe(2);
      expect(stats?.device_ids).toHaveLength(2);
      expect(stats?.device_ids).toContain('2u4-SIis3W');
      expect(stats?.device_ids).toContain('yuW6MT27xi');
    });

    it('should correctly show Aleksi K. with only 1 session', async () => {
      const stats = await getPlayerStats(playerIds['Aleksi K.']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Aleksi K.');
      expect(stats?.net_winnings).toBeCloseTo(2144, 2);
      expect(stats?.sessions).toBe(1);
      expect(stats?.device_ids).toHaveLength(1);
      expect(stats?.device_ids).toContain('pvjSRj-p3k');
    });

    it('should correctly show Jaakko with only 1 session', async () => {
      const stats = await getPlayerStats(playerIds['Jaakko']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Jaakko');
      expect(stats?.net_winnings).toBeCloseTo(576, 2);
      expect(stats?.sessions).toBe(1);
      expect(stats?.device_ids).toHaveLength(1);
      expect(stats?.device_ids).toContain('FQl3QSL8H6');
    });

    it('should correctly show Mikko with only 1 session', async () => {
      const stats = await getPlayerStats(playerIds['Mikko']);

      expect(stats).toBeDefined();
      expect(stats?.player_name).toBe('Mikko');
      expect(stats?.net_winnings).toBeCloseTo(-3232, 2);
      expect(stats?.sessions).toBe(1);
      expect(stats?.device_ids).toHaveLength(1);
      expect(stats?.device_ids).toContain('kzQ_mFJHzj');
    });
  });

  describe('Complete Aggregation Validation', () => {
    it('should return all 7 players with correct aggregated statistics', async () => {
      const allStats = await getAllPlayerStats();

      expect(allStats).toHaveLength(7);

      // Create a map for easy lookup
      const statsMap = new Map(allStats.map(s => [s.player_name, s]));

      // Validate Lauri P.
      const lauriP = statsMap.get('Lauri P.');
      expect(lauriP?.net_winnings).toBeCloseTo(-2230, 2);
      expect(lauriP?.sessions).toBe(3);

      // Validate Akseli
      const akseli = statsMap.get('Akseli');
      expect(akseli?.net_winnings).toBeCloseTo(2000, 2);
      expect(akseli?.sessions).toBe(2);

      // Validate Jussi
      const jussi = statsMap.get('Jussi');
      expect(jussi?.net_winnings).toBeCloseTo(-1994, 2);
      expect(jussi?.sessions).toBe(2);

      // Validate Lasse
      const lasse = statsMap.get('Lasse');
      expect(lasse?.net_winnings).toBeCloseTo(2736, 2);
      expect(lasse?.sessions).toBe(2);

      // Validate Aleksi K.
      const aleksiK = statsMap.get('Aleksi K.');
      expect(aleksiK?.net_winnings).toBeCloseTo(2144, 2);
      expect(aleksiK?.sessions).toBe(1);

      // Validate Jaakko
      const jaakko = statsMap.get('Jaakko');
      expect(jaakko?.net_winnings).toBeCloseTo(576, 2);
      expect(jaakko?.sessions).toBe(1);

      // Validate Mikko
      const mikko = statsMap.get('Mikko');
      expect(mikko?.net_winnings).toBeCloseTo(-3232, 2);
      expect(mikko?.sessions).toBe(1);
    });

    it('should have net winnings sum to zero across all players', async () => {
      const allStats = await getAllPlayerStats();

      const totalWinnings = allStats.reduce((sum, player) => sum + player.net_winnings, 0);

      // Should be zero (or very close due to floating point)
      expect(totalWinnings).toBeCloseTo(0, 2);
    });

    it('should correctly rank players by net winnings', async () => {
      const allStats = await getAllPlayerStats();

      // Should be sorted by net_winnings DESC
      // Expected order: Lasse (2736), Aleksi K. (2144), Akseli (2000), Jaakko (576), Jussi (-1994), Lauri P. (-2230), Mikko (-3232)
      expect(allStats[0].player_name).toBe('Lasse');
      expect(allStats[0].net_winnings).toBeCloseTo(2736, 2);

      expect(allStats[1].player_name).toBe('Aleksi K.');
      expect(allStats[1].net_winnings).toBeCloseTo(2144, 2);

      expect(allStats[2].player_name).toBe('Akseli');
      expect(allStats[2].net_winnings).toBeCloseTo(2000, 2);

      expect(allStats[3].player_name).toBe('Jaakko');
      expect(allStats[3].net_winnings).toBeCloseTo(576, 2);

      expect(allStats[4].player_name).toBe('Jussi');
      expect(allStats[4].net_winnings).toBeCloseTo(-1994, 2);

      expect(allStats[5].player_name).toBe('Lauri P.');
      expect(allStats[5].net_winnings).toBeCloseTo(-2230, 2);

      expect(allStats[6].player_name).toBe('Mikko');
      expect(allStats[6].net_winnings).toBeCloseTo(-3232, 2);
    });
  });

  describe('Device and Session Tracking', () => {
    it('should track multiple devices for players who changed devices', async () => {
      const allStats = await getAllPlayerStats();
      const statsMap = new Map(allStats.map(s => [s.player_name, s]));

      // Players with multiple devices
      const lauriP = statsMap.get('Lauri P.');
      expect(lauriP?.device_ids).toHaveLength(2);

      const akseli = statsMap.get('Akseli');
      expect(akseli?.device_ids).toHaveLength(2);

      const lasse = statsMap.get('Lasse');
      expect(lasse?.device_ids).toHaveLength(2);

      // Players with single device
      const jussi = statsMap.get('Jussi');
      expect(jussi?.device_ids).toHaveLength(1);

      const aleksiK = statsMap.get('Aleksi K.');
      expect(aleksiK?.device_ids).toHaveLength(1);

      const jaakko = statsMap.get('Jaakko');
      expect(jaakko?.device_ids).toHaveLength(1);

      const mikko = statsMap.get('Mikko');
      expect(mikko?.device_ids).toHaveLength(1);
    });

    it('should correctly count sessions played per player', async () => {
      const allStats = await getAllPlayerStats();
      const statsMap = new Map(allStats.map(s => [s.player_name, s]));

      // 3 sessions
      expect(statsMap.get('Lauri P.')?.sessions).toBe(3);

      // 2 sessions
      expect(statsMap.get('Akseli')?.sessions).toBe(2);
      expect(statsMap.get('Jussi')?.sessions).toBe(2);
      expect(statsMap.get('Lasse')?.sessions).toBe(2);

      // 1 session
      expect(statsMap.get('Aleksi K.')?.sessions).toBe(1);
      expect(statsMap.get('Jaakko')?.sessions).toBe(1);
      expect(statsMap.get('Mikko')?.sessions).toBe(1);
    });

    it('should handle players using same device across multiple sessions', async () => {
      // Jussi used device 'nDCo0CjA_m' in both session 1 and 3
      const stats = await getPlayerStats(playerIds['Jussi']);

      expect(stats?.device_ids).toHaveLength(1);
      expect(stats?.device_ids[0]).toBe('nDCo0CjA_m');
      expect(stats?.sessions).toBe(2);
    });

    it('should handle Lauri P. using same device in sessions 1 and 2, different in session 3', async () => {
      // Lauri P. used 'RHb-0Unr50' in sessions 1 & 2, and '7C7WggNp1M' in session 3
      const stats = await getPlayerStats(playerIds['Lauri P.']);

      expect(stats?.device_ids).toHaveLength(2);
      expect(stats?.device_ids).toContain('RHb-0Unr50');
      expect(stats?.device_ids).toContain('7C7WggNp1M');
      expect(stats?.sessions).toBe(3);
    });
  });

  describe('Winners and Losers', () => {
    it('should identify all winners (positive net winnings)', async () => {
      const allStats = await getAllPlayerStats();
      const winners = allStats.filter(p => p.net_winnings > 0);

      expect(winners).toHaveLength(4);
      expect(winners.map(w => w.player_name)).toContain('Lasse');
      expect(winners.map(w => w.player_name)).toContain('Aleksi K.');
      expect(winners.map(w => w.player_name)).toContain('Akseli');
      expect(winners.map(w => w.player_name)).toContain('Jaakko');
    });

    it('should identify all losers (negative net winnings)', async () => {
      const allStats = await getAllPlayerStats();
      const losers = allStats.filter(p => p.net_winnings < 0);

      expect(losers).toHaveLength(3);
      expect(losers.map(l => l.player_name)).toContain('Jussi');
      expect(losers.map(l => l.player_name)).toContain('Lauri P.');
      expect(losers.map(l => l.player_name)).toContain('Mikko');
    });

    it('should identify the biggest winner (Lasse)', async () => {
      const allStats = await getAllPlayerStats();
      const biggestWinner = allStats[0]; // Already sorted DESC

      expect(biggestWinner.player_name).toBe('Lasse');
      expect(biggestWinner.net_winnings).toBeCloseTo(2736, 2);
    });

    it('should identify the biggest loser (Mikko)', async () => {
      const allStats = await getAllPlayerStats();
      const biggestLoser = allStats[allStats.length - 1]; // Last in DESC order

      expect(biggestLoser.player_name).toBe('Mikko');
      expect(biggestLoser.net_winnings).toBeCloseTo(-3232, 2);
    });
  });
});
