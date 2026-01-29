# Poker Calculator

A Next.js application for tracking poker game sessions and calculating player statistics.

## Setup

### Prerequisites
- Node.js 18+ 
- Two Neon PostgreSQL databases (development and production)

### Database Setup

This project uses **separate databases** for development and production:

1. **Development Database**: Create a Neon database for local testing
2. **Production Database**: Create a separate Neon database for production

### Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your **development** database URL:
   ```bash
   DATABASE_URL="postgresql://user:password@your-dev-host/database?sslmode=require"
   NODE_ENV=development
   ```

3. For production, set the `DATABASE_URL` environment variable in your hosting platform (Vercel, etc.)

### Installation

```bash
# Install dependencies
npm install

# Initialize the database schema and seed data
# This endpoint is localhost-only for security
npm run dev
# Then visit: http://localhost:3000/api/setup-db
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Testing

This project uses Vitest for testing with a focus on database operations.

### Test Database Setup

1. Create a separate Neon database for testing
2. Update `.env.test` with your test database URL:
   ```bash
   DATABASE_URL="postgresql://user:password@host/poker_test?sslmode=require"
   ```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- `__tests__/unit/` - Pure function tests
- `__tests__/integration/` - Database and API tests
- `__tests__/fixtures/` - Test data (JSON ledgers)
- `__tests__/helpers/` - Test utilities

See [`__tests__/README.md`](__tests__/README.md) for detailed testing guide.

## Features

- Upload poker session ledgers from pokernow.com
- Track player statistics across multiple sessions
- Real-time leaderboard with net winnings
- Device linking for player identification
- Session-centric data architecture

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/lib` - Database utilities and business logic
- `/db` - Database schema definitions