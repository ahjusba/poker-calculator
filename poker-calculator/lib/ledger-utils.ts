import { getPlayerByDeviceId, addNicknameToPlayer } from '@/lib/players';
import { createSession, createSessionParticipant } from '@/lib/sessions';

export interface PlayerInfo {
  names: string[];
  id: string;
  buyInSum: number;
  buyOutSum: number;
  inGame: number;
  net: number;
}

export interface LedgerData {
  buyInTotal: number;
  inGameTotal: number;
  buyOutTotal: number;
  playersInfos: {
    [deviceId: string]: PlayerInfo;
  };
  gameHasRake: boolean;
}

export interface UnknownDeviceInfo {
  deviceId: string;
  nickname: string;
}

/**
 * Extracts session ID from a PokerNow URL
 * @param url - The PokerNow game URL
 * @returns The session ID or null if invalid
 */
export function extractSessionId(url: string): string | null {
  const parts = url.split('/games/')[1];
  if (!parts) return null;
  
  // Remove trailing slash and query parameters
  const sessionId = parts.replace(/\/$/, '').split('?')[0];
  return sessionId || null;
}

/**
 * Checks for device IDs that are not linked to any player
 * @param ledgerData - The ledger data from PokerNow API
 * @returns Array of unknown device IDs with their nicknames
 */
export async function checkForUnknownDeviceIds(ledgerData: LedgerData): Promise<UnknownDeviceInfo[]> {
  const unknownDeviceIds: UnknownDeviceInfo[] = [];
  
  for (const [deviceId, playerInfo] of Object.entries(ledgerData.playersInfos)) {
    // Check if this device ID exists in the database
    const player = await getPlayerByDeviceId(deviceId);
    
    if (!player) {
      // This device ID is not linked to any player
      const nickname = playerInfo.names[0] || 'Unknown';
      unknownDeviceIds.push({
        deviceId: deviceId,
        nickname: nickname
      });
    }
  }
  
  return unknownDeviceIds;
}

/**
 * Processes ledger data and creates session and participant records
 * @param sessionId - The unique session identifier
 * @param url - The original PokerNow URL
 * @param ledgerData - The ledger data from PokerNow API
 */
export async function processLedger(sessionId: string, url: string, ledgerData: LedgerData): Promise<void> {
  // Step 1: Create the session with full ledger data
  await createSession(sessionId, url, ledgerData);

  // Step 2-4: Process each device ID and create session participants
  for (const [deviceId, playerInfo] of Object.entries(ledgerData.playersInfos)) {
    // Get the player associated with this device ID
    const player = await getPlayerByDeviceId(deviceId);
    
    if (!player) {
      // This shouldn't happen since we already checked, but handle it gracefully
      console.error(`Device ID ${deviceId} not found in database during processing`);
      continue;
    }

    // Create session participant record
    const nickname = playerInfo.names[0] || 'Unknown';
    await createSessionParticipant(
      sessionId,
      deviceId,
      player.id,
      nickname,
      playerInfo.net / 100, // Convert cents to dollars
      playerInfo.buyInSum / 100,
      playerInfo.buyOutSum / 100,
      playerInfo.inGame / 100
    );

    // Add all nicknames used in this session
    for (const nick of playerInfo.names) {
      await addNicknameToPlayer(player.id, nick);
    }
  }
}

/**
 * Calculates optimal payout transactions to settle debts
 * @param ledgerData - The ledger data from PokerNow API
 * @returns Formatted payout string with transactions
 */
export async function calculatePayout(ledgerData: LedgerData): Promise<string> {
  // Create array of players with their net amounts and names
  interface PlayerBalance {
    name: string;
    net: number; // in cents
  }

  const playerBalances: PlayerBalance[] = [];

  for (const [deviceId, playerInfo] of Object.entries(ledgerData.playersInfos)) {
    // Get the actual player name from the database
    const player = await getPlayerByDeviceId(deviceId);
    
    // Use the actual player name, fallback to nickname if player not found
    const name = player ? player.player_name : (playerInfo.names[0] || 'Unknown');
    
    playerBalances.push({
      name: name,
      net: playerInfo.net
    });
  }

  // Separate into losers (negative net) and winners (positive net)
  const losers = playerBalances
    .filter(p => p.net < 0)
    .map(p => ({ name: p.name, amount: -p.net })) // Convert to positive debt amount
    .sort((a, b) => b.amount - a.amount); // Sort by largest debt first

  const winners = playerBalances
    .filter(p => p.net > 0)
    .map(p => ({ name: p.name, amount: p.net }))
    .sort((a, b) => b.amount - a.amount); // Sort by largest win first

  // Calculate transactions
  const transactions: string[] = [];
  transactions.push('Payouts powered by Perkins-App:');

  // Create copies to work with
  const losersCopy = losers.map(l => ({ ...l }));
  const winnersCopy = winners.map(w => ({ ...w }));

  let loserIndex = 0;
  let winnerIndex = 0;

  while (loserIndex < losersCopy.length && winnerIndex < winnersCopy.length) {
    const loser = losersCopy[loserIndex];
    const winner = winnersCopy[winnerIndex];

    // Calculate how much can be paid
    const paymentAmount = Math.min(loser.amount, winner.amount);

    // Convert from cents to euros and format
    const paymentEuros = (paymentAmount / 100).toFixed(2);

    // Add transaction
    transactions.push(`${loser.name} ${paymentEuros}€ → ${winner.name}`);

    // Update balances
    loser.amount -= paymentAmount;
    winner.amount -= paymentAmount;

    // Move to next loser or winner if current one is settled
    if (loser.amount === 0) {
      loserIndex++;
    }
    if (winner.amount === 0) {
      winnerIndex++;
    }
  }

  // Join transactions with newline
  return transactions.join('\n');
}
