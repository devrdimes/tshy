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
              content: `You are an elite VC pitch deck expert. ${langInstructions[lang]}

Generate a 10-slide investor pitch deck for the startup below.
CRITICAL: You MUST be extremely concise. Max 15 words per slide. Use short, punchy bullet points.
Return ONLY valid JSON — no markdown, no text outside JSON.

Format:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Short title",
      "content": "• Short bullet 1\n• Short bullet 2",
      "designNote": "1-2 words visual direction"
    }
  ]
}

The 10 slides:
1. Title
2. Problem
3. Solution
4. Market Size
5. Business Model
6. Go-to-Market
7. Competitive Advantage
8. Product/Tech
9. Team
10. The Ask`
            },
            {
              role: 'user',
              content: `Generate pitch deck for:\n\n${businessContext}\n\nExecution plan:\n${planContext}`,
            },
          ],
          temperature: 0.65,
          top_p: 0.9,
          max_tokens: 1500,
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
