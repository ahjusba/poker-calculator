import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { 
  createPlayer, 
  getPlayerById, 
  getPlayerByName,
  getAllPlayers,
  deletePlayer,
  linkDeviceToPlayer,
  getPlayerByDeviceId, 
  getDeviceIdsByPlayerId,
  addNicknameToPlayer,
  getNicknamesByPlayerId,
  getPlayerStats,
  getAllPlayerStats 
} from '@/lib/players';
import { seedPlayers, linkDevice, createTestSession, cleanDatabase } from '../helpers/db-setup';

describe('Player Database Operations', () => {
  // Clean database before each test (Neon serverless doesn't support transactions)
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Clean database after all tests complete
  afterAll(async () => {
    await cleanDatabase();
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const player = await createPlayer('TestPlayer');
      
      expect(player).toBeDefined();
      expect(player.player_name).toBe('TestPlayer');
      expect(player.id).toBeGreaterThan(0);
      expect(player.created_at).toBeInstanceOf(Date);
    });

    it('should prevent duplicate player names', async () => {
      await createPlayer('Duplicate');
      
      await expect(
        createPlayer('Duplicate')
      ).rejects.toThrow();
    });

    it('should trim whitespace from player names', async () => {
      const player = await createPlayer('  Spaces  ');
      
      expect(player.player_name).toBe('Spaces');
    });
  });

  describe('getPlayerById', () => {
    it('should get player by ID', async () => {
      const created = await createPlayer('FindMe');
      const found = await getPlayerById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.player_name).toBe('FindMe');
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await getPlayerById(99999);
      
      expect(found).toBeUndefined();
    });
  });

  describe('getPlayerByName', () => {
    it('should get player by name', async () => {
      const created = await createPlayer('UniqueNameTest');
      const found = await getPlayerByName('UniqueNameTest');
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.player_name).toBe('UniqueNameTest');
    });

    it('should return undefined for non-existent name', async () => {
      const found = await getPlayerByName('NonExistentPlayer');
      
      expect(found).toBeUndefined();
    });

    it('should be case-sensitive', async () => {
      await createPlayer('CaseSensitive');
      const found = await getPlayerByName('casesensitive');
      
      expect(found).toBeUndefined();
    });
  });

  describe('getAllPlayers', () => {
    it('should return empty array when no players exist', async () => {
      const players = await getAllPlayers();
      
      expect(players).toEqual([]);
    });

    it('should return all players sorted by name', async () => {
      await createPlayer('Zebra');
      await createPlayer('Alpha');
      await createPlayer('Middle');
      
      const players = await getAllPlayers();
      
      expect(players).toHaveLength(3);
      expect(players[0].player_name).toBe('Alpha');
      expect(players[1].player_name).toBe('Middle');
      expect(players[2].player_name).toBe('Zebra');
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player', async () => {
      const player = await createPlayer('ToDelete');
      
      await deletePlayer(player.id);
      
      const found = await getPlayerById(player.id);
      expect(found).toBeUndefined();
    });

    it('should not throw error when deleting non-existent player', async () => {
      await expect(deletePlayer(99999)).resolves.not.toThrow();
    });

    it('should cascade delete related device_ids', async () => {
      const player = await createPlayer('DeleteWithDevices');
      await linkDeviceToPlayer('device-to-delete', player.id);
      
      await deletePlayer(player.id);
      
      const devices = await getDeviceIdsByPlayerId(player.id);
      expect(devices).toEqual([]);
    });
  });

  describe('linkDeviceToPlayer', () => {
    it('should link a device to a player', async () => {
      const player = await createPlayer('DeviceLinker');
      
      const deviceLink = await linkDeviceToPlayer('new-device-123', player.id);
      
      expect(deviceLink).toBeDefined();
      expect(deviceLink.device_id).toBe('new-device-123');
      expect(deviceLink.player_id).toBe(player.id);
    });

    it('should update existing device link on conflict', async () => {
      const player1 = await createPlayer('Player1');
      const player2 = await createPlayer('Player2');
      
      // First link device to player1
      await linkDeviceToPlayer('shared-device', player1.id);
      
      // Then link same device to player2 (should update, not error)
      const updated = await linkDeviceToPlayer('shared-device', player2.id);
      
      expect(updated.player_id).toBe(player2.id);
      
      // Verify device is now linked to player2
      const foundPlayer = await getPlayerByDeviceId('shared-device');
      expect(foundPlayer?.id).toBe(player2.id);
    });
  });

  describe('getDeviceIdsByPlayerId', () => {
    it('should return empty array for player with no devices', async () => {
      const player = await createPlayer('NoDevices');
      
      const devices = await getDeviceIdsByPlayerId(player.id);
      
      expect(devices).toEqual([]);
    });

    it('should return all device IDs for a player', async () => {
      const player = await createPlayer('MultiDevicePlayer');
      await linkDeviceToPlayer('device-a', player.id);
      await linkDeviceToPlayer('device-b', player.id);
      await linkDeviceToPlayer('device-c', player.id);
      
      const devices = await getDeviceIdsByPlayerId(player.id);
      
      expect(devices).toHaveLength(3);
      expect(devices).toContain('device-a');
      expect(devices).toContain('device-b');
      expect(devices).toContain('device-c');
    });

    it('should return empty array for non-existent player', async () => {
      const devices = await getDeviceIdsByPlayerId(99999);
      
      expect(devices).toEqual([]);
    });
  });

  describe('addNicknameToPlayer', () => {
    it('should add a nickname to a player', async () => {
      const player = await createPlayer('PlayerWithNick');
      
      await addNicknameToPlayer(player.id, 'CoolNickname');
      
      const nicknames = await getNicknamesByPlayerId(player.id);
      expect(nicknames).toContain('CoolNickname');
    });

    it('should handle multiple nicknames for same player', async () => {
      const player = await createPlayer('MultiNickPlayer');
      
      await addNicknameToPlayer(player.id, 'Nick1');
      await addNicknameToPlayer(player.id, 'Nick2');
      await addNicknameToPlayer(player.id, 'Nick3');
      
      const nicknames = await getNicknamesByPlayerId(player.id);
      expect(nicknames).toHaveLength(3);
      expect(nicknames).toContain('Nick1');
      expect(nicknames).toContain('Nick2');
      expect(nicknames).toContain('Nick3');
    });

    it('should not add duplicate nicknames', async () => {
      const player = await createPlayer('DuplicateNickTest');
      
      await addNicknameToPlayer(player.id, 'SameNick');
      await addNicknameToPlayer(player.id, 'SameNick');
      
      const nicknames = await getNicknamesByPlayerId(player.id);
      expect(nicknames).toHaveLength(1);
      expect(nicknames[0]).toBe('SameNick');
    });
  });

  describe('getNicknamesByPlayerId', () => {
    it('should return empty array for player with no nicknames', async () => {
      const player = await createPlayer('NoNicknames');
      
      const nicknames = await getNicknamesByPlayerId(player.id);
      
      expect(nicknames).toEqual([]);
    });

    it('should return nicknames sorted alphabetically', async () => {
      const player = await createPlayer('SortedNicks');
      await addNicknameToPlayer(player.id, 'Zebra');
      await addNicknameToPlayer(player.id, 'Alpha');
      await addNicknameToPlayer(player.id, 'Middle');
      
      const nicknames = await getNicknamesByPlayerId(player.id);
      
      expect(nicknames).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    it('should return empty array for non-existent player', async () => {
      const nicknames = await getNicknamesByPlayerId(99999);
      
      expect(nicknames).toEqual([]);
    });
  });

  describe('getPlayerStats', () => {
    it('should return undefined for non-existent player', async () => {
      const stats = await getPlayerStats(99999);
      
      expect(stats).toBeUndefined();
    });

    it('should return stats for player with no sessions', async () => {
      const player = await createPlayer('NewPlayer');
      
      const stats = await getPlayerStats(player.id);
      
      expect(stats).toBeDefined();
      expect(stats?.id).toBe(player.id);
      expect(stats?.player_name).toBe('NewPlayer');
      expect(stats?.sessions).toBe(0);
      expect(stats?.net_winnings).toBe(0);
      expect(stats?.device_ids).toEqual([]);
      expect(stats?.nicknames).toEqual([]);
    });

    it('should calculate stats for player with sessions', async () => {
      const player = await createPlayer('ActivePlayer');
      await linkDeviceToPlayer('active-device', player.id);
      await addNicknameToPlayer(player.id, 'ActiveNick');
      
      // Create two sessions
      await createTestSession('session-a', [
        { deviceId: 'active-device', playerId: player.id, netAmount: 30, nickname: 'ActiveNick' },
      ]);
      await createTestSession('session-b', [
        { deviceId: 'active-device', playerId: player.id, netAmount: -10, nickname: 'ActiveNick' },
      ]);
      
      const stats = await getPlayerStats(player.id);
      
      expect(stats?.sessions).toBe(2);
      expect(stats?.net_winnings).toBe(20); // 30 - 10
      expect(stats?.device_ids).toContain('active-device');
      expect(stats?.nicknames).toContain('ActiveNick');
    });

    it('should handle player with multiple devices and nicknames', async () => {
      const player = await createPlayer('ComplexPlayer');
      await linkDeviceToPlayer('device-1', player.id);
      await linkDeviceToPlayer('device-2', player.id);
      await addNicknameToPlayer(player.id, 'Nick1');
      await addNicknameToPlayer(player.id, 'Nick2');
      
      await createTestSession('complex-session', [
        { deviceId: 'device-1', playerId: player.id, netAmount: 50, nickname: 'Nick1' },
      ]);
      
      const stats = await getPlayerStats(player.id);
      
      expect(stats?.device_ids).toHaveLength(2);
      expect(stats?.nicknames).toHaveLength(2);
      expect(stats?.net_winnings).toBe(50);
    });
  });

  describe('getPlayerByDeviceId', () => {
    it('should get player by device ID', async () => {
      const player = await createPlayer('DeviceOwner');
      await linkDevice('test-device-123', player.id);
      
      const found = await getPlayerByDeviceId('test-device-123');
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(player.id);
      expect(found?.player_name).toBe('DeviceOwner');
    });

    it('should return undefined for unknown device ID', async () => {
      const found = await getPlayerByDeviceId('unknown-device');
      
      expect(found).toBeUndefined();
    });
  });

  describe('getAllPlayerStats', () => {
    it('should return empty array when no players exist', async () => {
      const stats = await getAllPlayerStats();
      
      expect(stats).toEqual([]);
    });

    it('should return stats for players with no sessions', async () => {
      await seedPlayers(['Player1', 'Player2']);
      
      const stats = await getAllPlayerStats();
      
      expect(stats).toHaveLength(2);
      expect(stats[0].sessions).toBe(0);
      expect(stats[0].net_winnings).toBe(0);
      expect(stats[0].device_ids).toEqual([]);
    });

    it('should calculate correct stats with sessions', async () => {
      const players = await seedPlayers(['Winner', 'Loser']);
      await linkDevice('device-winner', players[0].id);
      await linkDevice('device-loser', players[1].id);
      
      // Create test session
      await createTestSession('test-session-1', [
        { deviceId: 'device-winner', playerId: players[0].id, netAmount: 50 },
        { deviceId: 'device-loser', playerId: players[1].id, netAmount: -50 },
      ]);
      
      const stats = await getAllPlayerStats();
      
      expect(stats).toHaveLength(2);
      
      const winnerStats = stats.find(s => s.player_name === 'Winner');
      expect(winnerStats?.sessions).toBe(1);
      expect(winnerStats?.net_winnings).toBe(50);
      expect(winnerStats?.device_ids).toContain('device-winner');
      
      const loserStats = stats.find(s => s.player_name === 'Loser');
      expect(loserStats?.sessions).toBe(1);
      expect(loserStats?.net_winnings).toBe(-50);
      expect(loserStats?.device_ids).toContain('device-loser');
    });

    it('should aggregate multiple sessions correctly', async () => {
      const players = await seedPlayers(['Player1']);
      await linkDevice('device-p1', players[0].id);
      
      // Session 1: +30
      await createTestSession('session-1', [
        { deviceId: 'device-p1', playerId: players[0].id, netAmount: 30 },
      ]);
      
      // Session 2: -10
      await createTestSession('session-2', [
        { deviceId: 'device-p1', playerId: players[0].id, netAmount: -10 },
      ]);
      
      // Session 3: +20
      await createTestSession('session-3', [
        { deviceId: 'device-p1', playerId: players[0].id, netAmount: 20 },
      ]);
      
      const stats = await getAllPlayerStats();
      
      expect(stats).toHaveLength(1);
      expect(stats[0].sessions).toBe(3);
      expect(stats[0].net_winnings).toBe(40); // 30 - 10 + 20
    });

    it('should handle multiple device IDs per player', async () => {
      const player = await createPlayer('MultiDevice');
      await linkDevice('device-1', player.id);
      await linkDevice('device-2', player.id);
      await linkDevice('device-3', player.id);
      
      const stats = await getAllPlayerStats();
      
      expect(stats).toHaveLength(1);
      expect(stats[0].device_ids).toHaveLength(3);
      expect(stats[0].device_ids).toContain('device-1');
      expect(stats[0].device_ids).toContain('device-2');
      expect(stats[0].device_ids).toContain('device-3');
    });

    it('should not multiply net_winnings by number of device IDs (regression test)', async () => {
      // This is a regression test for the Cartesian product bug
      // Previously, LEFT JOINs caused row multiplication:
      // - 1 session × 2 device_ids = 2 rows, SUM(20) = 40 (wrong!)
      // - 1 session × 3 device_ids = 3 rows, SUM(-20) = -60 (wrong!)
      
      // Create Player 1 with 2 devices
      const player1 = await createPlayer('Player1');
      await linkDevice('p1-device-1', player1.id);
      await linkDevice('p1-device-2', player1.id);
      
      // Create Player 2 with 3 devices
      const player2 = await createPlayer('Player2');
      await linkDevice('p2-device-1', player2.id);
      await linkDevice('p2-device-2', player2.id);
      await linkDevice('p2-device-3', player2.id);
      
      // Create a session: Player1 wins 20, Player2 loses 20
      await createTestSession('regression-session', [
        { deviceId: 'p1-device-1', playerId: player1.id, netAmount: 20 },
        { deviceId: 'p2-device-1', playerId: player2.id, netAmount: -20 },
      ]);
      
      const stats = await getAllPlayerStats();
      
      // Find each player's stats
      const p1Stats = stats.find(s => s.player_name === 'Player1');
      const p2Stats = stats.find(s => s.player_name === 'Player2');
      
      // CRITICAL: net_winnings should be actual values, NOT multiplied by device count
      expect(p1Stats?.net_winnings).toBe(20);   // NOT 40 (20 × 2 devices)
      expect(p2Stats?.net_winnings).toBe(-20);  // NOT -60 (-20 × 3 devices)
      
      // Verify device IDs are still correct
      expect(p1Stats?.device_ids).toHaveLength(2);
      expect(p2Stats?.device_ids).toHaveLength(3);
      
      // Verify session count is correct
      expect(p1Stats?.sessions).toBe(1);
      expect(p2Stats?.sessions).toBe(1);
    });
  });
});
