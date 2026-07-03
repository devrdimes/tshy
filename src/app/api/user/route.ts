import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/user — Get user info (create default if not exists)
export async function GET() {
  try {
    let user = await db.user.findFirst();

    if (!user) {
      user = await db.user.create({
        data: {
          name: 'Entrepreneur',
          email: 'user@planwise.ai',
          role: 'CEO',
          company: '',
          avatar: '',
          onboarded: false,
        },
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('[GET /api/user]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// PUT /api/user — Update user info
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, role, avatar, onboarded } = body;

    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          name: 'Entrepreneur',
          email: 'user@planwise.ai',
        },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (role !== undefined) updateData.role = role;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (onboarded !== undefined) updateData.onboarded = onboarded;

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /api/user]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
