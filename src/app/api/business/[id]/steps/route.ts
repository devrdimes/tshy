import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/business/[id]/steps — Get all plan steps for a business
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

    const steps = await db.planStep.findMany({
      where: { businessId },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { stepNumber: 'asc' },
    });

    return NextResponse.json({ success: true, data: steps });
  } catch (error) {
    console.error('[GET /api/business/[id]/steps]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get plan steps' },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/steps — Update a step status
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;
    const body = await request.json();
    const { stepId, status, checklist } = body;

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'stepId is required' },
        { status: 400 }
      );
    }

    const step = await db.planStep.findFirst({
      where: { id: stepId, businessId },
    });

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Plan step not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;

      // Auto-set timestamps based on status
      if (status === 'in_progress' || status === 'current') {
        updateData.startedAt = step.startedAt || new Date();
      }
      if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.startedAt = step.startedAt || new Date();
      }
    }
    if (checklist !== undefined) {
      updateData.checklist = typeof checklist === 'string' ? checklist : JSON.stringify(checklist);
    }

    const updated = await db.planStep.update({
      where: { id: stepId },
      data: updateData,
    });

    // If step is completed, unlock the next step and update business currentStep
    if (status === 'completed') {
      const nextStep = await db.planStep.findFirst({
        where: { businessId, stepNumber: step.stepNumber + 1 },
      });

      if (nextStep && nextStep.status === 'locked') {
        await db.planStep.update({
          where: { id: nextStep.id },
          data: { status: 'current' },
        });
      }

      // Update business currentStep
      const totalSteps = await db.planStep.count({ where: { businessId } });
      const completedCount = await db.planStep.count({
        where: { businessId, status: 'completed' },
      });

      if (completedCount >= totalSteps) {
        await db.business.update({
          where: { id: businessId },
          data: { completed: true, currentStep: totalSteps },
        });
      } else {
        await db.business.update({
          where: { id: businessId },
          data: { currentStep: step.stepNumber + 1 },
        });
      }
    }

    // Re-fetch with updated state
    const allSteps = await db.planStep.findMany({
      where: { businessId },
      orderBy: { stepNumber: 'asc' },
    });

    return NextResponse.json({ success: true, data: { updated, allSteps } });
  } catch (error) {
    console.error('[PUT /api/business/[id]/steps]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plan step' },
      { status: 500 }
    );
  }
}
