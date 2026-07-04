import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/notifications/generate — AI generates smart notifications/reminders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, businessId } = body;

    if (!userId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'userId and businessId are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        planSteps: { orderBy: { stepNumber: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        tasks: {
          where: { status: { in: ['pending', 'in_progress'] } },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Gather data for notification generation
    const overdueTasks = business.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    );

    const upcomingMilestones = business.milestones.filter(
      (m) => m.targetDate &&
        new Date(m.targetDate) > now &&
        new Date(m.targetDate) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) &&
        m.status !== 'achieved'
    );

    const incompleteSteps = business.planSteps.filter(
      (s) => s.status === 'current' || s.status === 'in_progress'
    );

    const missedMilestones = business.milestones.filter(
      (m) => m.targetDate && new Date(m.targetDate) < now && m.status !== 'achieved'
    );

    // Build context for AI
    const contextStr = `
Business: ${business.name} (${business.industry}, ${business.stage} stage)
Current Step: ${business.currentStep}/${business.totalSteps}

Overdue Tasks (${overdueTasks.length}): ${overdueTasks.map((t) => `"${t.title}" (due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}, priority: ${t.priority})`).join(', ') || 'None'}

Upcoming Milestones (next 7 days) (${upcomingMilestones.length}): ${upcomingMilestones.map((m) => `"${m.title}" (target: ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'TBD'})`).join(', ') || 'None'}

Incomplete Steps (${incompleteSteps.length}): ${incompleteSteps.map((s) => `"${s.title}" (status: ${s.status})`).join(', ') || 'None'}

Missed Milestones (${missedMilestones.length}): ${missedMilestones.map((m) => `"${m.title}" (was due: ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'N/A'})`).join(', ') || 'None'}
    `.trim();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are Tashyeed's smart notification engine. Generate helpful, contextual notifications for a business owner based on their current situation.

Create 2-5 notifications based on the data below. Each notification should be:
- Actionable and specific (not generic)
- Appropriate urgency level for the situation
- Encouraging but honest about deadlines and risks
- Written in a friendly, professional tone

Return ONLY a JSON object with a "notifications" array. Each notification must have:
{
  "type": string (one of: "info", "warning", "success", "urgent", "advisor_tip", "step_reminder", "milestone"),
  "title": string (short, attention-grabbing title),
  "message": string (2-3 sentence detailed message with specific action to take),
  "actionUrl": string (suggested URL path, e.g., "/dashboard", "/business/{id}/steps", "/business/{id}/milestones")
}

Prioritize the most urgent items first. Return ONLY the JSON object.`,
        },
        {
          role: 'user',
          content: `Generate smart notifications for this business:\n\n${contextStr}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate notifications' },
        { status: 500 }
      );
    }

    let notificationsData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      notificationsData = parsed.notifications || parsed;
    } catch {
      console.error('[notifications/generate] Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated notifications' },
        { status: 500 }
      );
    }

    // Save notifications to DB
    const savedNotifications = [];
    for (const notif of notificationsData as Record<string, unknown>[]) {
      const saved = await db.notification.create({
        data: {
          userId,
          type: String(notif.type || 'info'),
          title: String(notif.title || 'Notification'),
          message: String(notif.message || ''),
          actionUrl: String(notif.actionUrl || ''),
          read: false,
          dismissed: false,
          sentAt: new Date(),
        },
      });
      savedNotifications.push(saved);
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: savedNotifications,
        generatedBy: 'ai',
        context: {
          overdueTasks: overdueTasks.length,
          upcomingMilestones: upcomingMilestones.length,
          incompleteSteps: incompleteSteps.length,
          missedMilestones: missedMilestones.length,
        },
      },
    });
  } catch (error) {
    console.error('[POST /api/notifications/generate]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate notifications' },
      { status: 500 }
    );
  }
}
