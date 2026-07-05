import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';

// GET /api/notifications — Get notifications for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read');
    const dismissed = searchParams.get('dismissed');
    const type = searchParams.get('type');

    const where: any = { userId: user.id };

    // Default: exclude dismissed notifications unless explicitly requested
    if (dismissed !== null && dismissed !== undefined) {
      where.dismissed = dismissed === 'true';
    } else {
      where.dismissed = false;
    }

    if (read !== null && read !== undefined) {
      where.read = read === 'true';
    }
    if (type) {
      where.type = type;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false, dismissed: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications — Mark notification as read or mark all as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all as read
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true, sentAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        data: { message: 'All notifications marked as read' },
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId is required (or set markAll: true)' },
        { status: 400 }
      );
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { read: true, sentAt: new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /api/notifications]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications — Dismiss notification
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { dismissed: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Notification dismissed' },
    });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to dismiss notification' },
      { status: 500 }
    );
  }
}
