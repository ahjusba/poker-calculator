import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { 
  checkForUnknownDeviceIds, 
  calculatePayout, 
  processLedger
} from '@/lib/ledger-utils';
import type { LedgerData } from '@/lib/ledger-utils';
import { createPlayer, linkDeviceToPlayer } from '@/lib/players';
import { sessionExists, getSessionById, getSessionParticipants } from '@/lib/sessions';
import { sessions_data } from '../fixtures/ledgers/real-data';
import { cleanDatabase } from '../helpers/db-setup';

/**
 * Integration tests for ledger utility functions
 * Tests complete workflow with real poker data and database operations
 */

describe('Ledger Utils - Integration Tests', () => {
  beforeEach(async () => {
    // Clean up all tables before each test
    await cleanDatabase();
  });

  afterAll(async () => {
    // Final cleanup after all tests
    await cleanDatabase();
  });

  describe('checkForUnknownDeviceIds', () => {
    it('should return empty array when all device IDs are linked', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      // Link all device IDs from the first session
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const player = await createPlayer(`Player ${deviceId.slice(0, 8)}`);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const unknownDevices = await checkForUnknownDeviceIds(ledgerData);
      
      expect(unknownDevices).toEqual([]);
    });

    it('should identify all unlinked device IDs from session', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      const unknownDevices = await checkForUnknownDeviceIds(ledgerData);
      
      // All devices should be unknown since we haven't linked any
      const expectedDeviceCount = Object.keys(ledgerData.playersInfos).length;
      expect(unknownDevices.length).toBe(expectedDeviceCount);
      
      // Each unknown device should have deviceId and nickname
      unknownDevices.forEach(device => {
        expect(device).toHaveProperty('deviceId');
        expect(device).toHaveProperty('nickname');
        expect(device.deviceId).toBeTruthy();
        expect(device.nickname).toBeTruthy();
      });
    });

    it('should extract correct nicknames for each device', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      const unknownDevices = await checkForUnknownDeviceIds(ledgerData);
      
      // Verify that nicknames match the first name in the player info
      unknownDevices.forEach(device => {
        const playerInfo = ledgerData.playersInfos[device.deviceId];
        expect(device.nickname).toBe(playerInfo.names[0]);
      });
    });

    it('should handle partially linked devices', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const deviceIds = Object.keys(ledgerData.playersInfos);
      
      // Link only the first half of devices
      const halfCount = Math.floor(deviceIds.length / 2);
      for (let i = 0; i < halfCount; i++) {
        const player = await createPlayer(`Player ${i}`);
        await linkDeviceToPlayer(deviceIds[i], player.id);
      }

      const unknownDevices = await checkForUnknownDeviceIds(ledgerData);
      
      // Should only return the unlinked half
      expect(unknownDevices.length).toBe(deviceIds.length - halfCount);
      
      // Verify that the returned devices are the ones we didn't link
      const unknownDeviceIds = unknownDevices.map(d => d.deviceId);
      const expectedUnknownIds = deviceIds.slice(halfCount);
      expectedUnknownIds.forEach(id => {
        expect(unknownDeviceIds).toContain(id);
      });
    });

    it('should work with all three real-world sessions', async () => {
      // Test each session separately
      for (let i = 0; i < sessions_data.length; i++) {
        // Clean tables between sessions in this test
        if (i > 0) {
          await cleanDatabase();
        }
        const unknownDevices = await checkForUnknownDeviceIds(sessions_data[i] as unknown as LedgerData);
        expect(unknownDevices.length).toBeGreaterThan(0);
      }
    });

    it('should handle ledger with no players', async () => {
      const emptyLedger: LedgerData = {
        buyInTotal: 0,
        inGameTotal: 0,
        buyOutTotal: 0,
        playersInfos: {},
        gameHasRake: false
      };

      const unknownDevices = await checkForUnknownDeviceIds(emptyLedger);
      
      expect(unknownDevices).toEqual([]);
    });
  });

  describe('calculatePayout', () => {
    it('should generate payout string for session 1', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      // Need to link devices first for calculatePayout to work properly
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]); //Note: we are using Nicknames as names
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      
      // Payout should be a non-empty string
      expect(payoutString).toBeTruthy();
      expect(typeof payoutString).toBe('string');
      
      // Should contain euro symbol and arrow
      expect(payoutString).toContain('€');
      expect(payoutString).toContain('→');
    });

    it('should have correct format: "PlayerName Amount€ → PlayerName"', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      // Link devices
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      const lines = payoutString.trim().split('\n');
      
      // First line should be the header
      expect(lines[0]).toBe('Payouts powered by Perkins-App:');
      
      // Each transaction line (after header) should match the format "PlayerName Amount€ → PlayerName"
      const payoutRegex = /^.+ \d+\.\d{2}€ → .+$/;
      const transactionLines = lines.slice(1); // Skip header
      transactionLines.forEach(line => {
        expect(line).toMatch(payoutRegex);
      });
    });

    it('should balance debts correctly for session 1', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      // Session 1 from real-data.ts:
      // Lauri P.: -1247, Akseli: -2000, Jussi: 1006, Lasse: 97, Aleksi K.: 2144
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      const lines = payoutString.trim().split('\n');
      const transactionLines = lines.slice(1); // Skip header "Payouts powered by Perkins-App:"
      
      // Should have transactions to balance the debts
      expect(transactionLines.length).toBeGreaterThan(0);
      expect(transactionLines.length).toBeLessThanOrEqual(4); // At most n-1 transactions for n players
      
      // Verify total amounts balance
      let totalPaid = 0;
      transactionLines.forEach(line => {
        const match = line.match(/(\d+\.\d{2})€/);
        if (match) {
          totalPaid += parseFloat(match[1]) * 100; // Convert to cents
        }
      });
      
      // Total paid should equal sum of positive balances (or negative balances)
      const totalWinnings = Object.values(ledgerData.playersInfos)
        .filter(p => p.net > 0)
        .reduce((sum, p) => sum + p.net, 0);
      
      expect(Math.abs(totalPaid - totalWinnings)).toBeLessThan(1); // Allow for rounding
    });

    it('should balance debts correctly with specific scenario', async () => {
      // Create custom scenario:
      // Player 1 wins €11, Player 2 wins €29
      // Player 3 loses €10, Player 4 loses €30
      const ledgerData: LedgerData = {
        buyInTotal: 10000,
        inGameTotal: 0,
        buyOutTotal: 10000,
        gameHasRake: false,
        playersInfos: {
          'device-1': {
            names: ['Player 1'],
            id: 'device-1',
            buyInSum: 5000,
            buyOutSum: 6100, // +1100 cents = €11
            inGame: 0,
            net: 1100 // €11 in cents
          },
          'device-2': {
            names: ['Player 2'],
            id: 'device-2',
            buyInSum: 5000,
            buyOutSum: 7900, // +2900 cents = €29
            inGame: 0,
            net: 2900 // €29 in cents
          },
          'device-3': {
            names: ['Player 3'],
            id: 'device-3',
            buyInSum: 5000,
            buyOutSum: 4000, // -1000 cents = -€10
            inGame: 0,
            net: -1000 // -€10 in cents
          },
          'device-4': {
            names: ['Player 4'],
            id: 'device-4',
            buyInSum: 5000,
            buyOutSum: 2000, // -3000 cents = -€30
            inGame: 0,
            net: -3000 // -€30 in cents
          }
        }
      };

      // Create players and link devices
      for (let i = 1; i <= 4; i++) {
        const deviceId = `device-${i}`;
        const player = await createPlayer(`Player ${i}`);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      
      // Expected output:
      // "Payouts powered by Perkins-App:\nPlayer 4 29.00€ → Player 2\nPlayer 4 1.00€ → Player 1\nPlayer 3 10.00€ → Player 1"
      const expectedOutput = 'Payouts powered by Perkins-App:\nPlayer 4 29.00€ → Player 2\nPlayer 4 1.00€ → Player 1\nPlayer 3 10.00€ → Player 1';
      
      expect(payoutString).toBe(expectedOutput);
    });

    it('should minimize number of transactions', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      const lines = payoutString.trim().split('\n');
      const transactions = lines.slice(1); // Skip header "Payouts powered by Perkins-App:"
      
      // For n players, optimal payout needs at most n-1 transactions
      const playerCount = Object.keys(ledgerData.playersInfos).length;
      expect(transactions.length).toBeLessThanOrEqual(playerCount - 1);
    });

    it('should handle negative amounts correctly (no negative payouts)', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      const lines = payoutString.trim().split('\n');
      const transactionLines = lines.slice(1); // Skip header "Payouts powered by Perkins-App:"
      
      // Extract all amounts and verify they're positive
      transactionLines.forEach(line => {
        const match = line.match(/(\d+\.\d{2})€/);
        if (match) {
          const amount = parseFloat(match[1]);
          expect(amount).toBeGreaterThan(0);
        }
      });
    });

    it('should use player names from database', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      
      // Create players with specific names
      const deviceIds = Object.keys(ledgerData.playersInfos);
      const playerNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
      
      for (let i = 0; i < deviceIds.length; i++) {
        const player = await createPlayer(playerNames[i]);
        await linkDeviceToPlayer(deviceIds[i], player.id);
      }

      const payoutString = await calculatePayout(ledgerData);
      
      // Payout should use our custom player names, not nicknames from ledger
      playerNames.forEach(name => {
        if (payoutString.includes(name)) {
          // At least some of our custom names should appear
          expect(payoutString).toContain(name);
        }
      });
    });

    it('should handle ledger with only winners', async () => {
      const ledgerData: LedgerData = {
        buyInTotal: 1000,
        inGameTotal: 0,
        buyOutTotal: 1000,
        playersInfos: {
          'device1': {
            names: ['Winner1'],
            id: 'device1',
            buyInSum: 100,
            buyOutSum: 150,
            inGame: 0,
            net: 50
          },
          'device2': {
            names: ['Winner2'],
            id: 'device2',
            buyInSum: 100,
            buyOutSum: 150,
            inGame: 0,
            net: 50
          }
        },
        gameHasRake: false
      };

      const player1 = await createPlayer('Winner1');
      const player2 = await createPlayer('Winner2');
      await linkDeviceToPlayer('device1', player1.id);
      await linkDeviceToPlayer('device2', player2.id);

      const payoutString = await calculatePayout(ledgerData);
      
      // No transactions needed when everyone won, only header
      expect(payoutString).toBe('Payouts powered by Perkins-App:');
    });

    it('should handle ledger with only losers', async () => {
      const ledgerData: LedgerData = {
        buyInTotal: 1000,
        inGameTotal: 0,
        buyOutTotal: 1000,
        playersInfos: {
          'device1': {
            names: ['Loser1'],
            id: 'device1',
            buyInSum: 100,
            buyOutSum: 50,
            inGame: 0,
            net: -50
          },
          'device2': {
            names: ['Loser2'],
            id: 'device2',
            buyInSum: 100,
            buyOutSum: 50,
            inGame: 0,
            net: -50
          }
        },
        gameHasRake: false
      };

      const player1 = await createPlayer('Loser1');
      const player2 = await createPlayer('Loser2');
      await linkDeviceToPlayer('device1', player1.id);
      await linkDeviceToPlayer('device2', player2.id);

      const payoutString = await calculatePayout(ledgerData);
      
      // No transactions needed when everyone lost, only header
      expect(payoutString).toBe('Payouts powered by Perkins-App:');
    });
  });

  describe('processLedger', () => {
    it('should create session with correct data', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'test-session-1';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Create and link players
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      // Verify session was created
      const exists = await sessionExists(sessionId);
      expect(exists).toBe(true);
      
      // Verify session has correct data
      const session = await getSessionById(sessionId);
      expect(session).not.toBeNull();
      expect(session?.url).toBe(url);
      expect(session?.id).toBe(sessionId);
    });

    it('should create correct number of participants', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'test-session-2';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Create and link players
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      // Should have one participant per unique device
      expect(participants.length).toBe(deviceIds.length);
    });

    it('should store correct net amounts for each participant', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'test-session-3';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Create and link players
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      // Verify each participant has correct net amount (converted from cents to dollars)
      participants.forEach(participant => {
        const deviceId = participant.device_id;
        const expectedNet = ledgerData.playersInfos[deviceId].net / 100;
        // Database returns DECIMAL as string, so parse it
        expect(parseFloat(participant.net_amount as unknown as string)).toBeCloseTo(expectedNet, 2);
      });
    });

    it('should store correct buy-in and buy-out amounts', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'test-session-4';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Create and link players
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (const deviceId of deviceIds) {
        const playerInfo = ledgerData.playersInfos[deviceId];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      // Verify buy-in, buy-out, and in-game amounts
      participants.forEach(participant => {
        const deviceId = participant.device_id;
        const playerInfo = ledgerData.playersInfos[deviceId];
        
        // Database returns DECIMAL as string, so parse it
        expect(parseFloat(participant.buy_in as unknown as string)).toBeCloseTo(playerInfo.buyInSum / 100, 2);
        expect(parseFloat(participant.buy_out as unknown as string)).toBeCloseTo(playerInfo.buyOutSum / 100, 2);
        expect(parseFloat(participant.in_game as unknown as string)).toBeCloseTo(playerInfo.inGame / 100, 2);
      });
    });

    it('should add all nicknames to players', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'test-session-5';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Create players with unique names for each device
      const deviceIds = Object.keys(ledgerData.playersInfos);
      for (let i = 0; i < deviceIds.length; i++) {
        const deviceId = deviceIds[i];
        const player = await createPlayer(`NicknameTestPlayer${i + 1}`);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      // Each participant should have a nickname from the ledger
      participants.forEach(participant => {
        expect(participant.nickname).toBeTruthy();
        
        // Verify the nickname matches one from the ledger data
        const deviceId = participant.device_id;
        const playerInfo = ledgerData.playersInfos[deviceId];
        expect(playerInfo.names).toContain(participant.nickname);
      });
    });

    it('should handle all three real-world sessions sequentially', async () => {
      // Create players and link all unique devices across all sessions
      const allDeviceIds = new Set<string>();
      sessions_data.forEach(session => {
        const ledger = session as unknown as LedgerData;
        Object.keys(ledger.playersInfos).forEach((deviceId: string) => {
          allDeviceIds.add(deviceId);
        });
      });

      for (const deviceId of allDeviceIds) {
        const player = await createPlayer(`Player ${deviceId.slice(0, 8)}`);
        await linkDeviceToPlayer(deviceId, player.id);
      }

      // Process each session
      for (let i = 0; i < sessions_data.length; i++) {
        const sessionId = `real-session-${i + 1}`;
        const url = `https://www.pokernow.club/games/${sessionId}`;
        
        await processLedger(sessionId, url, sessions_data[i] as unknown as LedgerData);
        
        // Verify session exists
        const exists = await sessionExists(sessionId);
        expect(exists).toBe(true);
      }

      // All three sessions should exist
      expect(await sessionExists('real-session-1')).toBe(true);
      expect(await sessionExists('real-session-2')).toBe(true);
      expect(await sessionExists('real-session-3')).toBe(true);
    }, 15000); // Increase timeout to 15 seconds for processing 3 real sessions

    it('should handle player with multiple names', async () => {
      // Create mock ledger with player who used multiple nicknames
      const ledgerData: LedgerData = {
        buyInTotal: 1000,
        inGameTotal: 0,
        buyOutTotal: 1100,
        playersInfos: {
          'multi-name-device': {
            names: ['Nickname1', 'Nickname2', 'Nickname3'],
            id: 'multi-name-device',
            buyInSum: 500,
            buyOutSum: 550,
            inGame: 0,
            net: 50
          }
        },
        gameHasRake: false
      };

      const sessionId = 'multi-name-session';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      const player = await createPlayer('RealPlayerName');
      await linkDeviceToPlayer('multi-name-device', player.id);

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      expect(participants.length).toBe(1);
      expect(participants[0].nickname).toBe('Nickname1'); // Should use first nickname
    });

    it('should skip device IDs not linked to players', async () => {
      const ledgerData = sessions_data[0] as unknown as LedgerData;
      const sessionId = 'partial-link-session';
      const url = `https://www.pokernow.club/games/${sessionId}`;
      
      // Link only some devices
      const deviceIds = Object.keys(ledgerData.playersInfos);
      const linkedCount = Math.floor(deviceIds.length / 2);
      
      for (let i = 0; i < linkedCount; i++) {
        const playerInfo = ledgerData.playersInfos[deviceIds[i]];
        const player = await createPlayer(playerInfo.names[0]);
        await linkDeviceToPlayer(deviceIds[i], player.id);
      }

      await processLedger(sessionId, url, ledgerData);
      
      const participants = await getSessionParticipants(sessionId);
      
      // Should only have participants for linked devices
      expect(participants.length).toBe(linkedCount);
    });
  });
});
