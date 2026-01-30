import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { linkDeviceToPlayer } from '@/lib/players';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { links } = body;

    if (!links || !Array.isArray(links)) {
      return NextResponse.json(
        { error: 'Links array is required' },
        { status: 400 }
      );
    }

    // Link each device ID to the selected player
    for (const link of links) {
      const { deviceId, playerId } = link;
      
      if (!deviceId || !playerId) {
        return NextResponse.json(
          { error: 'Each link must have deviceId and playerId' },
          { status: 400 }
        );
      }

      await linkDeviceToPlayer(deviceId, playerId);
    }

    // Revalidate the leaderboard page since device linking may affect future ledger submissions
    revalidatePath('/leaderboard');

    return NextResponse.json({
      success: true,
      message: 'Device IDs linked successfully'
    });
  } catch (error) {
    console.error('Failed to link device IDs:', error);
    return NextResponse.json(
      { error: 'Failed to link device IDs' },
      { status: 500 }
    );
  }
}
