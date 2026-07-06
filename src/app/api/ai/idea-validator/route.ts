import { NextRequest, NextResponse } from 'next/server';

// ── Helper: call NVIDIA with a prompt, returns full text (non-streaming) ──
async function callBrain(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  temperature = 0.75
): Promise<string> {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature,
      top_p: 0.95,
      max_tokens: 2048,
      stream: false
    })
  });
  if (!res.ok) throw new Error(`Brain call failed: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

// POST /api/ai/idea-validator — Dual AI brain analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, language } = body;
    const lang = language || 'en';

    const langInstructions: Record<string, string> = {
      en: 'CRITICAL: You MUST respond in English. Do NOT use any other language.',
      ar: 'CRITICAL: You MUST respond entirely in Arabic (العربية). Do NOT output any English text in your response. TRANSLATE ALL CONCEPTS TO ARABIC.',
      fr: 'CRITICAL: You MUST respond entirely in French (Français). Do NOT output any English text in your response. TRANSLATE ALL CONCEPTS TO FRENCH.',
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

    const langInstruction = langInstructions[lang];

    // ── BRAIN 1: The Skeptical VC ─────────────────────────────────────────────
    // This brain is a hard-nosed investor who looks for every reason NOT to invest.
    // It focuses on: market risks, fatal flaws, competition threats, team gaps, burn rate.
    const brain1Prompt = `You are Brain 1 — a hardened, skeptical venture capitalist with 20 years of experience. You have seen 10,000 startups fail. You have no patience for hype.

${langInstruction}

Your SOLE job is to stress-test this startup idea by finding every flaw, risk, red flag, and fatal weakness. You are NOT here to encourage — you are here to save the founder from wasting their life savings.

Think like a devil's advocate. Ask:
- Why will this FAIL?
- Who will CRUSH them in the market?
- Why is the team NOT ready?
- Where will the money RUN OUT?
- What assumption is COMPLETELY WRONG?

Write a structured analysis (use markdown headers and bullet points) covering:
1. **Fatal Flaws & Red Flags** — The top 3-5 most dangerous problems with this idea
2. **Competitive Death Threats** — Who is already doing this better and will destroy them
3. **Team & Execution Gaps** — Why this team may not be able to pull it off
4. **Financial Risks** — Where the unit economics break down
5. **Market Timing Issues** — Why the timing might be wrong (too early, too late, wrong market)
6. **Your Skeptical Score** — Give a single score (0-100%) for Overall Success Probability with your reasoning

Be brutally honest. Do NOT sugarcoat. Short, sharp, punchy sentences. Maximum 600 words.`;

    // ── BRAIN 2: The Growth Strategist ───────────────────────────────────────
    // This brain is an optimistic operator who has scaled multiple companies.
    // It focuses on: market opportunity, unique advantages, growth levers, first-mover potential.
    const brain2Prompt = `You are Brain 2 — an elite growth strategist and operator who has built 5 companies from $0 to $50M+. You specialize in finding the hidden diamond in rough startup ideas.

${langInstruction}

Your SOLE job is to identify every genuine opportunity, strategic advantage, and growth lever in this startup idea. You are NOT a cheerleader — you find REAL strengths based on evidence.

Think like a growth architect. Ask:
- What UNIQUE advantage does this idea have that others miss?
- What market TAILWIND is behind this idea?
- What is the FASTEST path to first revenue?
- What is the SCALABILITY multiplier in this model?
- What SECRET insight does this founder have?

Write a structured analysis (use markdown headers and bullet points) covering:
1. **Genuine Strengths & Unfair Advantages** — The real, defensible advantages of this idea
2. **Market Opportunity & Timing** — Why NOW is the right time for this idea
3. **Growth Levers** — The top 3-4 fastest paths to traction and revenue
4. **Strategic Moat** — What will make this hard to copy once they get going
5. **The Hidden Opportunity** — An angle or market segment the founder might have missed
6. **Your Optimistic Score** — Give a single score (0-100%) for Overall Success Probability with your reasoning

Be constructive but evidence-based. Do NOT make things up. Short, energetic, specific sentences. Maximum 600 words.`;

    // ── STEP 1: Run both brains in PARALLEL ──────────────────────────────────
    const [brain1Analysis, brain2Analysis] = await Promise.all([
      callBrain(nvidiaApiKey, brain1Prompt, `Analyze this startup idea:\n\n${answersText}`, 0.8),
      callBrain(nvidiaApiKey, brain2Prompt, `Analyze this startup idea:\n\n${answersText}`, 0.7),
    ]);

    // ── STEP 2: Synthesis Brain — reads both, produces final unified report ──
    const synthesisPrompt = `You are the Chief Analysis Officer — the final decision-maker in a top-tier VC firm. Two of your senior analysts have independently reviewed a startup idea.

${langInstruction}

**Brain 1 (Skeptical VC) said:**
${brain1Analysis}

---

**Brain 2 (Growth Strategist) said:**
${brain2Analysis}

---

Your job is to SYNTHESIZE both perspectives into one definitive, unified validation report. You must:
- Weigh both analyses against each other
- Resolve conflicts between the two brains with your own judgment
- The final score is a BALANCED result — not just an average, but a considered judgment
- Produce the most comprehensive, professional report possible

CRITICAL RULE: In the "Scoring Dashboard" table, you must include a row with the exact metric name "Overall Success Probability" so our system can parse the score.

Structure your final report with rich markdown formatting, emojis, tables, and bold text:

---

# 🔬 Dual-Brain Validation Report

> *Synthesized from two independent AI analysts: a Skeptical VC and a Growth Strategist*

## ⚖️ Brain Consensus Summary
(2-3 paragraphs: Where did both brains agree? Where did they sharply disagree? What does that tension reveal?)

---

## 📊 Scoring Dashboard

| Metric | Brain 1 (Skeptic) | Brain 2 (Optimist) | Final Score | Rating |
|--------|-------------------|---------------------|-------------|--------|
| Overall Success Probability | X% | X% | X% | ⭐⭐⭐ |
| Market Opportunity | X% | X% | X% | ⭐⭐⭐ |
| Problem-Solution Fit | X% | X% | X% | ⭐⭐⭐ |
| Competitive Moat | X% | X% | X% | ⭐⭐⭐ |
| Team & Execution Readiness | X% | X% | X% | ⭐⭐⭐ |
| Financial Viability | X% | X% | X% | ⭐⭐⭐ |
| Timing & Market Readiness | X% | X% | X% | ⭐⭐⭐ |

Rating: ⭐ = Weak (0-40%) · ⭐⭐ = Moderate (41-69%) · ⭐⭐⭐ = Strong (70-100%)

---

## 🎯 Market Analysis
- **Total Addressable Market (TAM):** [number]
- **Serviceable Addressable Market (SAM):** [number]
- **Serviceable Obtainable Market (SOM):** [3-year target]
- **Market Growth Rate:** [%/year]
- **Key Trends:** [3-5 bullets]

---

## 💡 Balanced Idea Assessment

### ✅ What Both Brains Agreed Is Strong
(The strengths that even the skeptic couldn't deny)

### ❌ What Both Brains Agreed Is Risky
(The risks that even the optimist had to admit are real)

### ⚡ Where the Brains Disagreed — And the Verdict
(The key point of disagreement, and your final call on who was right)

---

## 🏆 Competitive Landscape
(Real competitors, positioning, and how this idea differentiates)

---

## ⚠️ Top 5 Risk Mitigation Priorities
| Risk | Severity | How to Mitigate |
|------|----------|-----------------|
| ... | 🔴 High / 🟡 Med / 🟢 Low | ... |

---

## 💰 Path to Revenue
(Specific, realistic Year 1, Year 2, Year 3 projections)

---

## 🚀 The 3 Critical First Moves
(Specific, actionable next steps for THIS idea — not generic advice)

---

## 🎓 Chief Analyst Verdict
(Your definitive, final verdict. Should they pursue this? What ONE assumption must they validate first? What would make this fundable?)

---

Be specific to THIS idea. Generic advice is unacceptable. This report represents two AI brains and a synthesis — it should be the most thorough, battle-tested analysis money can't normally buy.`;

    // ── STEP 3: Stream the synthesis to the client ───────────────────────────
    const synthesisRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'assistant', content: synthesisPrompt },
          { role: 'user', content: 'Synthesize the two brain analyses into the final comprehensive dual-brain validation report now.' }
        ],
        temperature: 0.75,
        top_p: 0.95,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!synthesisRes.ok) throw new Error(`Synthesis brain failed: ${synthesisRes.statusText}`);

    // Stream the final synthesis directly to the client
    return new Response(synthesisRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[POST /api/ai/idea-validator]', error);
    return NextResponse.json({ success: false, error: 'Dual-brain analysis failed. Please try again.' }, { status: 500 });
  }
}
