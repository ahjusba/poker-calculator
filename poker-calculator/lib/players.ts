import { sql } from './db';

export interface Player {
  id: number;
  player_name: string;
  nicknames: string[];
  device_ids: string[];
  net_winnings: number;
  sessions: number;
  created_at: Date;
  updated_at: Date;
}

export async function createPlayer(
  playerName: string,
  nicknames: string[] = [],
  deviceIds: string[] = [],
  netWinnings: number = 0,
  sessions: number = 0
) {
  const result = await sql`
    INSERT INTO players (player_name, nicknames, device_ids, net_winnings, sessions)
    VALUES (${playerName}, ${nicknames}, ${deviceIds}, ${netWinnings}, ${sessions})
    RETURNING *
  `;
  return result[0] as Player;
}

export async function getPlayerById(id: number) {
  const result = await sql`
    SELECT * FROM players WHERE id = ${id}
  `;
  return result[0] as Player | undefined;
}

export async function getPlayerByName(playerName: string) {
  const result = await sql`
    SELECT * FROM players WHERE player_name = ${playerName}
  `;
  return result[0] as Player | undefined;
}

export async function getPlayerByDeviceId(deviceId: string) {
  const result = await sql`
    SELECT * FROM players WHERE ${deviceId} = ANY(device_ids)
  `;
  return result[0] as Player | undefined;
}

export async function getAllPlayers() {
  const result = await sql`
    SELECT * FROM players ORDER BY net_winnings DESC
  `;
  return result as Player[];
}

export async function updatePlayer(
  id: number,
  updates: {
    player_name?: string;
    nicknames?: string[];
    device_ids?: string[];
    net_winnings?: number;
    sessions?: number;
  }
) {
  const player = await getPlayerById(id);
  if (!player) return undefined;

  const updatedPlayerName = updates.player_name ?? player.player_name;
  const updatedNicknames = updates.nicknames ?? player.nicknames;
  const updatedDeviceIds = updates.device_ids ?? player.device_ids;
  const updatedNetWinnings = updates.net_winnings ?? player.net_winnings;
  const updatedSessions = updates.sessions ?? player.sessions;

  const result = await sql`
    UPDATE players 
    SET player_name = ${updatedPlayerName},
        nicknames = ${updatedNicknames},
        device_ids = ${updatedDeviceIds},
        net_winnings = ${updatedNetWinnings},
        sessions = ${updatedSessions},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Player | undefined;
}

export async function addNicknameToPlayer(id: number, nickname: string) {
  const result = await sql`
    UPDATE players
    SET nicknames = array_append(nicknames, ${nickname}),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Player | undefined;
}

export async function addDeviceIdToPlayer(id: number, deviceId: string) {
  const result = await sql`
    UPDATE players
    SET device_ids = array_append(device_ids, ${deviceId}),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Player | undefined;
}

export async function updateNetWinnings(id: number, amount: number) {
  const result = await sql`
    UPDATE players
    SET net_winnings = net_winnings + ${amount},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Player | undefined;
}

export async function incrementSessions(id: number) {
  const result = await sql`
    UPDATE players
    SET sessions = sessions + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Player | undefined;
}

export async function deletePlayer(id: number) {
  await sql`
    DELETE FROM players WHERE id = ${id}
  `;
}
