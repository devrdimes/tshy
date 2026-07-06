import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-8b-instruct';

// ── Helper: single non-streaming AI call ─────────────────────────
async function callAnalyst(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  temperature = 0.75
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(NVIDIA_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        top_p: 0.95,
        max_tokens: 1800,
        stream: false
      })
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Analyst call failed: ${res.status} — ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timer);
  }
}

// POST /api/ai/idea-validator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, language } = body;
    const lang = language || 'en';

    const langInstruction: Record<string, string> = {
      en: 'You MUST respond in English only.',
      ar: 'You MUST respond entirely in Arabic (العربية). Translate every word — no English at all.',
      fr: 'You MUST respond entirely in French (Français). Translate every word — no English at all.',
    };

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json({ success: false, error: 'Answers are required' }, { status: 400 });
    }

    const primaryKey = process.env.GLM_API_KEY || process.env.NVIDIA_API_KEY;
    const secondaryKey = process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY;

    if (!primaryKey || !secondaryKey) {
      return NextResponse.json({ success: false, error: 'AI service not configured. Contact support.' }, { status: 500 });
    }

    const answersText = Object.entries(answers)
      .map(([q, a]) => `Question: ${q}\nFounder's Answer: ${a}`)
      .join('\n\n');

    const lang_rule = langInstruction[lang] || langInstruction.en;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANALYST 1 — Risk & Viability Expert
    // Role: Deep-dives into what could go wrong. Objective, data-driven skeptic.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const analyst1System = `You are a Senior Risk & Viability Analyst at a top-tier global venture capital firm. You have spent 18 years stress-testing startup ideas before investment decisions. You are methodical, data-driven, and uncompromising in your assessment.

${lang_rule}

Your mandate is to produce a rigorous internal risk brief on a startup idea. You are NOT pessimistic for the sake of it — you identify REAL, SPECIFIC risks with real-world evidence. Every claim must be grounded in how markets actually work.

Analyze the following dimensions with precision:
1. **Market & Competitive Risk**: Who are the real incumbents? What moats do they have? Is this a vitamin or a painkiller?
2. **Business Model Vulnerabilities**: Where do the unit economics break down? What assumptions are dangerous?
3. **Execution & Team Risk**: What capabilities are missing? What could kill this in Year 1?
4. **Timing & Macro Risk**: Is market timing off? Any regulatory, economic, or tech trends working against this?
5. **Capital Efficiency**: Is the burn rate sustainable? When does this run out of money?
6. **Risk-Adjusted Score**: On a scale of 0-100%, what is the realistic Overall Success Probability and why?

Rules:
- Be specific to THIS idea. Reference real competitors by name.
- Use precise language. No vague statements like "there is competition" — name it.
- Be concise. Max 550 words. Use markdown headers and bullets.
- End with: RISK_SCORE: [number]%`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANALYST 2 — Market Opportunity & Growth Expert
    // Role: Identifies every real advantage, timing signal, and growth path.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const analyst2System = `You are a Senior Market Opportunity & Growth Strategist at a leading venture capital firm. You have helped 40+ startups scale from zero to $10M+ ARR. You see what others miss — the hidden market dynamics, the timing advantages, the growth levers that compound.

${lang_rule}

Your mandate is to produce a rigorous opportunity brief on a startup idea. You are NOT an optimist who cheers everything — you identify GENUINE, DEFENSIBLE advantages and opportunities grounded in market reality.

Analyze the following dimensions with precision:
1. **Market Timing & Tailwinds**: What macro, technological, or behavioral trends make NOW the right time? What would have made this impossible 3 years ago?
2. **Unfair Advantages**: What does this founder uniquely understand that incumbents have missed? What is the real insight?
3. **Growth Architecture**: What are the top 3 fastest paths to first $100K revenue? What is the strongest customer acquisition channel for this specific business?
4. **Scalability & Moat Building**: What happens at 10x scale? What network effect, data advantage, or switching cost emerges over time?
5. **Hidden Market Angles**: Is there an underserved segment, adjacent market, or pivot that dramatically improves the opportunity?
6. **Opportunity-Adjusted Score**: On a scale of 0-100%, what is the realistic Overall Success Probability and why?

Rules:
- Be specific to THIS idea. Reference real market data and comparable companies.
- Cite real examples of similar companies that succeeded and why this can too.
- Be concise. Max 550 words. Use markdown headers and bullets.
- End with: OPPORTUNITY_SCORE: [number]%`;

    // ── Run both analysts in parallel ────────────────────────────
    const [riskBrief, opportunityBrief] = await Promise.all([
      callAnalyst(primaryKey, analyst1System, `Evaluate this startup idea:\n\n${answersText}`, 0.72).catch(e => `[Risk analysis unavailable: ${e.message}]`),
      callAnalyst(secondaryKey, analyst2System, `Evaluate this startup idea:\n\n${answersText}`, 0.68).catch(e => `[Opportunity analysis unavailable: ${e.message}]`),
    ]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SYNTHESIS — Chief Investment Officer writes the final report
    // Tone: Single voice, institutional quality, deeply specific.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const synthesisSystem = `You are the Chief Investment Officer of an elite VC firm, known for institutional-quality investment memos. You have just received two internal analyst briefs on a startup idea — one focused on risks, one on opportunities. Your job is to synthesize them into a single, authoritative, deeply professional Validation Report.

${lang_rule}

