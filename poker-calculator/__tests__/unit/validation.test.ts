import { describe, it, expect } from 'vitest';

/**
 * Example unit tests for pure functions
 * These tests don't need database access and run very fast
 */

describe('URL Validation', () => {
  // Helper function to extract session ID from pokernow.club URL
  function extractSessionId(url: string): string | null {
    const match = url.match(/pokernow\.club\/games\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  it('should extract session ID from valid pokernow URL', () => {
    const url = 'https://www.pokernow.club/games/abc123def456';
    const sessionId = extractSessionId(url);
    
    expect(sessionId).toBe('abc123def456');
  });

  it('should return null for invalid URL', () => {
    const url = 'https://example.com/not-a-poker-game';
    const sessionId = extractSessionId(url);
    
    expect(sessionId).toBeNull();
  });

  it('should handle URLs with query parameters', () => {
    const url = 'https://www.pokernow.club/games/test123?param=value';
    const sessionId = extractSessionId(url);
    
    expect(sessionId).toBe('test123');
  });
});

describe('Currency Formatting', () => {
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  it('should format positive amounts', () => {
    expect(formatCurrency(100)).toBe('100,00 €');
  });

  it('should format negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-50,00 €');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('0,00 €');
  });

  it('should format decimals', () => {
    expect(formatCurrency(123.45)).toBe('123,45 €');
  });
});

describe('Player Name Validation', () => {
  function isValidPlayerName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  it('should accept valid names', () => {
    expect(isValidPlayerName('Alice')).toBe(true);
    expect(isValidPlayerName('Bob Jones')).toBe(true);
  });

  it('should reject empty names', () => {
    expect(isValidPlayerName('')).toBe(false);
    expect(isValidPlayerName('   ')).toBe(false);
  });

  it('should reject single character names', () => {
    expect(isValidPlayerName('A')).toBe(false);
  });

  it('should reject very long names', () => {
    const longName = 'A'.repeat(51);
    expect(isValidPlayerName(longName)).toBe(false);
  });

  it('should trim whitespace before validation', () => {
    expect(isValidPlayerName('  Alice  ')).toBe(true);
  });
});
