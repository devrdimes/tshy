import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/business/[id]/milestones — Get milestones for business
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const milestones = await db.milestone.findMany({
      where: { businessId },
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
    });

    // Compute summary stats
    const achieved = milestones.filter((m) => m.status === 'achieved').length;
    const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
    const upcoming = milestones.filter((m) => m.status === 'upcoming').length;
    const missed = milestones.filter((m) => m.status === 'missed').length;

    return NextResponse.json({
      success: true,
      data: {
        milestones,
        summary: { achieved, inProgress, upcoming, missed, total: milestones.length },
      },
    });
  } catch (error) {
    console.error('[GET /api/business/[id]/milestones]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get milestones' },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/milestones — Create milestone
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      targetDate,
      category,
      metric,
      targetValue,
      currentValue,
      status,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Milestone title is required' },
        { status: 400 }
      );
    }

    const milestone = await db.milestone.create({
      data: {
        businessId,
        title,
        description: description || '',
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || '',
        metric: metric || '',
        targetValue: targetValue || 0,
        currentValue: currentValue || 0,
        status: status || 'upcoming',
      },
    });

    return NextResponse.json({ success: true, data: milestone }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/business/[id]/milestones]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/milestones — Update milestone status/currentValue
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;
    const body = await request.json();
    const { milestoneId, status, currentValue, targetDate, title, description } = body;

    if (!milestoneId) {
      return NextResponse.json(
        { success: false, error: 'milestoneId is required' },
        { status: 400 }
      );
    }

    const milestone = await db.milestone.findFirst({
      where: { id: milestoneId, businessId },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'achieved') {
        updateData.achievedDate = new Date();
      }
    }
    if (currentValue !== undefined) updateData.currentValue = currentValue;
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const updated = await db.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /api/business/[id]/milestones]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
