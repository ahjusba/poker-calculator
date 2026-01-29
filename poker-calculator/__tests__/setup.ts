import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') });

// Safety check: Verify test database is configured
if (!process.env.DATABASE_URL) {
  throw new Error('⚠️  DATABASE_URL is not set in .env.test!');
}

if (!process.env.DATABASE_URL.includes('test')) {
  console.warn('⚠️  WARNING: Database URL should contain "test" to prevent accidental use of production/dev database!');
}

console.log('🧪 Test environment initialized');
