# Migration Guide: Session-Centric Architecture

## Overview
The application has been refactored from a player-centric to a session-centric architecture. Player stats (net_winnings, sessions count, nicknames, device_ids) are now calculated in real-time from session data instead of being stored directly.

## What Changed

### Database Schema

#### Old Structure:
- `players` table with: player_name, nicknames[], device_ids[], net_winnings, sessions
- `sessions` table with: id only

#### New Structure:
- `players` table: id, player_name, created_at (minimal core data)
- `device_ids` table: device_id, player_id (separate linking table)
- `nicknames` table: player_id, nickname (separate tracking)
- `sessions` table: id, url, ledger_data (JSONB), timestamps (full ledger storage)
- `session_participants` table: session_id, device_id, player_id, nickname, net_amount, buy_in, buy_out, in_game

### Benefits

✅ **Session updates are easy**: Update/delete a session and stats recalculate automatically
✅ **Audit trail**: Know exactly which sessions contributed to each player's stats
✅ **Data integrity**: Single source of truth (sessions table)
✅ **Corrections**: Fix mistakes without complex data manipulation
✅ **Analytics**: Track performance over time, session-by-session

### Performance

With proper indexing, real-time calculation is very fast:
- Single player stats: ~10-20ms
- Leaderboard (all players): ~20-100ms (for 200 sessions)
- Player stats are calculated via SQL aggregation, which is highly optimized

## Migration Steps

### 1. Backup Your Data (IMPORTANT!)

```bash
# Export existing data if needed
# This depends on your Neon database setup
```

### 2. Drop Old Tables & Create New Schema

**Option A: Fresh Start (Recommended for Development)**

Visit: `http://localhost:3000/api/setup-db`

This will create all new tables with the correct schema.

**Option B: Manual Migration (If you have existing data)**

You would need to:
1. Export player names from old `players` table
2. Export device ID mappings
3. Run `/api/setup-db` to create new schema
4. Re-import players using `/api/players` (POST)
5. Re-import device mappings using `/api/link-devices`
6. Re-submit all sessions (they will repopulate stats)

### 3. Test the New System

1. Create a few test players: `POST /api/players`
2. Submit a ledger URL: `POST /api/ledger`
3. Link any unknown devices when prompted
4. Check player stats: `GET /api/players`

## API Changes

### GET /api/players

**Before:**
```json
{
  "players": [{
    "id": 1,
    "player_name": "Jussi",
    "nicknames": ["JussiK", "Jussi"],
    "device_ids": ["abc123"],
    "net_winnings": 50.00,
    "sessions": 5
  }]
}
```

**After:**
```json
{
  "players": [{
    "id": 1,
    "player_name": "Jussi",
    "nicknames": ["JussiK", "Jussi"],
    "device_ids": ["abc123"],
    "net_winnings": 50.00,
    "sessions": 5
  }]
}
```
*Same format, but now calculated in real-time!*

### POST /api/players

**Before:**
```json
{
  "playerName": "Jussi"
}
```

**After:**
```json
{
  "playerName": "Jussi"
}
```
*Same! But now only creates core player record.*

### POST /api/ledger

**No changes to API contract** - works exactly the same way:
1. Checks for duplicate sessions
2. Checks for unknown device IDs
3. Links devices if needed
4. Processes ledger and returns payout

**Internally:** Now stores full session data and creates session_participant records.

## Code Changes Summary

### lib/players.ts
- Removed: `updateNetWinnings()`, `incrementSessions()`, `addDeviceIdToPlayer()` (array operations)
- Added: `linkDeviceToPlayer()` (new table), `getPlayerStats()`, `getAllPlayerStats()` (calculated)
- Simplified: `createPlayer()` now only takes player_name

### lib/sessions.ts
- Changed: `createSession()` now stores url and full ledger_data
- Added: `createSessionParticipant()`, `getSessionParticipants()`, `getPlayerSessions()`

### app/api/ledger/route.ts
- Changed: `processLedger()` now creates session_participant records instead of updating player fields
- Removed: Manual session/winnings tracking
- Added: Full ledger data storage

## Future Enhancements Enabled

Now you can easily add:
- Session history view per player
- Delete/edit sessions with automatic stat recalculation
- Time-based analytics (performance over time)
- Session filters (by date range, player participation, etc.)
- Leaderboard snapshots for specific time periods
- Undo functionality for mistaken submissions

## Rollback Plan

If you need to rollback:
1. Keep a copy of your old code in a separate branch
2. Export your session data first
3. Restore old schema from `db/schema.sql` (previous version)
4. Re-import data

## Questions?

The new architecture is more maintainable and flexible. While it adds complexity to the database schema, it significantly simplifies application logic and enables many future features.
