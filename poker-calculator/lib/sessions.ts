import { sql } from './db';

export interface Session {
  id: string;
  url: string;
  ledger_data: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface SessionParticipant {
  id: number;
  session_id: string;
  device_id: string;
  player_id: number;
  nickname: string;
  net_amount: number;
  buy_in: number;
  buy_out: number;
  in_game: number;
}

// ============ SESSION FUNCTIONS ============

export async function sessionExists(sessionId: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM sessions WHERE id = ${sessionId}
  `;
  return result.length > 0;
}

export async function createSession(sessionId: string, url: string, ledgerData: unknown): Promise<Session> {
  const result = await sql`
    INSERT INTO sessions (id, url, ledger_data)
    VALUES (${sessionId}, ${url}, ${JSON.stringify(ledgerData)})
    RETURNING *
  `;
  return result[0] as Session;
}

export async function getSessionById(sessionId: string): Promise<Session | undefined> {
  const result = await sql`
    SELECT * FROM sessions WHERE id = ${sessionId}
  `;
  return result[0] as Session | undefined;
}

export async function getAllSessions(): Promise<Session[]> {
  const result = await sql`
    SELECT * FROM sessions ORDER BY created_at DESC
  `;
  return result as Session[];
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`
    DELETE FROM sessions WHERE id = ${sessionId}
  `;
}

// ============ SESSION PARTICIPANT FUNCTIONS ============

export async function createSessionParticipant(
  sessionId: string,
  deviceId: string,
  playerId: number,
  nickname: string,
  netAmount: number,
  buyIn: number,
  buyOut: number,
  inGame: number
): Promise<SessionParticipant> {
  const result = await sql`
    INSERT INTO session_participants (
      session_id, device_id, player_id, nickname, 
      net_amount, buy_in, buy_out, in_game
    )
    VALUES (
      ${sessionId}, ${deviceId}, ${playerId}, ${nickname},
      ${netAmount}, ${buyIn}, ${buyOut}, ${inGame}
    )
    RETURNING *
  `;
  return result[0] as SessionParticipant;
}

export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  const result = await sql`
    SELECT * FROM session_participants WHERE session_id = ${sessionId}
  `;
  return result as SessionParticipant[];
}

export async function getPlayerSessions(playerId: number): Promise<SessionParticipant[]> {
  const result = await sql`
    SELECT * FROM session_participants WHERE player_id = ${playerId} ORDER BY id DESC
  `;
  return result as SessionParticipant[];
}
