import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA API key is not configured' },
        { status: 500 }
      );
    }

    // Use AbortController so we don't hang forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000); // 50s timeout

    let completionRes: Response;
    try {
      completionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'assistant',
              content: `You are an elite business strategist. Generate exactly 10 actionable business plan steps for the startup below. Be specific to this business — no generic advice.

Return ONLY a valid JSON object. No markdown, no text outside JSON.

Format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "2 sentences what this step is about",
      "category": "research|strategy|financial|legal|product|marketing|operations|team",
      "guidance": "Specific 2-3 sentence guidance for this exact business",
      "tips": "1-2 sentence expert tip",
      "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"],
      "resources": ["Tool/resource 1", "Tool/resource 2", "Tool/resource 3"],
      "estimatedDays": 14
    }
  ]
}

The 10 steps must cover: Market Research, Value Proposition, Business Model, Financial Planning, Legal Setup, Product Development, Marketing Strategy, Operations, Team Building, Launch Strategy. Tailor each step to the specific business context.`,
            },
            {
              role: 'user',
              content: `Generate the 10-step plan for:\n\n${businessContext}`,
            },
          ],
          temperature: 0.6,
          top_p: 0.9,
          max_tokens: 2500,
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!completionRes.ok) {
      const errText = await completionRes.text().catch(() => completionRes.statusText);
      throw new Error(`AI API error: ${completionRes.status} — ${errText}`);
    }

    const completion = await completionRes.json();
    const responseText = completion.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('AI returned empty response');
    }

    // Parse — try to extract JSON even if there's surrounding text
    let parsedSteps;
    try {
      const startObj = responseText.indexOf('{');
      const startArr = responseText.indexOf('[');
      const startIndex = startObj !== -1 && startArr !== -1 ? Math.min(startObj, startArr) : Math.max(startObj, startArr);
      
      const endObj = responseText.lastIndexOf('}');
      const endArr = responseText.lastIndexOf(']');
      const endIndex = endObj !== -1 && endArr !== -1 ? Math.max(endObj, endArr) : Math.max(endObj, endArr);
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON found in response');
      }
      
      const jsonStr = responseText.substring(startIndex, endIndex + 1);
      const parsed = JSON.parse(jsonStr);
      parsedSteps = parsed.steps || parsed;
    } catch {
      // Last resort: try raw parse
      try {
        const parsed = JSON.parse(responseText);
        parsedSteps = parsed.steps || parsed;
      } catch {
        console.error('[generate-plan] Failed to parse:', responseText.substring(0, 500));
        throw new Error('Failed to parse AI-generated plan. Please try again.');
      }
    }

    if (!Array.isArray(parsedSteps) || parsedSteps.length === 0) {
      throw new Error('AI generated an invalid plan structure. Please try again.');
    }

    // Cap at 10 steps
    const steps = parsedSteps.slice(0, 10);

    // Delete existing plan steps
    await db.planStep.deleteMany({ where: { businessId } });

    // Create new steps
    const stepData = steps.map((step: Record<string, unknown>, index: number) => ({
      businessId,
      stepNumber: Number(step.stepNumber) || index + 1,
      title: String(step.title || `Step ${index + 1}`),
      description: String(step.description || ''),
      category: String(step.category || 'strategy'),
      status: index === 0 ? 'current' : 'locked',
      guidance: String(step.guidance || ''),
      tips: String(step.tips || ''),
      checklist: JSON.stringify(Array.isArray(step.checklist) ? step.checklist : []),
      resources: JSON.stringify(Array.isArray(step.resources) ? step.resources : []),
      estimatedDays: Number(step.estimatedDays) || 7,
    }));

    await db.planStep.createMany({ data: stepData });

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

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate business plan';
    console.error('[POST /api/business/[id]/generate-plan]', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
