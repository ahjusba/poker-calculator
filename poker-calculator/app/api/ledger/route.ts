import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sessionExists } from '@/lib/sessions';
import { 
  extractSessionId, 
  checkForUnknownDeviceIds, 
  processLedger, 
  calculatePayout,
  type LedgerData 
} from '@/lib/ledger-utils';

// Disable SSL verification for development (remove in production)
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
    const sessionId = extractSessionId(url);
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
      // Return unknown device IDs - player list is pre-loaded on the client via SSR
      return NextResponse.json({
        success: false,
        requiresLinking: true,
        unknownDeviceIds: unknownDeviceIds,
        message: 'Some device IDs need to be linked to players'
      });
    }

    // All device IDs are known, process the ledger
    await processLedger(sessionId, url, ledgerData);

    // Calculate and format payout string
    const payoutString = await calculatePayout(ledgerData);

    // Revalidate the leaderboard page to show updated data
    revalidatePath('/leaderboard');

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
