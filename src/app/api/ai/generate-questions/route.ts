import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/generate-questions — AI generates context-aware questions based on the initial idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, language } = body;
    const lang = language || 'en';

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ success: false, error: 'Idea is required' }, { status: 400 });
    }

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json({ success: false, error: 'NVIDIA API key is not configured' }, { status: 500 });
    }

    const langInstructions: Record<string, string> = {
      en: 'CRITICAL: Respond ONLY in English.',
      ar: 'CRITICAL: Respond ONLY in Arabic (العربية). ALL text including questions, placeholders, hints, and categories MUST be in Arabic.',
      fr: 'CRITICAL: Respond ONLY in French (Français). ALL text including questions, placeholders, hints, and categories MUST be in French.',
    };

    const systemPrompt = `You are an elite startup analyst and VC interviewer. Your job is to generate 8 highly specific, intelligent follow-up questions for a founder based on their startup idea.

${langInstructions[lang]}

You MUST tailor the questions completely to the type of business described. For example:
- A B2B SaaS startup → ask about ACV, integration complexity, sales cycle, churn risk
- A marketplace → ask about supply-side acquisition, liquidity, take rate, cold start problem
- A consumer app → ask about virality loops, retention D7/D30, monetization triggers
- A food/restaurant → ask about unit economics per location, health regulations, spoilage
- A hardware startup → ask about manufacturing, BOM cost, supply chain
- An agency/service → ask about scalability ceiling, delivery team, client retention
- An AI startup → ask about data moat, model accuracy, API costs, fine-tuning

NEVER use generic questions that could apply to any business. Each question must directly reference what the founder described.

Return ONLY a valid JSON object with a "questions" array. Each question object must have:
{
  "id": "unique_id",
  "category": "Category Name",
  "emoji": "relevant emoji",
  "question": "The specific, intelligent question",
  "placeholder": "A highly relevant example answer specific to this type of business",
  "hint": "A short expert tip that helps the founder answer better"
}

Generate EXACTLY 8 questions. Return ONLY the JSON object, no other text.`;

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: `The founder's startup idea is:\n\n"${idea}"\n\nGenerate 8 highly tailored follow-up questions for this specific type of business.` }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      })
    });

    if (!res.ok) throw new Error(`NVIDIA API error: ${res.statusText}`);

    const completion = await res.json();
    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ success: false, error: 'AI failed to generate questions' }, { status: 500 });
    }

    let questions;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      questions = parsed.questions || parsed;
    } catch {
      console.error('[generate-questions] Parse error:', responseText);
      return NextResponse.json({ success: false, error: 'Failed to parse AI questions' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'No questions generated' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { questions } });

  } catch (error) {
    console.error('[POST /api/ai/generate-questions]', error);
    return NextResponse.json({ success: false, error: 'Failed to generate questions' }, { status: 500 });
  }
}