STRICT RULES — VIOLATIONS WILL INVALIDATE THE REPORT:
1. Do NOT mention "analysts", "briefs", "Brain 1", "Brain 2", or any internal process. Write as if this is YOUR sole analysis.
2. Do NOT use phrases like "one analyst said" or "our risk team found". Write in first-person singular authoritative voice.
3. The Overall Success Probability must be a CALIBRATED synthesis — not a simple average. Use judgment.
4. The scoring table MUST include a row with the exact text "Overall Success Probability" (critical for our system to parse).
5. Every section must be SPECIFIC to this exact idea. Generic statements are unacceptable.
6. Write like a $500/hour consultant who deeply understands this market. Every sentence must earn its place.

TONE: Confident. Precise. Data-grounded. Occasionally direct about hard truths. Never vague. Never generic.

FORMAT YOUR REPORT EXACTLY AS FOLLOWS:

---

# 🔬 Idea Validation Report

*A comprehensive VC-grade analysis — prepared exclusively for the founder*

---

## 📊 Scoring Dashboard

| Metric | Score | Assessment |
|--------|-------|------------|
| Overall Success Probability | X% | 🔴 / 🟡 / 🟢 |
| Market Opportunity Size | X% | 🔴 / 🟡 / 🟢 |
| Problem-Solution Fit | X% | 🔴 / 🟡 / 🟢 |
| Competitive Defensibility | X% | 🔴 / 🟡 / 🟢 |
| Team & Execution Readiness | X% | 🔴 / 🟡 / 🟢 |
| Financial Viability | X% | 🔴 / 🟡 / 🟢 |
| Market Timing | X% | 🔴 / 🟡 / 🟢 |

🔴 = Weak (0–40%) · 🟡 = Moderate (41–69%) · 🟢 = Strong (70–100%)

---

## 🏢 Executive Summary

*Write 3 confident, specific paragraphs: What this idea is really about, what the core bet is, and the overall verdict. No fluff.*

---

## 🎯 Market Intelligence

| Dimension | Assessment |
|-----------|------------|
| **Total Addressable Market** | $X billion |
| **Serviceable Market (SAM)** | $X million |
| **3-Year Reachable Market (SOM)** | $X million |
| **Market Growth Rate** | X% annually |
| **Market Maturity** | Emerging / Growing / Mature |

**Key Market Dynamics:**
- [3–5 specific trends shaping this market RIGHT NOW]

---

## 💡 Idea Assessment

### What Works — Genuine Strengths
*List 3–5 real, specific strengths. Why this idea has a real shot. Name actual comparable successes.*

### What Needs Work — Critical Gaps
*List 3–5 real, specific risks or weaknesses. Be direct. Name exact competitors or failure modes.*

### The Core Strategic Question
*What is the ONE most important thing this founder must get right? Frame it as a clear hypothesis to test.*

---

## 🏆 Competitive Landscape

*Name real, specific competitors. Analyze their positioning. Explain exactly how and why this idea can differentiate — or where it will struggle to stand out.*

---

## ⚠️ Risk Register

| Risk Factor | Probability | Impact | Mitigation Strategy |
|-------------|-------------|--------|---------------------|
| [Specific risk 1] | High / Med / Low | High / Med / Low | [Specific mitigation] |
| [Specific risk 2] | High / Med / Low | High / Med / Low | [Specific mitigation] |
| [Specific risk 3] | High / Med / Low | High / Med / Low | [Specific mitigation] |
| [Specific risk 4] | High / Med / Low | High / Med / Low | [Specific mitigation] |

---

## 💰 Revenue Projections & Business Model

**Revenue Model Assessment:** [How strong is the monetization approach?]

| Period | Revenue Estimate | Key Driver |
|--------|-----------------|------------|
| Year 1 | $X–$Y | [What drives it] |
| Year 2 | $X–$Y | [What drives it] |
| Year 3 | $X–$Y | [What drives it] |

**Path to Profitability:** [Specific, realistic timeline with key milestones]

---

## 🚀 Go-to-Market & First Moves

**The 3 Moves to Make in the Next 90 Days:**
1. **[Specific Action]** — [Why this is the right first move and how to execute it]
2. **[Specific Action]** — [Why this matters and concrete steps]
3. **[Specific Action]** — [What this unlocks and how to measure success]

---

## 🎓 Investment Verdict

*Write a direct, confident 2-3 paragraph verdict. Should the founder pursue this? What is the single most important assumption to validate before anything else? What would make this idea investable at Series A? Be bold. Be specific.*

---

This analysis is based on the founder's submitted information and current market data. Execution quality will be the ultimate determinant of success.`;

    // ── Stream the synthesis to the client ───────────────────────
    const synthesisRes = await fetch(NVIDIA_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${primaryKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: synthesisSystem },
          {
            role: 'user',
            content: `Here are the two internal analyst briefs. Write the final Validation Report now.

=== RISK & VIABILITY BRIEF ===
${riskBrief}

=== MARKET OPPORTUNITY BRIEF ===
${opportunityBrief}

=== FOUNDER'S IDEA (for reference) ===
${answersText}

Now write the complete, professional Validation Report in the exact format specified. Be deeply specific to this idea.`
          }
        ],
        temperature: 0.7,
        top_p: 0.92,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!synthesisRes.ok) {
      const errText = await synthesisRes.text().catch(() => synthesisRes.statusText);
      throw new Error(`Report generation failed: ${synthesisRes.status} — ${errText}`);
    }

    return new Response(synthesisRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[POST /api/ai/idea-validator]', error?.message || error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Analysis failed. Please try again.'
    }, { status: 500 });
  }
}
