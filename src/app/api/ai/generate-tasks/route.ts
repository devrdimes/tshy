import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/ai/generate-tasks — AI generates suggested tasks for a plan step
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, stepId } = body;

    if (!businessId || !stepId) {
      return NextResponse.json(
        { success: false, error: 'businessId and stepId are required' },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
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

    // Get existing tasks for context
    const existingTasks = await db.task.findMany({
      where: { businessId, planStepId: stepId, status: { not: 'cancelled' } },
      select: { title: true, status: true },
    });

    const businessContext = `
Business: ${business.name}
Industry: ${business.industry}
Stage: ${business.stage}
Revenue Model: ${business.revenueModel}
Target Market: ${business.targetMarket}
    `.trim();

    const stepContext = `
Step: ${step.title} (Step ${step.stepNumber})
Description: ${step.description}
Category: ${step.category}
Guidance: ${step.guidance}
AI Tips: ${step.aiTips}
Checklist: ${step.checklist}
    `.trim();

    const existingTasksStr = existingTasks.length > 0
      ? `Existing tasks for this step: ${existingTasks.map((t) => `"${t.title}" (${t.status})`).join(', ')}`
      : 'No existing tasks for this step yet.';

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are PlanWise AI, an elite business planning expert. Generate 3-5 highly actionable, specific tasks for the given business plan step. 

Each task should be:
- Specific and measurable (not vague)
- Directly relevant to the step and business context
- Achievable within a realistic timeframe
- Ordered by priority (most important first)

Return ONLY a JSON object with a "tasks" array. Each task must have:
{
  "title": string (concise task name, 5-10 words),
  "description": string (1-2 sentences explaining what to do and why),
  "priority": string ("urgent", "high", "medium", or "low"),
  "estimatedMinutes": number (estimated time to complete in minutes),
  "aiSuggestion": string (a specific tip or resource for completing this task)
}

Do NOT duplicate or overlap with existing tasks. Be creative and specific to this business's context. Return ONLY the JSON object.`,
        },
        {
          role: 'user',
          content: `Generate 3-5 actionable tasks for this plan step:\n\n${businessContext}\n\n${stepContext}\n\n${existingTasksStr}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate tasks' },
        { status: 500 }
      );
    }

    let suggestions;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      suggestions = parsed.tasks || parsed;
    } catch {
      console.error('[generate-tasks] Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        stepId,
        businessId,
        generatedBy: 'ai',
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/generate-tasks]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate task suggestions' },
      { status: 500 }
    );
  }
}
