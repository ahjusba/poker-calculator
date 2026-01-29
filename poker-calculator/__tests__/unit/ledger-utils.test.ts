import { describe, it, expect } from 'vitest';
import { extractSessionId } from '@/lib/ledger-utils';

/**
 * Unit tests for ledger utility functions (pure functions that don't require database)
 */

describe('Ledger Utils - Unit Tests', () => {
  describe('extractSessionId', () => {
    it('should extract session ID from pokernow.club URL', () => {
      const url = 'https://www.pokernow.club/games/abc123def456';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('abc123def456');
    });

    it('should extract session ID from pokernow.com URL', () => {
      const url = 'https://www.pokernow.com/games/pglE6yPrNG3_Qa0uezzmHkFR9';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('pglE6yPrNG3_Qa0uezzmHkFR9');
    });

    it('should return null for invalid URL format', () => {
      const url = 'https://example.com/not-a-poker-game';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://www.pokernow.club/games/test123?param=value&other=data';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('test123');
    });

    it('should handle URLs with trailing slash', () => {
      const url = 'https://www.pokernow.com/games/abc123/';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('abc123');
    });

    it('should handle session IDs with special characters', () => {
      const url = 'https://www.pokernow.com/games/abc_123-DEF';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('abc_123-DEF');
    });

    it('should return null for URL without /games/ path', () => {
      const url = 'https://www.pokernow.com/home';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBeNull();
    });

    it('should return null for empty string', () => {
      const url = '';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBeNull();
    });

    it('should handle URL with /games/ but no session ID', () => {
      const url = 'https://www.pokernow.com/games/';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBeNull();
    });

    it('should handle URL without protocol', () => {
      const url = 'pokernow.com/games/session123';
      const sessionId = extractSessionId(url);
      
      expect(sessionId).toBe('session123');
    });
  });
});
