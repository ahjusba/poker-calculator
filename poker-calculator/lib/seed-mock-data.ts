import { sql } from './db';

const MOCK_PLAYERS = [
  'Jussi',
  'Akseli',
  'Aleksi L.',
  'Antti',
  'Dani',
  'Eero',
  'Jaakko',
  'Janne R.',
  'Joel',
  'Joonas',
  'Lauri K.',
  'Mikko',
];

const MONTHS = 6;
const SESSIONS_PER_MONTH = 6;
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 9;
const BUY_IN_UNIT = 20; // euros per buy-in

interface SeededPlayer {
  id: number;
  name: string;
  deviceId: string;
}

export interface SeedResult {
  players: number;
  sessions: number;
  participants: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Round to 2 decimals. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Distributes a total pot across `n` players as random buy-out amounts that sum
 * exactly to `total` (zero-sum, no rake). Any rounding remainder is applied to
 * the last player.
 */
function distributePot(total: number, n: number): number[] {
  const weights = Array.from({ length: n }, () => Math.random() + 0.05);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const payouts = weights.map(w => round2((w / weightSum) * total));
  const assigned = payouts.slice(0, -1).reduce((a, b) => a + b, 0);
  payouts[payouts.length - 1] = round2(total - assigned);
  return payouts;
}

/**
 * Ensures the mock players exist and each has a mock device id. Returns the
 * seeded players with their database ids and device ids.
 */
async function ensurePlayers(): Promise<SeededPlayer[]> {
  const players: SeededPlayer[] = [];

  for (let i = 0; i < MOCK_PLAYERS.length; i++) {
    const name = MOCK_PLAYERS[i];
    const inserted = await sql`
      INSERT INTO players (player_name)
      VALUES (${name})
      ON CONFLICT (player_name) DO UPDATE SET player_name = EXCLUDED.player_name
      RETURNING id, player_name
    `;
    const player = inserted[0] as { id: number; player_name: string };
    const deviceId = `mock-dev-${i}`;

    await sql`
      INSERT INTO device_ids (device_id, player_id)
      VALUES (${deviceId}, ${player.id})
      ON CONFLICT (device_id) DO UPDATE SET player_id = ${player.id}
    `;

    players.push({ id: player.id, name: player.player_name, deviceId });
  }

  return players;
}

/** Builds an ordered list of session timestamps across the last N months. */
function buildSessionDates(): Date[] {
  const now = new Date();
  const dates: Date[] = [];

  for (let monthOffset = MONTHS - 1; monthOffset >= 0; monthOffset--) {
    const year = now.getFullYear();
    const month = now.getMonth() - monthOffset;
    const isCurrentMonth = monthOffset === 0;
    const maxDay = isCurrentMonth ? Math.max(1, now.getDate()) : 28;

    // Pick session days within the month. Days may repeat (distinguished by
    // time) so short/partial months still get a full set of sessions.
    const days = Array.from({ length: SESSIONS_PER_MONTH }, () => randomInt(1, maxDay));
    days.sort((a, b) => a - b);

    for (const day of days) {
      const hour = randomInt(18, 23);
      const minute = randomInt(0, 59);
      dates.push(new Date(year, month, day, hour, minute));
    }
  }

  return dates;
}

/**
 * Resets session data and seeds the database with mock sessions spanning six
 * months of gameplay (6 sessions per month, varying player counts, zero-sum
 * results). Players and device ids are created if missing.
 */
export async function seedMockData(): Promise<SeedResult> {
  const players = await ensurePlayers();

  // Reset only session data; keep players/devices/nicknames intact.
  await sql`TRUNCATE session_participants, sessions RESTART IDENTITY CASCADE`;

  const dates = buildSessionDates();
  let participantCount = 0;

  for (let i = 0; i < dates.length; i++) {
    const createdAt = dates[i];
    const sessionId = `mock-session-${i}`;
    const url = `https://mock.local/games/${sessionId}`;

    const count = randomInt(MIN_PLAYERS, Math.min(MAX_PLAYERS, players.length));
    const participants = shuffle(players).slice(0, count);

    // Each player buys in 1-3 times; the pot is redistributed as buy-outs.
    const buyIns = participants.map(() => randomInt(1, 3) * BUY_IN_UNIT);
    const pot = buyIns.reduce((a, b) => a + b, 0);
    const buyOuts = distributePot(pot, participants.length);

    await sql`
      INSERT INTO sessions (id, url, ledger_data, created_at, updated_at)
      VALUES (
        ${sessionId},
        ${url},
        ${JSON.stringify({ mock: true })},
        ${createdAt.toISOString()},
        ${createdAt.toISOString()}
      )
    `;

    for (let p = 0; p < participants.length; p++) {
      const player = participants[p];
      const buyIn = buyIns[p];
      const buyOut = buyOuts[p];
      const net = round2(buyOut - buyIn);

      await sql`
        INSERT INTO session_participants (
          session_id, device_id, player_id, nickname,
          net_amount, buy_in, buy_out, in_game
        )
        VALUES (
          ${sessionId}, ${player.deviceId}, ${player.id}, ${player.name},
          ${net}, ${buyIn}, ${buyOut}, ${0}
        )
      `;
      participantCount++;
    }
  }

  return {
    players: players.length,
    sessions: dates.length,
    participants: participantCount,
  };
}
