# Testing Guide

This directory contains all tests for the Poker Calculator application.

## Structure

```
__tests__/
├── unit/                     # Pure function tests (fast)
├── integration/              # Database + API tests
├── fixtures/                 # Test data (JSON files)
├── helpers/                  # Test utilities
│   └── db-setup.ts          # Database test helpers
├── setup.ts                  # Global test setup
└── README.md                # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test players.test.ts

# Run tests matching a pattern
npm test -- integration
```

## Database Setup

Tests use a **separate test database** configured in `.env.test`.

### First Time Setup:

1. Create a new Neon database for testing (separate from dev/prod)
2. Copy `.env.test` and update with your test database URL:
   ```bash
   DATABASE_URL="postgresql://user:password@host/poker_test?sslmode=require"
   ```
3. Make sure the URL contains "test" for safety
4. Run tests - the schema will be created automatically

### Test Isolation:

Tests use **TRUNCATE** for cleanup between tests:
- Each test runs with a clean database state
- `beforeEach` truncates all tables before the test
- This approach works with Neon's serverless HTTP-based connections
- Speed: ~20-50ms per test (still quite fast!)

**Why not transactions?** Neon's serverless driver uses HTTP-based connections which don't support traditional PostgreSQL transaction control (BEGIN/ROLLBACK). Each query is auto-committed.

## Writing Tests

### Integration Test Template:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { cleanDatabase } from '../helpers/db-setup';

describe('My Feature', () => {
  beforeEach(async () => {
    await cleanDatabase(); // Clean database before each test
  });

  it('should do something', async () => {
    // Test code here
    expect(result).toBe(expected);
  });
});
```

### Using Test Helpers:

```typescript
import { seedPlayers, linkDevice, createTestSession } from '../helpers/db-setup';

it('should test with seeded data', async () => {
  const players = await seedPlayers(['Alice', 'Bob']);
  await linkDevice('device-1', players[0].id);
  
  // Your test code
});
```

### Using Test Fixtures:

```typescript
import ledgerData from '../fixtures/ledgers/simple-session.json';

it('should process ledger', async () => {
  // Use ledgerData in your test
});
```

## Best Practices

1. **Keep tests fast** - Use transactions, not full database resets
2. **Test one thing** - Each test should verify a single behavior
3. **Use descriptive names** - `it('should reject duplicate player names')`
4. **Test edge cases** - Empty data, null values, large datasets
5. **Don't test implementation** - Test behavior, not internal details
6. **Keep tests independent** - No shared state between tests

## Coverage Goals

- **Critical paths**: 90%+ (player stats, session processing, payout calculation)
- **API routes**: 80%+
- **Database operations**: 90%+
- **Overall**: 70%+

## Troubleshooting

### Tests fail with "DATABASE_URL is not set"
- Ensure `.env.test` exists with valid DATABASE_URL

### Tests are slow
- Check that you're using transactions (`BEGIN`/`ROLLBACK`)
- Avoid calling `resetDatabase()` unless testing schema

### Flaky tests (pass sometimes, fail other times)
- Tests probably share state - ensure proper cleanup
- Check for missing `await` on async operations

### "Table already exists" error
- Your test database might be in a bad state
- Run setup endpoint manually or call `resetDatabase()` once

## Next Steps

1. Add more integration tests for remaining features
2. Add unit tests for pure functions (payout calculation)
3. Add API route tests
4. Set up CI/CD pipeline
5. Add pre-commit hooks to run tests
