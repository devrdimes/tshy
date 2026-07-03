import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tasks — Get all tasks for user (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const planStepId = searchParams.get('planStepId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = { userId: user.id };
    if (businessId) where.businessId = businessId;
    if (planStepId) where.planStepId = planStepId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await db.task.findMany({
      where,
      include: {
        business: { select: { id: true, name: true } },
        planStep: { select: { id: true, title: true, stepNumber: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Summary stats
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        summary: { pending, inProgress, completed, overdue, total: tasks.length },
      },
    });
  } catch (error) {
    console.error('[GET /api/tasks]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks — Create task
export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      businessId,
      planStepId,
      priority,
      status,
      dueDate,
      reminderAt,
      aiGenerated,
      aiSuggestion,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        userId: user.id,
        title,
        description: description || '',
        businessId: businessId || null,
        planStepId: planStepId || null,
        priority: priority || 'medium',
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        aiGenerated: aiGenerated || false,
        aiSuggestion: aiSuggestion || '',
      },
      include: {
        business: { select: { id: true, name: true } },
        planStep: { select: { id: true, title: true, stepNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
