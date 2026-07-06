import { NextRequest, NextResponse } from 'next/server';
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
              role: 'assistant',
              content: `You are an elite VC pitch deck expert. ${langInstructions[lang]}

Generate a compelling 10-slide investor pitch deck for the startup below. Return ONLY valid JSON — no markdown, no text outside JSON.

Format:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title",
      "content": "Compelling content for this slide. Use bullet points with • character. Keep concise and impactful.",
      "designNote": "Brief visual direction: what chart/icon/image to show"
    }
  ]
}

The 10 slides MUST be:
1. Title Slide — Company name, tagline, founder name
2. The Problem — Specific pain point with data/stats
3. The Solution — How the product solves it uniquely
4. Market Size — TAM, SAM, SOM with realistic numbers
5. Business Model — How money is made, pricing strategy
6. Go-to-Market — Customer acquisition channels and strategy
7. Competitive Advantage — Why this beats competitors
8. Product/Technology — Key features or proprietary tech
9. The Team — Why this team can execute
10. The Ask — Funding amount, use of funds, milestones

Make every slide SPECIFIC to this business. Compelling investor language. No generic content.`,
            },
            {
              role: 'user',
              content: `Generate pitch deck for:\n\n${businessContext}\n\nExecution plan:\n${planContext}`,
            },
          ],
          temperature: 0.65,
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
      throw new Error('AI returned empty response for pitch deck');
    }

    let parsedSlides;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
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
