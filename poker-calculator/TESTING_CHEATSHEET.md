# Testing Cheat Sheet 🧪

Quick reference for common testing operations.

## 🚀 Quick Start (30 seconds)

```bash
# 1. Update test database URL
# Edit .env.test with your test database connection string

# 2. Run tests
npm test

# Done! ✅
```

## 📝 Common Commands

```bash
# Run all tests (one time)
npm test

# Watch mode - auto-run on file changes (RECOMMENDED)
npm run test:watch

# Visual UI - interactive browser interface
npm run test:ui

# Coverage report - see what's tested
npm run test:coverage

# Run specific test file
npm test players

# Run tests matching pattern
npm test -- integration
npm test -- unit
```

## ✍️ Writing Tests

### Basic Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Database Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sql } from '@/lib/db';

describe('Database Feature', () => {
  beforeEach(async () => {
    await sql`BEGIN`;  // Start transaction
  });

  afterEach(async () => {
    await sql`ROLLBACK`;  // Cleanup
  });

  it('should create record', async () => {
    const result = await createRecord('data');
    expect(result).toBeDefined();
  });
});
```

## 🛠️ Helper Functions

```typescript
// Seed test players
const players = await seedPlayers(['Alice', 'Bob']);

// Link device to player
await linkDevice('device-123', players[0].id);

// Create test session with participants
await createTestSession('session-1', [
  { deviceId: 'device-1', playerId: 1, netAmount: 50 },
  { deviceId: 'device-2', playerId: 2, netAmount: -50 },
]);

// Get all players
const allPlayers = await getAllPlayers();

// Get session participants
const participants = await getSessionParticipants('session-1');
```

## 🎯 Common Assertions

```typescript
// Equality
expect(value).toBe(expected);           // Exact match (===)
expect(value).toEqual(expected);        // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(5);
expect(number).toBeLessThan(10);
expect(number).toBeCloseTo(5.5, 1);     // Within precision

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Promises/Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Functions
expect(fn).toThrow();
expect(fn).toThrow('error message');
expect(fn).toHaveBeenCalled();          // Requires spy/mock
```

## 📊 Test Organization

```typescript
describe('Feature', () => {
  // Group related tests
  describe('subfeature A', () => {
    it('should do X', () => {});
    it('should do Y', () => {});
  });
  
  describe('subfeature B', () => {
    it('should do Z', () => {});
  });
});
```

## 🔄 Test Lifecycle Hooks

```typescript
beforeAll(async () => {
  // Runs once before all tests in this describe
  // Use for expensive setup
});

beforeEach(async () => {
  // Runs before each test
  // Use for test isolation
  await sql`BEGIN`;
});

afterEach(async () => {
  // Runs after each test
  // Use for cleanup
  await sql`ROLLBACK`;
});

afterAll(async () => {
  // Runs once after all tests
  // Use for final cleanup
});
```

## 📦 Using Fixtures

```typescript
// Import JSON test data
import ledger from '../fixtures/ledgers/simple-session.json';

it('should process ledger', () => {
  const result = processLedger(ledger);
  expect(result).toBeDefined();
});
```

## 🐛 Debugging Tests

```typescript
// Use console.log (it works!)
it('should debug', () => {
  console.log('Debug value:', value);
  expect(value).toBe(expected);
});

// Use only/skip to focus on specific tests
it.only('focus on this test', () => {});  // Only run this
it.skip('skip this test', () => {});      // Don't run this

// Run specific test file
npm test players.test.ts

// Run with UI for visual debugging
npm run test:ui
```

## ⚡ Performance Tips

```typescript
// ✅ GOOD: Use transactions (fast)
beforeEach(async () => await sql`BEGIN`);
afterEach(async () => await sql`ROLLBACK`);

// ❌ AVOID: Full database reset (slow)
beforeEach(async () => await resetDatabase());

// ✅ GOOD: Seed only what you need
const [player1, player2] = await seedPlayers(['A', 'B']);

// ❌ AVOID: Seed everything every time
await seedPlayers(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
```

## 📈 Coverage Interpretation

```bash
npm run test:coverage
```

```
File         | % Stmts | % Branch | % Funcs | % Lines
-------------|---------|----------|---------|--------
players.ts   |   92.5  |   85.7   |   100   |   92.5
sessions.ts  |   88.2  |   75.0   |   100   |   88.2
```

- **Stmts**: Statement coverage (aim for 80%+)
- **Branch**: Branch coverage (if/else, aim for 70%+)
- **Funcs**: Function coverage (aim for 90%+)
- **Lines**: Line coverage (aim for 80%+)

## 🎨 Test Naming Conventions

```typescript
// ✅ GOOD: Descriptive, behavior-focused
it('should create a new player with valid name', () => {});
it('should reject duplicate player names', () => {});
it('should calculate net winnings across multiple sessions', () => {});

// ❌ BAD: Vague, implementation-focused
it('test player creation', () => {});
it('should work', () => {});
it('player test', () => {});
```

## 🚨 Common Errors & Solutions

### "DATABASE_URL is not set"
```bash
# Check .env.test exists and has DATABASE_URL
cat .env.test
```

### Tests are slow
```typescript
// Make sure you're using transactions
beforeEach(async () => await sql`BEGIN`);
afterEach(async () => await sql`ROLLBACK`);
```

### "Table does not exist"
```bash
# Run setup once to create schema
npm run dev
# Visit: http://localhost:3000/api/setup-db
```

### Test passes alone but fails with others
```typescript
// Tests are not isolated - add proper cleanup
afterEach(async () => {
  await sql`ROLLBACK`;
});
```

## 📚 Resources

- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Project Guide**: See `__tests__/README.md`
- **Quick Start**: See `TESTING_QUICKSTART.md`
- **Architecture**: See `TESTING_ARCHITECTURE.md`

## 🎯 Quick Win Examples

### Test a Pure Function (2 minutes)
```typescript
// __tests__/unit/my-test.test.ts
import { describe, it, expect } from 'vitest';

function add(a: number, b: number) {
  return a + b;
}

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### Test a Database Function (5 minutes)
```typescript
// __tests__/integration/my-db-test.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sql } from '@/lib/db';
import { createPlayer } from '@/lib/players';

describe('createPlayer', () => {
  beforeEach(async () => await sql`BEGIN`);
  afterEach(async () => await sql`ROLLBACK`);
  
  it('should create a player', async () => {
    const player = await createPlayer('Test');
    expect(player.player_name).toBe('Test');
  });
});
```

---

**Need help?** Check `TESTING_QUICKSTART.md` or `__tests__/README.md`
