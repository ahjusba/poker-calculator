import { sql } from './db';

export interface PlayerSessionResult {
  player_id: number;
  player_name: string;
  session_id: string;
  created_at: string;
  net_amount: number;
}

/**
 * Returns one row per player per session with the session timestamp and the
 * player's net result for that session, ordered chronologically.
 *
 * Results are already keyed by player_id, so multiple device IDs belonging to
 * the same player are aggregated per session.
 */
export async function getPlayerSessionResults(): Promise<PlayerSessionResult[]> {
  const result = await sql`
    SELECT
      sp.player_id,
      p.player_name,
      sp.session_id,
      s.created_at,
      SUM(sp.net_amount)::numeric AS net_amount
    FROM session_participants sp
    JOIN sessions s ON s.id = sp.session_id
    JOIN players p ON p.id = sp.player_id
    GROUP BY sp.player_id, p.player_name, sp.session_id, s.created_at
    ORDER BY s.created_at ASC, sp.player_id ASC
  `;

  return result.map(row => ({
    player_id: row.player_id as number,
    player_name: row.player_name as string,
    session_id: row.session_id as string,
    created_at: new Date(row.created_at as string).toISOString(),
    net_amount: parseFloat(row.net_amount as unknown as string) || 0,
  }));
}
