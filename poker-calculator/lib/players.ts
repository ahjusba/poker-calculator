import { sql } from './db';

// ============ TYPES ============

export interface Player {
  id: number;
  player_name: string;
  created_at: Date;
}

export interface DeviceId {
  id: number;
  device_id: string;
  player_id: number;
  first_seen: Date;
}

export interface Nickname {
  id: number;
  player_id: number;
  nickname: string;
  first_seen: Date;
}

export interface PlayerStats {
  id: number;
  player_name: string;
  sessions: number;
  net_winnings: number;
  nicknames: string[];
  device_ids: string[];
}

// ============ PLAYER CRUD ============

export async function createPlayer(playerName: string): Promise<Player> {
  const result = await sql`
    INSERT INTO players (player_name)
    VALUES (${playerName})
    RETURNING *
  `;
  return result[0] as Player;
}

export async function getPlayerById(id: number): Promise<Player | undefined> {
  const result = await sql`
    SELECT * FROM players WHERE id = ${id}
  `;
  return result[0] as Player | undefined;
}

export async function getPlayerByName(playerName: string): Promise<Player | undefined> {
  const result = await sql`
    SELECT * FROM players WHERE player_name = ${playerName}
  `;
  return result[0] as Player | undefined;
}

export async function getAllPlayers(): Promise<Player[]> {
  const result = await sql`
    SELECT * FROM players ORDER BY player_name ASC
  `;
  return result as Player[];
}

export async function deletePlayer(id: number): Promise<void> {
  await sql`
    DELETE FROM players WHERE id = ${id}
  `;
}

// ============ DEVICE ID FUNCTIONS ============

export async function linkDeviceToPlayer(deviceId: string, playerId: number): Promise<DeviceId> {
  const result = await sql`
    INSERT INTO device_ids (device_id, player_id)
    VALUES (${deviceId}, ${playerId})
    ON CONFLICT (device_id) 
    DO UPDATE SET player_id = ${playerId}
    RETURNING *
  `;
  return result[0] as DeviceId;
}

export async function getPlayerByDeviceId(deviceId: string): Promise<Player | undefined> {
  const result = await sql`
    SELECT p.* 
    FROM players p
    JOIN device_ids d ON d.player_id = p.id
    WHERE d.device_id = ${deviceId}
  `;
  return result[0] as Player | undefined;
}

export async function getDeviceIdsByPlayerId(playerId: number): Promise<string[]> {
  const result = await sql`
    SELECT device_id FROM device_ids WHERE player_id = ${playerId}
  `;
  return result.map(row => row.device_id as string);
}

// ============ NICKNAME FUNCTIONS ============

export async function addNicknameToPlayer(playerId: number, nickname: string): Promise<void> {
  await sql`
    INSERT INTO nicknames (player_id, nickname)
    VALUES (${playerId}, ${nickname})
    ON CONFLICT (player_id, nickname) DO NOTHING
  `;
}

export async function getNicknamesByPlayerId(playerId: number): Promise<string[]> {
  const result = await sql`
    SELECT nickname FROM nicknames WHERE player_id = ${playerId} ORDER BY nickname
  `;
  return result.map(row => row.nickname as string);
}

// ============ PLAYER STATS (CALCULATED) ============

export async function getPlayerStats(playerId: number): Promise<PlayerStats | undefined> {
  const result = await sql`
    SELECT 
      p.id,
      p.player_name,
      COALESCE(stats.sessions, 0)::int as sessions,
      COALESCE(stats.net_winnings, 0) as net_winnings,
      COALESCE(nicks.nicknames, '{}') as nicknames,
      COALESCE(devs.device_ids, '{}') as device_ids
    FROM players p
    LEFT JOIN (
      SELECT 
        player_id,
        COUNT(DISTINCT session_id) as sessions,
        SUM(net_amount) as net_winnings
      FROM session_participants
      WHERE player_id = ${playerId}
      GROUP BY player_id
    ) stats ON stats.player_id = p.id
    LEFT JOIN (
      SELECT 
        player_id,
        ARRAY_AGG(DISTINCT nickname) as nicknames
      FROM nicknames
      WHERE player_id = ${playerId}
      GROUP BY player_id
    ) nicks ON nicks.player_id = p.id
    LEFT JOIN (
      SELECT 
        player_id,
        ARRAY_AGG(DISTINCT device_id) as device_ids
      FROM device_ids
      WHERE player_id = ${playerId}
      GROUP BY player_id
    ) devs ON devs.player_id = p.id
    WHERE p.id = ${playerId}
  `;
  return result[0] as PlayerStats | undefined;
}

export async function getAllPlayerStats(): Promise<PlayerStats[]> {
  const result = await sql`
    SELECT 
      p.id,
      p.player_name,
      COALESCE(stats.sessions, 0)::int as sessions,
      COALESCE(stats.net_winnings, 0) as net_winnings,
      COALESCE(nicks.nicknames, '{}') as nicknames,
      COALESCE(devs.device_ids, '{}') as device_ids
    FROM players p
    LEFT JOIN (
      SELECT 
        player_id,
        COUNT(DISTINCT session_id) as sessions,
        SUM(net_amount) as net_winnings
      FROM session_participants
      GROUP BY player_id
    ) stats ON stats.player_id = p.id
    LEFT JOIN (
      SELECT 
        player_id,
        ARRAY_AGG(DISTINCT nickname) as nicknames
      FROM nicknames
      GROUP BY player_id
    ) nicks ON nicks.player_id = p.id
    LEFT JOIN (
      SELECT 
        player_id,
        ARRAY_AGG(DISTINCT device_id) as device_ids
      FROM device_ids
      GROUP BY player_id
    ) devs ON devs.player_id = p.id
    ORDER BY net_winnings DESC
  `;
  return result as PlayerStats[];
}
