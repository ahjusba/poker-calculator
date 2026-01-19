import { sql } from './db';

export async function setupDatabase() {
  try {
    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255) NOT NULL,
        nicknames TEXT[] DEFAULT '{}',
        device_ids TEXT[] DEFAULT '{}',
        net_winnings DECIMAL(10, 2) DEFAULT 0.00,
        sessions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for players
    await sql`
      CREATE INDEX IF NOT EXISTS idx_player_name ON players(player_name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_device_ids ON players USING GIN(device_ids)
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for sessions
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)
    `;

    console.log('Database setup completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}
