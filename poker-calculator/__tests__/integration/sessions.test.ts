import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createSession, sessionExists, createSessionParticipant } from '@/lib/sessions';
import { sql } from '@/lib/db';
import { seedPlayers, linkDevice, cleanDatabase } from '../helpers/db-setup';

describe('Session Database Operations', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Clean database after all tests complete
  afterAll(async () => {
    await cleanDatabase();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const ledgerData = { test: 'data', players: [] };
      
      await createSession(
        'session-123',
        'https://pokernow.com/games/session-123',
        ledgerData
      );
      
      const result = await sql`SELECT * FROM sessions WHERE id = 'session-123'`;
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-123');
      expect(result[0].url).toBe('https://pokernow.com/games/session-123');
      expect(result[0].ledger_data).toEqual(ledgerData);
    });

    it('should prevent duplicate session IDs', async () => {
      await createSession('duplicate', 'https://test.com', {});
      
      await expect(
        createSession('duplicate', 'https://test.com', {})
      ).rejects.toThrow();
    });
  });

  describe('sessionExists', () => {
    it('should return true for existing session', async () => {
      await createSession('exists', 'https://test.com', {});
      
      const exists = await sessionExists('exists');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const exists = await sessionExists('does-not-exist');
      
      expect(exists).toBe(false);
    });
  });

  describe('createSessionParticipant', () => {
    it('should create a session participant', async () => {
      const players = await seedPlayers(['TestPlayer']);
      await linkDevice('device-test', players[0].id);
      await createSession('session-test', 'https://test.com', {});
      
      await createSessionParticipant(
        'session-test',
        'device-test',
        players[0].id,
        'Nickname',
        50.00,
        100,
        150,
        0
      );
      
      const result = await sql`
        SELECT * FROM session_participants 
        WHERE session_id = 'session-test'
      `;
      
      expect(result).toHaveLength(1);
      expect(result[0].device_id).toBe('device-test');
      expect(result[0].player_id).toBe(players[0].id);
      expect(result[0].nickname).toBe('Nickname');
      expect(result[0].net_amount).toBe('50.00');
      expect(result[0].buy_in).toBe(100);
      expect(result[0].buy_out).toBe(150);
    });

    it('should handle multiple participants in same session', async () => {
      const players = await seedPlayers(['Player1', 'Player2', 'Player3']);
      await linkDevice('device-1', players[0].id);
      await linkDevice('device-2', players[1].id);
      await linkDevice('device-3', players[2].id);
      await createSession('multi-session', 'https://test.com', {});
      
      await createSessionParticipant('multi-session', 'device-1', players[0].id, 'P1', 30, 100, 130, 0);
      await createSessionParticipant('multi-session', 'device-2', players[1].id, 'P2', -10, 100, 90, 0);
      await createSessionParticipant('multi-session', 'device-3', players[2].id, 'P3', -20, 100, 80, 0);
      
      const result = await sql`
        SELECT * FROM session_participants 
        WHERE session_id = 'multi-session'
        ORDER BY net_amount DESC
      `;
      
      expect(result).toHaveLength(3);
      expect(result[0].net_amount).toBe('30.00');
      expect(result[1].net_amount).toBe('-10.00');
      expect(result[2].net_amount).toBe('-20.00');
      
      // Verify net amounts sum to zero
      const sum = result.reduce((acc, r) => acc + parseFloat(r.net_amount), 0);
      expect(sum).toBe(0);
    });
  });
});
