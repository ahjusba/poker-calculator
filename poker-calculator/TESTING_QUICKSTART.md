# Testing Quick Start Guide

This document will help you get testing up and running quickly.

## 1. Prerequisites ✅ (Already Done!)

- ✅ Vitest installed
- ✅ Test folder structure created
- ✅ Helper functions created
- ✅ Example tests written
- ✅ Package.json scripts added

## 2. Configure Test Database

### Create Test Database in Neon:

1. Go to [Neon Console](https://console.neon.tech)
2. Create a **new database** (separate from dev/prod)
3. Name it something like `poker-calculator-test` or `poker_test`
4. Copy the connection string

### Update `.env.test`:

```bash
# Replace with your actual test database URL
DATABASE_URL="postgresql://user:password@your-test-host/poker_test?sslmode=require"
NODE_ENV=test
```

**Important**: Make sure the database name contains "test" for safety!

## 3. Initialize Test Database

The test database needs the schema. You have two options:

### Option A: Run setup manually (one-time)
```bash
# Start dev server with test env
DATABASE_URL="your-test-db-url" npm run dev

# In browser, visit:
http://localhost:3000/api/setup-db
```

### Option B: Let tests create schema automatically
The first test run will create tables as needed via the helper functions.

## 4. Run Your First Test

```bash
# Run all tests
npm test
```

You should see output like:
```
✓ __tests__/integration/players.test.ts (12 tests) 234ms
✓ __tests__/integration/sessions.test.ts (6 tests) 156ms

Test Files  2 passed (2)
Tests  18 passed (18)
Duration  420ms
```

## 5. Development Workflow

### Watch Mode (Recommended for Development)
```bash
npm run test:watch
```
- Auto-runs tests when files change
- Only runs tests related to changed files
- Press 'a' to run all tests
- Press 'q' to quit

### UI Mode (Visual Interface)
```bash
npm run test:ui
```
- Opens browser with test UI
- See test results visually
- Inspect test details
- Great for debugging

### Coverage Report
```bash
npm run test:coverage
```
- Shows which code is tested
- Generates HTML report in `coverage/` folder
- Open `coverage/index.html` in browser

## 6. Writing Your First Test

Create a new test file: `__tests__/integration/my-feature.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sql } from '@/lib/db';
import { seedPlayers } from '../helpers/db-setup';

describe('My Feature', () => {
  // Start transaction before each test (fast isolation)
  beforeEach(async () => {
    await sql`BEGIN`;
  });

  // Rollback transaction after each test (cleanup)
  afterEach(async () => {
    await sql`ROLLBACK`;
  });

  it('should do something', async () => {
    // Arrange: Set up test data
    const players = await seedPlayers(['Alice', 'Bob']);
    
    // Act: Perform the action
    const result = await myFunction(players[0].id);
    
    // Assert: Check the result
    expect(result).toBe(expected);
  });
});
```

## 7. Common Test Patterns

### Testing Database Queries
```typescript
it('should get player stats', async () => {
  const players = await seedPlayers(['Winner']);
  await linkDevice('device-1', players[0].id);
  await createTestSession('session-1', [
    { deviceId: 'device-1', playerId: players[0].id, netAmount: 50 }
  ]);
  
  const stats = await getAllPlayerStats();
  
  expect(stats[0].net_winnings).toBe(50);
  expect(stats[0].sessions).toBe(1);
});
```

### Testing Error Cases
```typescript
it('should reject duplicate player names', async () => {
  await createPlayer('Duplicate');
  
  await expect(
    createPlayer('Duplicate')
  ).rejects.toThrow();
});
```

### Using Test Fixtures
```typescript
import ledgerData from '../fixtures/ledgers/simple-session.json';

it('should process ledger', async () => {
  // Use ledgerData in your test
  expect(ledgerData.playersInfos).toBeDefined();
});
```

## 8. Available Helper Functions

All defined in `__tests__/helpers/db-setup.ts`:

```typescript
// Database management
await resetDatabase();         // Drop/recreate all tables (slow, rarely needed)
await cleanDatabase();          // Truncate tables (faster, but usually not needed with transactions)

// Test data
await seedPlayers(['Alice', 'Bob', 'Charlie']);
await linkDevice('device-id', playerId);
await createTestSession('session-id', participants);

// Queries
await getAllPlayers();
await getAllSessions();
await getSessionParticipants('session-id');
```

## 9. Troubleshooting

### "DATABASE_URL is not set"
- Check that `.env.test` exists
- Verify DATABASE_URL is set correctly

### Tests are slow
- Make sure you're using transactions (BEGIN/ROLLBACK)
- Avoid calling `resetDatabase()` unless necessary

### Tests pass locally but fail in CI
- Ensure test database is configured in CI
- Check for timing issues (add proper awaits)

### "Table does not exist"
- Run setup endpoint once to create schema
- Or let first test run create tables

## 10. Next Steps

1. ✅ Run `npm test` to verify everything works
2. ✅ Try `npm run test:watch` for development
3. ✅ Try `npm run test:ui` to see the visual interface
4. 📝 Write tests for your specific features
5. 📝 Add more test fixtures (JSON files) as needed
6. 📈 Run `npm run test:coverage` to see coverage
7. 🎯 Aim for 80%+ coverage on critical code

## Quick Reference Card

| Command | What it does |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open visual test interface |
| `npm run test:coverage` | Generate coverage report |
| `npm test players` | Run tests matching "players" |

| Helper | Purpose |
|--------|---------|
| `seedPlayers()` | Create test players |
| `linkDevice()` | Link device to player |
| `createTestSession()` | Create session with participants |

## Need Help?

- Check `__tests__/README.md` for detailed docs
- Look at existing tests for examples
- Vitest docs: https://vitest.dev/

Happy testing! 🧪
