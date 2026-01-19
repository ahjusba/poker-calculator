import { sql } from './db';

export interface Session {
  id: string;
  created_at: Date;
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM sessions WHERE id = ${sessionId}
  `;
  return result.length > 0;
}

export async function createSession(sessionId: string) {
  const result = await sql`
    INSERT INTO sessions (id)
    VALUES (${sessionId})
    RETURNING *
  `;
  return result[0] as Session;
}

export async function getAllSessions() {
  const result = await sql`
    SELECT * FROM sessions ORDER BY created_at DESC
  `;
  return result as Session[];
}
