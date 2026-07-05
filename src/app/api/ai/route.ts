import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';

// POST /api/ai — Chat with AI business advisor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, businessId, stepId, language } = body;
    const lang = language || 'en'
    const langInstructions: Record<string, string> = {
      en: 'CRITICAL: You MUST respond in English. Do NOT use any other language.',
      ar: 'CRITICAL: You MUST respond entirely in Arabic (العربية). Do NOT output any English text in your response, except for code or system commands. TRANSLATE ALL CONCEPTS TO ARABIC.',
      fr: 'CRITICAL: You MUST respond entirely in French (Français). Do NOT output any English text in your response, except for code or system commands. TRANSLATE ALL CONCEPTS TO FRENCH.',
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Build messages array for AI
    const systemPrompt = `You are Tashyeed, an elite business advisor. You are sharp, direct, and brilliant — combining the precision of McKinsey, the instincts of a Y Combinator partner, and the hustle of a serial founder.

${langInstructions[lang]}

RESPONSE STYLE (CRITICAL):
- Be CONCISE and SPECIFIC. No padding, no fluff, no generic advice.
- Every answer must be actionable and tailored to THIS specific business.
- Use bullet points and short paragraphs. Maximum 250 words unless the user asks for a deep-dive.
- If you can say it in 3 bullet points, do not write 3 paragraphs.
- Lead with the most important insight first.

WORKSPACE CONTROL (CRITICAL):
You have direct control over the user's workspace. When you want to take action on the user's behalf, output a hidden JSON command block EXACTLY as formatted below (NOT inside a code block):

[COMMAND: CREATE_TASK {"title": "Task Name", "description": "Details", "priority": "high|medium|low"}]
[COMMAND: CREATE_MILESTONE {"title": "Milestone Name", "description": "Details", "targetDate": "YYYY-MM-DD"}]
[COMMAND: GENERATE_PLAN]

Be PROACTIVE: when the user needs to take action, CREATE the task/milestone for them immediately without waiting for them to ask.

${businessContext ? `BUSINESS CONTEXT:\n${businessContext}` : ''}
${stepContext ? `\nCURRENT STEP:\n${stepContext}` : ''}`;

    const chatMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA API key is not configured on the server' },
        { status: 500 }
      );
    }

    const completionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',  // Fast 8B model — ~5-10s vs 60s for 70B
        messages: chatMessages,
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 600,   // Concise responses — no need for long tokens in chat
        stream: false      // Non-streaming — shows full response at once, feels faster
      })
    });

    if (!completionRes.ok) {
      const errText = await completionRes.text().catch(() => completionRes.statusText);
      console.error('[POST /api/ai] NVIDIA error:', errText);
      return NextResponse.json(
        { success: false, error: `AI service error: ${completionRes.status}` },
        { status: 502 }
      );
    }

    const completion = await completionRes.json();
    const aiReply = completion.choices?.[0]?.message?.content;

    if (!aiReply) {
      return NextResponse.json(
        { success: false, error: 'AI returned an empty response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reply: aiReply });

  } catch (error) {
    console.error('[POST /api/ai]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

