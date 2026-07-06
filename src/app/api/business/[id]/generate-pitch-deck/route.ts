import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;
export const runtime = 'edge';
import { db } from '@/lib/db';
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const lang = body.language || 'en';

    const langInstructions: Record<string, string> = {
      en: 'Respond in English only.',
      ar: 'You MUST respond entirely in Arabic (العربية). Translate all content.',
      fr: 'You MUST respond entirely in French. Translate all content.',
    };

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
Target Market: ${business.targetMarket}
Revenue Model: ${business.revenueModel}
Initial Capital: $${business.initialCapital}
    `.trim();

    const planContext = business.planSteps.length > 0
      ? business.planSteps.slice(0, 5).map(s => `- ${s.title}: ${s.description}`).join('\n')
      : 'No plan steps yet.';

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA API key is not configured' },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

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
              role: 'system',
              content: `You are a world-class venture capital pitch deck expert who has helped startups raise millions. ${langInstructions[lang]}

Generate a highly professional, comprehensive 10-slide investor pitch deck for the startup provided. 
Your output MUST be a valid JSON object. Do not wrap the JSON in markdown code blocks or add any conversational text.

Format requirements:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Compelling Slide Title",
      "content": "• Detailed, persuasive bullet point 1 with actionable insights\\n• Data-driven bullet point 2\\n• Compelling bullet point 3",
      "designNote": "Detailed instructions on what visuals, charts, or metrics should accompany this slide to maximize impact."
    }
  ]
}

The 10 slides MUST follow this structure and include substantial, compelling content:
1. Title Slide: Company name, impactful tagline, and founder vision.
2. The Problem: A deep dive into the specific pain points, backed by realistic market assumptions or data.
3. The Solution: Exactly how this product solves the problem uniquely and better than anyone else.
4. Market Size (TAM/SAM/SOM): Realistic market sizing, target demographic, and total addressable opportunity.
5. Business Model: Clear explanation of how the company makes money, pricing strategy, and unit economics.
6. Go-to-Market Strategy: How the startup will acquire its first 1,000 to 10,000 customers (channels, tactics).
7. Competitive Advantage: The "Moat" — why this startup wins against direct and indirect competitors.
8. Product/Technology: Key features, proprietary tech, or unique user experience highlights.
9. The Team: Why the founders and key members are uniquely positioned to execute this vision.
10. The Ask: Specific funding amount required, exact use of funds (e.g., 40% R&D, 40% Marketing, 20% Ops), and the major milestones this funding will unlock.

CRITICAL: Use sophisticated investor terminology (e.g., CAC, LTV, churn, MVP, scale). Make the content dense, actionable, and extremely professional.`
            },
            {
              role: 'user',
              content: `Generate pitch deck for:\n\n${businessContext}\n\nExecution plan:\n${planContext}`,
            },
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4096,
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
      throw new Error('AI returned empty response for pitch deck');
    }

    let parsedSlides;
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
      parsedSlides = parsed.slides || parsed;
    } catch {
      try {
        const parsed = JSON.parse(responseText);
        parsedSlides = parsed.slides || parsed;
      } catch {
        console.error('[generate-pitch-deck] Failed to parse:', responseText.substring(0, 500));
        throw new Error('Failed to parse AI-generated pitch deck. Please try again.');
      }
    }

    if (!Array.isArray(parsedSlides) || parsedSlides.length === 0) {
      throw new Error('AI generated invalid pitch deck structure. Please try again.');
    }

    await db.business.update({
      where: { id: businessId },
      data: { pitchDeck: JSON.stringify(parsedSlides) }
    });

    return NextResponse.json({
      success: true,
      data: { slides: parsedSlides },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate pitch deck';
    console.error('[POST /api/business/[id]/generate-pitch-deck]', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
