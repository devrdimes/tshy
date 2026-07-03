import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or request body
    const authHeader = request.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token || null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 400 }
      );
    }

    // Delete session from database
    await db.session.deleteMany({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Signout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
