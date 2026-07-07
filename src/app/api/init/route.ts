import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

// POST /api/init — No-op: each user starts with a clean state.
// Demo data injection has been removed. New users go through the onboarding flow
// and create their own business from scratch.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'User session confirmed',
        userId: user.id,
        businessId: null,
        summary: {},
      },
    });
  } catch (error) {
    console.error('[POST /api/init]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize' },
      { status: 500 }
    );
  }
}
