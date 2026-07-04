import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// POST /api/ai/business-analysis — AI analyzes business and provides recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required' },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        planSteps: { orderBy: { stepNumber: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        financials: { orderBy: { createdAt: 'desc' }, take: 6 },
        tasks: {
          where: { status: { in: ['pending', 'in_progress'] } },
          orderBy: { priority: 'desc' },
          take: 10,
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Build comprehensive context
    const completedSteps = business.planSteps.filter((s) => s.status === 'completed');
    const inProgressSteps = business.planSteps.filter((s) => s.status === 'in_progress' || s.status === 'current');
    const lockedSteps = business.planSteps.filter((s) => s.status === 'locked');

    const businessContext = `
=== BUSINESS OVERVIEW ===
Name: ${business.name}
Description: ${business.description}
Industry: ${business.industry}
Stage: ${business.stage}
Target Market: ${business.targetMarket}
Revenue Model: ${business.revenueModel}
Initial Capital: $${business.initialCapital}
Monthly Burn Rate: $${business.monthlyBurnRate}
Current Step: ${business.currentStep}/${business.totalSteps}
Completed: ${business.completed}

=== PROGRESS ===
Completed Steps (${completedSteps.length}): ${completedSteps.map((s) => s.title).join(', ') || 'None'}
In Progress (${inProgressSteps.length}): ${inProgressSteps.map((s) => s.title).join(', ') || 'None'}
Locked (${lockedSteps.length}): ${lockedSteps.map((s) => s.title).join(', ') || 'None'}

=== MILESTONES ===
${business.milestones.map((m) => `- ${m.title}: ${m.status} (Target: ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'TBD'}, Progress: ${m.currentValue}/${m.targetValue})`).join('\n') || 'No milestones defined'}

=== RECENT FINANCIALS ===
${business.financials.map((f) => `- ${f.period}: Revenue $${f.revenue}, Expenses $${f.expenses}, Profit $${f.profit}, Customers ${f.customers}`).join('\n') || 'No financial data'}

=== ACTIVE TASKS ===
${business.tasks.map((t) => `- [${t.priority}] ${t.title} (${t.status})`).join('\n') || 'No active tasks'}
    `.trim();

    const nvidiaApiKey = process.env.NVIDIA_API_KEY || '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';
    const completionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'z-ai/glm-5.2',
        messages: [
          {
            role: 'assistant',
            content: `You are Tashyeed, the world's most elite business analyst and strategist. You combine McKinsey-level analytical rigor with Y Combinator's startup pragmatism and a seasoned venture capitalist's pattern recognition.

Perform a comprehensive analysis of the business described below. Be brutally honest but constructive. Identify both strengths to leverage and weaknesses to address.

Return ONLY a JSON object with this exact structure:
{
  "overallScore": number (1-100, overall business viability score),
  "scores": {
    "marketFit": number (1-100, product-market fit potential),
    "financialHealth": number (1-100, financial viability and sustainability),
    "execution": number (1-100, execution capability and progress),
    "competition": number (1-100, competitive positioning),
    "risk": number (1-100, risk assessment — higher = lower risk)
  },
  "strengths": [
    { "title": string, "description": string, "impact": "high" | "medium" | "low" }
  ],
  "weaknesses": [
    { "title": string, "description": string, "severity": "critical" | "high" | "medium" | "low" }
  ],
  "opportunities": [
    { "title": string, "description": string, "potential": "high" | "medium" | "low" }
  ],
  "threats": [
    { "title": string, "description": string, "likelihood": "high" | "medium" | "low" }
  ],
  "recommendations": [
    {
      "title": string,
      "description": string (detailed, actionable recommendation),
      "priority": "urgent" | "high" | "medium" | "low",
      "category": "strategy" | "financial" | "product" | "marketing" | "operations" | "team",
      "timeline": string (e.g., "Immediately", "This week", "This month", "This quarter")
    }
  ],
  "quickWins": [
    { "title": string, "description": string, "effort": "low" | "medium" | "high" }
  ],
  "summary": string (2-3 paragraph executive summary of the analysis)
}

Be specific to this business. Generic advice is unacceptable. Return ONLY the JSON object.`
          },
          {
            role: 'user',
            content: `Analyze this business comprehensively:\n\n${businessContext}`
          }
        ],
        temperature: 1,
        top_p: 1,
        max_tokens: 16384
      })
    });
    
    const completion = await completionRes.json();

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate analysis' },
        { status: 500 }
      );
    }

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[business-analysis] Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        businessId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'ai',
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/business-analysis]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze business' },
      { status: 500 }
    );
  }
}
