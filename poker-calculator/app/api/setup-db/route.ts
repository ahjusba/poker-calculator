import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/setup-db';
import { headers } from 'next/headers';

export async function GET() {
  // Only allow calls from localhost
  const headersList = await headers();
  const host = headersList.get('host');
  
  if (!host || (!host.startsWith('localhost') && !host.startsWith('127.0.0.1'))) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Forbidden: This endpoint can only be accessed from localhost'
      },
      { status: 403 }
    );
  }

  try {
    await setupDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully. All tables created and players initialized.'
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
