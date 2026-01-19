-- Create Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  nicknames TEXT[] DEFAULT '{}',
  device_ids TEXT[] DEFAULT '{}',
  net_winnings DECIMAL(10, 2) DEFAULT 0.00,
  sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on player_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_name ON players(player_name);

-- Create index on device_ids for faster array searches
CREATE INDEX IF NOT EXISTS idx_device_ids ON players USING GIN(device_ids);

-- Create Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
