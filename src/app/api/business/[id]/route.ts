import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/business/[id] — Get single business with all plan steps
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const business = await db.business.findUnique({
      where: { id },
      include: {
        planSteps: { orderBy: { stepNumber: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        financials: { orderBy: { createdAt: 'desc' } },
        tasks: {
          include: { planStep: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: business });
  } catch (error) {
    console.error('[GET /api/business/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get business' },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id] — Update business
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'name', 'description', 'industry', 'stage', 'targetMarket',
      'revenueModel', 'initialCapital', 'monthlyBurnRate',
      'currentStep', 'totalSteps', 'completed', 'logoUrl',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.business.update({
      where: { id },
      data: updateData,
      include: { planSteps: { orderBy: { stepNumber: 'asc' } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /api/business/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id] — Delete business
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    await db.business.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: 'Business deleted successfully' },
    });
  } catch (error) {
    console.error('[DELETE /api/business/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
