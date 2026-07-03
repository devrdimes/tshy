import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/business/[id]/generate-plan — AI generates comprehensive business plan steps
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: { planSteps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Build context for AI
    const businessContext = `
Business Name: ${business.name}
Description: ${business.description}
Industry: ${business.industry}
Current Stage: ${business.stage}
Target Market: ${business.targetMarket}
Revenue Model: ${business.revenueModel}
Initial Capital: $${business.initialCapital}
Monthly Burn Rate: $${business.monthlyBurnRate}
    `.trim();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are PlanWise AI, an elite business planning expert and strategist. You generate comprehensive, actionable business plan steps for entrepreneurs. You must respond ONLY with valid JSON — no markdown, no explanations outside the JSON structure.

Generate exactly 10 business plan steps for the business described below. Each step must be detailed with practical, actionable guidance.

The 10 steps must cover these categories in order:
1. Market Research — Analyze market, competitors, trends
2. Value Proposition — Define unique value and differentiation
3. Business Model — Design revenue model and cost structure
4. Financial Planning — Create projections, budgets, funding strategy
5. Legal Setup — Register business, protect IP, compliance
6. Product Development — Build MVP, iterate, validate
7. Marketing Strategy — Brand, channels, customer acquisition
8. Operations — Infrastructure, processes, tools
9. Team Building — Hire, culture, organizational structure
10. Launch Strategy — Go-to-market, launch execution, growth

Return a JSON object with a "steps" array. Each step object must have:
{
  "stepNumber": number (1-10),
  "title": string,
  "description": string (2-3 sentences explaining what this step involves),
  "category": string (one of: research, strategy, financial, legal, product, marketing, operations, team),
  "guidance": string (detailed guidance paragraph, 3-5 sentences with specific actions),
  "aiTips": string (expert AI tip, 2-3 sentences with insider advice),
  "checklist": array of strings (5-7 specific checklist items),
  "resources": array of strings (3-5 recommended resources, tools, or references),
  "estimatedDays": number (realistic estimate based on the business type)
}

IMPORTANT: Tailor every step specifically to the business's industry, stage, and context. Generic advice is unacceptable. Return ONLY the JSON object, no other text.`,
        },
        {
          role: 'user',
          content: `Generate a comprehensive 10-step business plan for:\n\n${businessContext}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate plan' },
        { status: 500 }
      );
    }

    // Parse AI response
    let parsedSteps;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      parsedSteps = parsed.steps || parsed;
    } catch {
      console.error('[generate-plan] Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated plan' },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedSteps) || parsedSteps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'AI generated invalid plan structure' },
        { status: 500 }
      );
    }

    // Delete existing plan steps
    await db.planStep.deleteMany({ where: { businessId } });

    // Create new plan steps from AI output
    const stepData = parsedSteps.map((step: Record<string, unknown>, index: number) => ({
      businessId,
      stepNumber: step.stepNumber || index + 1,
      title: String(step.title || `Step ${index + 1}`),
      description: String(step.description || ''),
      category: String(step.category || ''),
      status: index === 0 ? 'current' : 'locked',
      guidance: String(step.guidance || ''),
      aiTips: String(step.aiTips || ''),
      checklist: JSON.stringify(step.checklist || []),
      resources: JSON.stringify(step.resources || []),
      estimatedDays: Number(step.estimatedDays) || 7,
    }));

    await db.planStep.createMany({ data: stepData });

    // Update business totalSteps
    await db.business.update({
      where: { id: businessId },
      data: { totalSteps: stepData.length, currentStep: 1, completed: false },
    });

    const newSteps = await db.planStep.findMany({
      where: { businessId },
      orderBy: { stepNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { steps: newSteps, generatedBy: 'ai' },
    });
  } catch (error) {
    console.error('[POST /api/business/[id]/generate-plan]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate business plan' },
      { status: 500 }
    );
  }
}
