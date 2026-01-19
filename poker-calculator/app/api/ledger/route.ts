import { NextRequest, NextResponse } from 'next/server';
import { getPlayerByDeviceId, getAllPlayers, incrementSessions, updateNetWinnings, addNicknameToPlayer } from '@/lib/players';
import { sessionExists, createSession } from '@/lib/sessions';

// Disable SSL verification for development (remove in production)
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

interface PlayerInfo {
  names: string[];
  id: string;
  buyInSum: number;
  buyOutSum: number;
  inGame: number;
  net: number;
}

interface LedgerData {
  buyInTotal: number;
  inGameTotal: number;
  buyOutTotal: number;
  playersInfos: {
    [deviceId: string]: PlayerInfo;
  };
  gameHasRake: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract session ID from URL
    // Example: https://www.pokernow.com/games/pglE6yPrNG3_Qa0uezzmHkFR9
    const sessionId = url.split('/games/')[1]?.replace(/\/$/, '');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Invalid URL format - could not extract session ID' },
        { status: 400 }
      );
    }

    // Check if session already exists
    const alreadyProcessed = await sessionExists(sessionId);
    if (alreadyProcessed) {
      return NextResponse.json(
        { error: 'This ledger has already been processed' },
        { status: 409 }
      );
    }

    // Append /player-sessions to the URL
    const apiUrl = `${url}/players_sessions`;
    // Make GET request to PokerNow API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ledger data: ${response.statusText}`);
    }

    // Parse the ledger data
    const ledgerData: LedgerData = await response.json();

    // Check for unknown device IDs
    const unknownDeviceIds = await checkForUnknownDeviceIds(ledgerData);

    if (unknownDeviceIds.length > 0) {
      // Get all existing players for the dropdown
      const allPlayers = await getAllPlayers();
      
      return NextResponse.json({
        success: false,
        requiresLinking: true,
        unknownDeviceIds: unknownDeviceIds,
        existingPlayers: allPlayers.map(p => ({
          id: p.id,
          name: p.player_name
        })),
        message: 'Some device IDs need to be linked to players'
      });
    }

    // All device IDs are known, process the ledger
    await processLedger(sessionId, ledgerData);

    // Calculate and format payout string
    const payoutString = await calculatePayout(ledgerData);

    return NextResponse.json({
      success: true,
      message: 'Ledger processed successfully',
      sessionId: sessionId,
      payout: payoutString
    });
  } catch (error) {
    console.error('Ledger processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process ledger' },
      { status: 500 }
    );
  }
}

async function checkForUnknownDeviceIds(ledgerData: LedgerData) {
  const unknownDeviceIds = [];
  
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

async function processLedger(sessionId: string, ledgerData: LedgerData) {
  // Step 1: Add the session to the database
  await createSession(sessionId);

  // Track which players have already been counted (to avoid counting same player multiple times)
  const processedPlayerIds = new Set<number>();

  // Step 2, 3, 4: Process each device ID in the ledger
  for (const [deviceId, playerInfo] of Object.entries(ledgerData.playersInfos)) {
    // Get the player associated with this device ID
    const player = await getPlayerByDeviceId(deviceId);
    
    if (!player) {
      // This shouldn't happen since we already checked, but handle it gracefully
      console.error(`Device ID ${deviceId} not found in database during processing`);
      continue;
    }

    // Step 2: Increment sessions count (only once per player, even if they have multiple device IDs)
    if (!processedPlayerIds.has(player.id)) {
      await incrementSessions(player.id);
      processedPlayerIds.add(player.id);
    }

    // Step 3: Update net winnings
    // The 'net' field is in cents, so we need to convert to dollars
    const netAmount = playerInfo.net / 100;
    await updateNetWinnings(player.id, netAmount);

    // Step 4: Add all nicknames used in this session
    for (const nickname of playerInfo.names) {
      // Check if nickname already exists for this player
      if (!player.nicknames.includes(nickname)) {
        await addNicknameToPlayer(player.id, nickname);
      }
    }
  }
}

async function calculatePayout(ledgerData: LedgerData): Promise<string> {
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
