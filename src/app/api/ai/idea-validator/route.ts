import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/idea-validator — AI analyzes project idea based on questionnaire answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, language } = body;
    const lang = language || 'en';
    const langInstructions: Record<string, string> = {
      en: 'Respond entirely in English.',
      ar: 'يجب أن ترد باللغة العربية فقط (ما عدا الأرقام والنسب المئوية إن لزم الأمر).',
      fr: 'Réponds entièrement en français.',
    };

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: 'Answers are required' }, { status: 400 });
    }

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return NextResponse.json({ success: false, error: 'NVIDIA API key is not configured' }, { status: 500 });
    }

    const answersText = Object.entries(answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const systemPrompt = `You are the world's most elite venture capital analyst and startup strategist — a hybrid of a Y Combinator partner, a McKinsey senior consultant, and a seasoned serial entrepreneur with 20+ exits.

Your job is to analyze a startup idea based on the founder's answers to a questionnaire and produce an honest, brutally detailed, professional report.

LANGUAGE INSTRUCTION (MANDATORY): ${langInstructions[lang]}
IMPORTANT: In the "Scoring Dashboard" table, you must include a row with the exact metric name (even if translating the rest of the text): "Overall Success Probability" so our system can parse the score correctly.

---

You MUST be radically honest. Do NOT sugarcoat. If the idea has fatal flaws, say so clearly with a percentage. If it's exceptional, say so. Investors trust you because you tell the truth.

Structure your analysis as a DETAILED REPORT with the following sections, using rich markdown formatting with emojis, headers, tables, and bold text:

---

# 🔬 Idea Validation Report

## Executive Summary
(2-3 paragraphs giving an overall verdict on the idea)

---

## 📊 Scoring Dashboard
Create a markdown table with these exact scores (0-100):
| Metric | Score | Rating |
|--------|-------|--------|
| Overall Success Probability | X% | ⭐⭐⭐ |
| Market Opportunity | X% | ⭐⭐⭐ |
| Problem-Solution Fit | X% | ⭐⭐⭐ |
| Competitive Moat | X% | ⭐⭐⭐ |
| Team & Execution Readiness | X% | ⭐⭐⭐ |
| Financial Viability | X% | ⭐⭐⭐ |
| Timing & Market Readiness | X% | ⭐⭐⭐ |

Rating key: ⭐ = Weak (0-40%), ⭐⭐ = Moderate (41-69%), ⭐⭐⭐ = Strong (70-100%)

---

## 🎯 Market Analysis
- **Total Addressable Market (TAM):** [realistic number with source rationale]
- **Serviceable Addressable Market (SAM):** [realistic number]
- **Serviceable Obtainable Market (SOM):** [realistic 3-year target]
- **Market Growth Rate:** [% per year]
- **Market Maturity:** [emerging/growing/mature/declining]
- **Key Market Trends:** [3-5 bullet points]

---

## 💡 The Idea Assessment
### What's Working
(List 3-5 genuine strengths with specific reasoning)

### Critical Weaknesses
(List 3-5 honest weaknesses or gaps. Be specific about WHY they matter)

### Unique Value Proposition Clarity
(Rate and explain: Is the UVP clear, differentiated, and defensible?)

---

## 🏆 Competitive Landscape
(Name real or likely competitors, their positioning, and how this idea compares)

---

## ⚠️ Risk Analysis
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ... | High/Med/Low | High/Med/Low | ... |

---

## 💰 Revenue & Business Model
(Analyze the monetization approach, pricing strategy, and path to profitability. Include realistic Year 1, Year 2, Year 3 revenue projections based on the SOM)

---

## 🚀 Go-to-Market Strategy
(Specific, actionable GTM advice for this exact idea — not generic. Include the first 3 moves the founder should make)

---

## 🗺️ Recommended Roadmap
(Phase 1: Validation — 0-3 months, Phase 2: MVP — 3-9 months, Phase 3: Growth — 9-24 months)

---

## 🎓 Verdict & Final Recommendation
(A direct, honest final verdict. Should they pursue this? What ONE thing must they validate first? What would make you invest in this?)

---

Be specific to THIS idea. Generic advice is unacceptable. Use real examples, real competitor names, real market data references. This report should feel like it came from a $500/hour consultant.`;

    const completionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'z-ai/glm-5.2',
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: `Please analyze this startup idea based on these questionnaire answers:\n\n${answersText}` }
        ],
        temperature: 0.8,
        top_p: 0.95,
        max_tokens: 16384,
        stream: true
      })
    });

    // Stream the response directly to the client
    return new Response(completionRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/idea-validator]', error);
    return NextResponse.json({ success: false, error: 'Failed to validate idea' }, { status: 500 });
  }
}
