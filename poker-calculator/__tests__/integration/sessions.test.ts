import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { 
  createSession, 
  sessionExists, 
  createSessionParticipant,
  getSessionById,
  getAllSessions,
  deleteSession,
  getSessionParticipants,
  getPlayerSessions,
  updateSession
} from '@/lib/sessions';
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

  describe('updateSession', () => {
    it('should update session URL and ledger data', async () => {
      const initialData = { test: 'initial', count: 1 };
      await createSession('update-test', 'https://test.com/old', initialData);

      const updatedData = { test: 'updated', count: 2, newField: true };
      const result = await updateSession('update-test', 'https://test.com/new', updatedData);

      expect(result).toBeDefined();
      expect(result?.id).toBe('update-test');
      expect(result?.url).toBe('https://test.com/new');
      expect(result?.ledger_data).toEqual(updatedData);
    });

    it('should update updated_at timestamp', async () => {
      await createSession('timestamp-update', 'https://test.com', {});
      
      const beforeUpdate = await getSessionById('timestamp-update');
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateSession('timestamp-update', 'https://test.com', { updated: true });
      
      const afterUpdate = await getSessionById('timestamp-update');

      expect(afterUpdate).toBeDefined();
      expect(afterUpdate?.updated_at.getTime()).toBeGreaterThan(beforeUpdate!.updated_at.getTime());
    });

    it('should return undefined for non-existent session', async () => {
      const result = await updateSession('does-not-exist', 'https://test.com', {});

      expect(result).toBeUndefined();
    });

    it('should preserve session ID while updating other fields', async () => {
      await createSession('preserve-id', 'https://old.com', { old: true });

      await updateSession('preserve-id', 'https://new.com', { new: true });

      const session = await getSessionById('preserve-id');
      expect(session).toBeDefined();
      expect(session?.id).toBe('preserve-id');
      expect(session?.url).toBe('https://new.com');
      expect(session?.ledger_data).toEqual({ new: true });
    });

    it('should handle empty ledger data', async () => {
      await createSession('empty-data', 'https://test.com', { full: 'data' });

      const result = await updateSession('empty-data', 'https://test.com', {});

      expect(result).toBeDefined();
      expect(result?.ledger_data).toEqual({});
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
      expect(result[0].buy_in).toBe('100.00');
      expect(result[0].buy_out).toBe('150.00');
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

  describe('getSessionById', () => {
    it('should return session by ID', async () => {
      const ledgerData = { test: 'data' };
      await createSession('test-id', 'https://test.com', ledgerData);

      const session = await getSessionById('test-id');

      expect(session).toBeDefined();
      expect(session?.id).toBe('test-id');
      expect(session?.url).toBe('https://test.com');
      expect(session?.ledger_data).toEqual(ledgerData);
      expect(session?.created_at).toBeInstanceOf(Date);
    });

    it('should return undefined for non-existent session', async () => {
      const session = await getSessionById('does-not-exist');

      expect(session).toBeUndefined();
    });

    it('should return session with created_at timestamp', async () => {
      await createSession('timestamp-test', 'https://test.com', {});

      const session = await getSessionById('timestamp-test');

      expect(session).toBeDefined();
      expect(session?.created_at).toBeInstanceOf(Date);
      // Verify timestamp exists and is valid
      expect(session?.created_at.getTime()).toBeGreaterThan(0);
    });
  });

  describe('getAllSessions', () => {
    it('should return empty array when no sessions', async () => {
      const sessions = await getAllSessions();

      expect(sessions).toEqual([]);
    });

    it('should return all sessions ordered by creation time (newest first)', async () => {
      await createSession('session-1', 'https://test.com/1', { data: 1 });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await createSession('session-2', 'https://test.com/2', { data: 2 });
      await new Promise(resolve => setTimeout(resolve, 10));
      await createSession('session-3', 'https://test.com/3', { data: 3 });

      const sessions = await getAllSessions();

      expect(sessions).toHaveLength(3);
      // Should be ordered newest first
      expect(sessions[0].id).toBe('session-3');
      expect(sessions[1].id).toBe('session-2');
      expect(sessions[2].id).toBe('session-1');
      expect(sessions[0].created_at).toBeInstanceOf(Date);
    });

    it('should include all session properties', async () => {
      const ledgerData = { players: ['Alice', 'Bob'] };
      await createSession('full-test', 'https://test.com', ledgerData);

      const sessions = await getAllSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toHaveProperty('id');
      expect(sessions[0]).toHaveProperty('url');
      expect(sessions[0]).toHaveProperty('ledger_data');
      expect(sessions[0]).toHaveProperty('created_at');
      expect(sessions[0].ledger_data).toEqual(ledgerData);
    });
  });

  describe('deleteSession', () => {
    it('should delete session and cascade to participants', async () => {
      const players = await seedPlayers(['Player1']);
      await linkDevice('device-1', players[0].id);
      await createSession('delete-test', 'https://test.com', {});
      await createSessionParticipant('delete-test', 'device-1', players[0].id, 'P1', 50, 100, 150, 0);

      await deleteSession('delete-test');

      const session = await getSessionById('delete-test');
      const participants = await sql`
        SELECT * FROM session_participants WHERE session_id = 'delete-test'
      `;

      expect(session).toBeUndefined();
      expect(participants).toHaveLength(0);
    });

    it('should not throw when deleting non-existent session', async () => {
      await expect(
        deleteSession('does-not-exist')
      ).resolves.not.toThrow();
    });

    it('should only delete specified session', async () => {
      await createSession('keep-1', 'https://test.com/1', {});
      await createSession('delete-me', 'https://test.com/2', {});
      await createSession('keep-2', 'https://test.com/3', {});

      await deleteSession('delete-me');

      const sessions = await getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.find(s => s.id === 'keep-1')).toBeDefined();
      expect(sessions.find(s => s.id === 'keep-2')).toBeDefined();
      expect(sessions.find(s => s.id === 'delete-me')).toBeUndefined();
    });
  });

  describe('getSessionParticipants', () => {
    it('should return empty array for session with no participants', async () => {
      await createSession('empty-session', 'https://test.com', {});

      const participants = await getSessionParticipants('empty-session');

      expect(participants).toEqual([]);
    });

    it('should return all participants for a session', async () => {
      const players = await seedPlayers(['Player1', 'Player2']);
      await linkDevice('device-1', players[0].id);
      await linkDevice('device-2', players[1].id);
      await createSession('multi-participant', 'https://test.com', {});
      await createSessionParticipant('multi-participant', 'device-1', players[0].id, 'P1', 100, 100, 200, 0);
      await createSessionParticipant('multi-participant', 'device-2', players[1].id, 'P2', -100, 100, 0, 0);

      const participants = await getSessionParticipants('multi-participant');

      expect(participants).toHaveLength(2);
      expect(participants[0].nickname).toBe('P1');
      expect(participants[1].nickname).toBe('P2');
    });

    it('should include all participant fields with correct types', async () => {
      const players = await seedPlayers(['Player1']);
      await linkDevice('device-1', players[0].id);
      await createSession('field-test', 'https://test.com', {});
      await createSessionParticipant('field-test', 'device-1', players[0].id, 'Test', 75.50, 100, 175.50, 0);

      const participants = await getSessionParticipants('field-test');

      expect(participants).toHaveLength(1);
      const p = participants[0];
      expect(p.session_id).toBe('field-test');
      expect(p.device_id).toBe('device-1');
      expect(p.player_id).toBe(players[0].id);
      expect(p.nickname).toBe('Test');
      expect(parseFloat(p.net_amount as unknown as string)).toBeCloseTo(75.50, 2);
      expect(parseFloat(p.buy_in as unknown as string)).toBeCloseTo(100, 2);
      expect(parseFloat(p.buy_out as unknown as string)).toBeCloseTo(175.50, 2);
      expect(parseFloat(p.in_game as unknown as string)).toBe(0);
    });

    it('should return empty array for non-existent session', async () => {
      const participants = await getSessionParticipants('does-not-exist');

      expect(participants).toEqual([]);
    });
  });

  describe('getPlayerSessions', () => {
    it('should return empty array for player with no sessions', async () => {
      const players = await seedPlayers(['NoSessions']);

      const sessions = await getPlayerSessions(players[0].id);

      expect(sessions).toEqual([]);
    });

    it('should return all sessions for a player', async () => {
      const players = await seedPlayers(['MultiSession']);
      await linkDevice('device-1', players[0].id);
      await createSession('session-1', 'https://test.com/1', {});
      await createSession('session-2', 'https://test.com/2', {});
      await createSession('session-3', 'https://test.com/3', {});
      
      await createSessionParticipant('session-1', 'device-1', players[0].id, 'P1', 50, 100, 150, 0);
      await createSessionParticipant('session-2', 'device-1', players[0].id, 'P1', -20, 100, 80, 0);
      await createSessionParticipant('session-3', 'device-1', players[0].id, 'P1', 100, 100, 200, 1);

      const sessions = await getPlayerSessions(players[0].id);

      expect(sessions).toHaveLength(3);
      expect(sessions.map(s => s.session_id)).toContain('session-1');
      expect(sessions.map(s => s.session_id)).toContain('session-2');
      expect(sessions.map(s => s.session_id)).toContain('session-3');
    });

    it('should only return sessions for specified player', async () => {
      const players = await seedPlayers(['Player1', 'Player2']);
      await linkDevice('device-1', players[0].id);
      await linkDevice('device-2', players[1].id);
      await createSession('shared', 'https://test.com', {});
      
      await createSessionParticipant('shared', 'device-1', players[0].id, 'P1', 50, 100, 150, 0);
      await createSessionParticipant('shared', 'device-2', players[1].id, 'P2', -50, 100, 50, 0);

      const player1Sessions = await getPlayerSessions(players[0].id);
      const player2Sessions = await getPlayerSessions(players[1].id);

      expect(player1Sessions).toHaveLength(1);
      expect(player2Sessions).toHaveLength(1);
      expect(player1Sessions[0].player_id).toBe(players[0].id);
      expect(player2Sessions[0].player_id).toBe(players[1].id);
    });

    it('should include all participant data with correct types', async () => {
      const players = await seedPlayers(['DataTest']);
      await linkDevice('device-1', players[0].id);
      await createSession('data-test', 'https://test.com', {});
      await createSessionParticipant('data-test', 'device-1', players[0].id, 'TestNick', 123.45, 100, 223.45, 2);

      const sessions = await getPlayerSessions(players[0].id);

      expect(sessions).toHaveLength(1);
      const s = sessions[0];
      expect(s.session_id).toBe('data-test');
      expect(s.device_id).toBe('device-1');
      expect(s.player_id).toBe(players[0].id);
      expect(s.nickname).toBe('TestNick');
      expect(parseFloat(s.net_amount as unknown as string)).toBeCloseTo(123.45, 2);
      expect(parseFloat(s.buy_in as unknown as string)).toBeCloseTo(100, 2);
      expect(parseFloat(s.buy_out as unknown as string)).toBeCloseTo(223.45, 2);
      expect(parseFloat(s.in_game as unknown as string)).toBe(2);
    });

    it('should return empty array for non-existent player', async () => {
      const sessions = await getPlayerSessions(99999);

      expect(sessions).toEqual([]);
    });
  });
});
