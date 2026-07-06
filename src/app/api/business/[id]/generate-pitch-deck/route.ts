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
      en: 'CRITICAL: You MUST respond in English. Do NOT use any other language.',
      ar: 'CRITICAL: You MUST respond entirely in Arabic (العربية). Do NOT output any English text in your response. TRANSLATE ALL CONCEPTS TO ARABIC.',
      fr: 'CRITICAL: You MUST respond entirely in French (Français). Do NOT output any English text in your response. TRANSLATE ALL CONCEPTS TO FRENCH.',
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

    const planContext = business.planSteps.map(step => 
      `Step ${step.stepNumber}: ${step.title}\n${step.description}`
    ).join('\n\n');

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA API key is not configured' },
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
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'assistant',
            content: `You are an elite venture capital analyst and presentation expert. Generate a professional 10-slide Pitch Deck for the startup described below.
            
You must respond ONLY with valid JSON — no markdown, no explanations outside the JSON structure.
${langInstructions[lang]}

The 10 slides must cover:
1. Title (Company name & one-line elevator pitch)
2. Problem (What pain point are you solving)
3. Solution (How does your product fix it)
4. Market Size (TAM, SAM, SOM)
5. Business Model (How you make money)
6. Go-to-Market Strategy (How you acquire users)
7. Competition (Why you are better)
8. Product/Tech (Key features or proprietary tech)
9. Team (Why this is the right team)
10. Financial Ask (How much money needed and what it's for)

Return a JSON object with a "slides" array. Each slide object must have:
{
  "slideNumber": number,
  "title": string,
  "content": string (The main compelling text for the slide, use bullet points if appropriate),
  "designNote": string (A short instruction for the designer on what chart, icon, or image should be on this slide)
}

IMPORTANT: Return ONLY the JSON object, no other text.`,
          },
          {
            role: 'user',
            content: `Generate a 10-slide pitch deck based on this business:\n\n${businessContext}\n\nAnd their execution plan:\n\n${planContext}`,
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 3000
      })
    });

    if (!completionRes.ok) {
       throw new Error(`NVIDIA API error: ${completionRes.statusText}`);
    }

    const completion = await completionRes.json();
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate pitch deck' },
        { status: 500 }
      );
    }

    let parsedSlides;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      parsedSlides = parsed.slides || parsed;
    } catch {
      console.error('[generate-pitch-deck] Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated pitch deck' },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedSlides)) {
      return NextResponse.json(
        { success: false, error: 'AI generated invalid pitch deck structure' },
        { status: 500 }
      );
    }

    // Save pitch deck to business
    await db.business.update({
      where: { id: businessId },
      data: { pitchDeck: JSON.stringify(parsedSlides) }
    });

    return NextResponse.json({
      success: true,
      data: { slides: parsedSlides },
    });
  } catch (error) {
    console.error('[POST /api/business/[id]/generate-pitch-deck]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate pitch deck' },
      { status: 500 }
    );
  }
}
