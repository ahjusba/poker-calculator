import { sql } from './db';

export async function setupDatabase() {
  try {
    // Drop existing tables in correct order (child tables first)
    await sql`DROP TABLE IF EXISTS session_participants CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS nicknames CASCADE`;
    await sql`DROP TABLE IF EXISTS device_ids CASCADE`;
    await sql`DROP TABLE IF EXISTS players CASCADE`;

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create device_ids table
    await sql`
      CREATE TABLE IF NOT EXISTS device_ids (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create nicknames table
    await sql`
      CREATE TABLE IF NOT EXISTS nicknames (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        nickname VARCHAR(255) NOT NULL,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, nickname)
      )
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        url TEXT NOT NULL,
        ledger_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create session_participants table
    await sql`
      CREATE TABLE IF NOT EXISTS session_participants (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        nickname VARCHAR(255),
        net_amount DECIMAL(10, 2) NOT NULL,
        buy_in DECIMAL(10, 2) NOT NULL,
        buy_out DECIMAL(10, 2) NOT NULL,
        in_game DECIMAL(10, 2) NOT NULL,
        UNIQUE(session_id, device_id)
      )
    `;

    // Create indexes for players
    await sql`
      CREATE INDEX IF NOT EXISTS idx_player_name ON players(player_name)
    `;

    // Create indexes for device_ids
    await sql`
      CREATE INDEX IF NOT EXISTS idx_device_ids_player ON device_ids(player_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_device_ids_device ON device_ids(device_id)
    `;

    // Create indexes for nicknames
    await sql`
      CREATE INDEX IF NOT EXISTS idx_nicknames_player ON nicknames(player_id)
    `;

    // Create indexes for session_participants
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_participants_player ON session_participants(player_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_participants_device ON session_participants(device_id)
    `;

    // Create index for sessions
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)
    `;

    // Insert default players
    const playerNames = [
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
      'Lauri P.',
      'Sampsa',
      'Aleksi K.',
      'Janne P.',
      'Lasse',
      'kake'
    ];

    for (const name of playerNames) {
      await sql`
        INSERT INTO players (player_name)
        VALUES (${name})
        ON CONFLICT (player_name) DO NOTHING
      `;
    }

    console.log('Database setup completed successfully');
    console.log(`Created ${playerNames.length} players`);
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}
