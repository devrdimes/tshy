import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/ai — Chat with AI business advisor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, businessId, stepId } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    // Build context from business info and current step
    let businessContext = '';
    let stepContext = '';

    if (businessId) {
      const business = await db.business.findUnique({
        where: { id: businessId },
        include: {
          planSteps: { orderBy: { stepNumber: 'asc' } },
          milestones: { where: { status: { in: ['upcoming', 'in_progress'] } } },
          financials: { where: { projection: false }, orderBy: { createdAt: 'desc' }, take: 3 },
        },
      });

      if (business) {
        const completedSteps = business.planSteps.filter((s) => s.status === 'completed').length;
        const currentStepData = business.planSteps.find((s) => s.status === 'current' || s.status === 'in_progress');

        businessContext = `
Business: ${business.name}
Description: ${business.description}
Industry: ${business.industry}
Stage: ${business.stage}
Target Market: ${business.targetMarket}
Revenue Model: ${business.revenueModel}
Initial Capital: $${business.initialCapital}
Monthly Burn Rate: $${business.monthlyBurnRate}
Progress: ${completedSteps}/${business.planSteps.length} steps completed
Current Step: ${currentStepData ? currentStepData.title : 'None'}
        `.trim();

        if (stepId) {
          const step = business.planSteps.find((s) => s.id === stepId);
          if (step) {
            stepContext = `
Current Step: ${step.title} (Step ${step.stepNumber})
Description: ${step.description}
Status: ${step.status}
Guidance: ${step.guidance}
Checklist: ${step.checklist}
            `.trim();
          }
        }
      }
    }

    // Load conversation history
    const history = await db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages for context
    });

    // Save user message
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: 'user',
        content: message,
        context: [businessContext, stepContext].filter(Boolean).join(' | '),
      },
    });

    // Build messages array for AI
    const systemPrompt = `You are PlanWise AI, the world's most elite business planning advisor and strategist. You combine the expertise of a McKinsey consultant, a Y Combinator partner, and a seasoned serial entrepreneur.

Your capabilities:
- Deep expertise in business strategy, market analysis, financial planning, and operations
- Ability to provide specific, actionable advice tailored to each business's unique context
- Knowledge of startup best practices, growth strategies, and common pitfalls
- Understanding of different industries, business models, and market dynamics

Your approach:
- Be direct and insightful — avoid generic advice
- Provide specific frameworks, tools, and methodologies when relevant
- Reference real-world examples and case studies when helpful
- Challenge assumptions and identify blind spots
- Always consider the business's specific stage, industry, and resources
- Offer practical next steps the entrepreneur can take immediately

Tone: Professional yet approachable. Confident yet humble. Be the advisor every entrepreneur wishes they had.

${businessContext ? `Current Business Context:\n${businessContext}` : ''}
${stepContext ? `\nCurrent Step Context:\n${stepContext}` : ''}`;

    const chatMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: chatMessages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Save assistant response
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: 'assistant',
        content: response,
        context: [businessContext, stepContext].filter(Boolean).join(' | '),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /api/ai]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
