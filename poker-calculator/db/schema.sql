-- Players: Core player information only
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device IDs: Links devices to players
CREATE TABLE IF NOT EXISTS device_ids (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nicknames: Track all nicknames used by players
CREATE TABLE IF NOT EXISTS nicknames (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nickname VARCHAR(255) NOT NULL,
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, nickname)
);

-- Sessions: Store raw ledger data (source of truth)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  url TEXT NOT NULL,
  ledger_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Participants: Links players to sessions with their results
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
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_name ON players(player_name);
CREATE INDEX IF NOT EXISTS idx_device_ids_player ON device_ids(player_id);
CREATE INDEX IF NOT EXISTS idx_device_ids_device ON device_ids(device_id);
CREATE INDEX IF NOT EXISTS idx_nicknames_player ON nicknames(player_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_player ON session_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_device ON session_participants(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
