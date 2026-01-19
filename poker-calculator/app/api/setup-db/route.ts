import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/setup-db';

export async function GET() {
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
