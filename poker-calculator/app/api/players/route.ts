import { NextRequest, NextResponse } from 'next/server';
import { createPlayer, getAllPlayers, getPlayerByName } from '@/lib/players';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName || typeof playerName !== 'string') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const trimmedName = playerName.trim();
    
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Player name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check if player with this name already exists
    const existingPlayer = await getPlayerByName(trimmedName);
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'A player with this name already exists' },
        { status: 409 }
      );
    }

    // Create the player with empty arrays for nicknames and device_ids, 0 net_winnings, and 0 sessions
    const player = await createPlayer(trimmedName, [], [], 0, 0);

    return NextResponse.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const players = await getAllPlayers();
    
    return NextResponse.json({
      success: true,
      players
    });
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
