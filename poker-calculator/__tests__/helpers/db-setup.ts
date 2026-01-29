import { sql } from '@/lib/db';
import { setupDatabase } from '@/lib/setup-db';

/**
 * Completely resets the database - drops and recreates all tables
 * Use sparingly (only for schema tests) as it's slower
 */
export async function resetDatabase() {
  await setupDatabase();
}

/**
 * Clears all data from tables but keeps schema intact
 * Faster than resetDatabase - use for most integration tests
 */
export async function cleanDatabase() {
  await sql`TRUNCATE session_participants, sessions, nicknames, device_ids, players CASCADE`;
}

/**
 * Seeds the database with test players
 * Returns array of created player objects
 */
export async function seedPlayers(playerNames: string[] = ['Jussi', 'Dani', 'Aleksi', 'Sampsa']) {
  const created = [];
  
  for (const name of playerNames) {
    const result = await sql`
      INSERT INTO players (player_name)
      VALUES (${name})
      ON CONFLICT (player_name) DO UPDATE SET player_name = EXCLUDED.player_name
      RETURNING *
    `;
    created.push(result[0]);
  }
  
  return created;
}

/**
 * Links a device ID to a player
 */
export async function linkDevice(deviceId: string, playerId: number) {
  const result = await sql`
    INSERT INTO device_ids (device_id, player_id)
    VALUES (${deviceId}, ${playerId})
    ON CONFLICT (device_id) DO UPDATE SET player_id = ${playerId}
    RETURNING *
  `;
  return result[0];
}

/**
 * Creates a test session with participants
 */
export async function createTestSession(
  sessionId: string,
  participants: Array<{ deviceId: string; playerId: number; netAmount: number; nickname?: string }>
) {
  // Create session
  await sql`
    INSERT INTO sessions (id, url, ledger_data)
    VALUES (${sessionId}, ${`https://test.com/${sessionId}`}, '{}')
  `;
  
  // Create participants
  for (const p of participants) {
    await sql`
      INSERT INTO session_participants 
        (session_id, device_id, player_id, nickname, net_amount, buy_in, buy_out, in_game)
      VALUES 
        (${sessionId}, ${p.deviceId}, ${p.playerId}, ${p.nickname || 'Player'}, ${p.netAmount}, 100, ${100 + p.netAmount}, 0)
    `;
  }
}

/**
 * Get all players from database
 */
export async function getAllPlayers() {
  return await sql`SELECT * FROM players ORDER BY id`;
}

/**
 * Get all sessions from database
 */
export async function getAllSessions() {
  return await sql`SELECT * FROM sessions ORDER BY created_at`;
}

/**
 * Get session participants for a specific session
 */
export async function getSessionParticipants(sessionId: string) {
  return await sql`
    SELECT * FROM session_participants 
    WHERE session_id = ${sessionId}
    ORDER BY player_id
  `;
}
