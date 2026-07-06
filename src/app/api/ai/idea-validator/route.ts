import { NextRequest, NextResponse } from 'next/server';

// ── Helper: call an OpenAI-compatible endpoint, returns full text (non-streaming) ──
async function callBrain(
  apiUrl: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  temperature = 0.75
): Promise<string> {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
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
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Brain call failed (${modelName}): ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

// POST /api/ai/idea-validator — Dual AI brain analysis (GLM + Kimi)
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

    // ── API Keys for the Two Brains ──
    // Brain 1 uses the primary key (GLM 5.2, already used in SaaS)
    const glmApiKey = process.env.GLM_API_KEY || process.env.NVIDIA_API_KEY;
    // Brain 2 uses the Kimi 2.6 key the user provided
    const kimiApiKey = process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY;

    if (!glmApiKey || !kimiApiKey) {
      return NextResponse.json({ success: false, error: 'API keys for Brain 1 and Brain 2 are not configured' }, { status: 500 });
    }

    const answersText = Object.entries(answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const langInstruction = langInstructions[lang];

    // ── BRAIN 1: The Skeptical VC (Powered by GLM 5.2) ────────────────────────
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
5. **Market Timing Issues** — Why the timing might be wrong
6. **Your Skeptical Score** — Give a single score (0-100%) for Overall Success Probability with your reasoning

Be brutally honest. Do NOT sugarcoat. Short, sharp, punchy sentences. Maximum 600 words.`;

    // ── BRAIN 2: The Growth Strategist (Powered by Kimi 2.6) ──────────────────
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

    // ── STEP 1: Run both brains in PARALLEL with their respective APIs ──
    const [brain1Analysis, brain2Analysis] = await Promise.all([
      // Brain 1: GLM-5.2
      callBrain(
        'https://integrate.api.nvidia.com/v1/chat/completions', // Update base URL if not on NVIDIA
        glmApiKey,
        'meta/llama-3.1-8b-instruct', // Model name for Brain 1
        brain1Prompt,
        `Analyze this startup idea:\n\n${answersText}`,
        0.8
      ).catch(e => `Brain 1 Analysis Failed: ${e.message}`),
      
      // Brain 2: Kimi-2.6
      callBrain(
        'https://integrate.api.nvidia.com/v1/chat/completions', // Update base URL if not on NVIDIA
        kimiApiKey,
        'meta/llama-3.1-8b-instruct', // Model name for Brain 2
        brain2Prompt,
        `Analyze this startup idea:\n\n${answersText}`,
        0.7
      ).catch(e => `Brain 2 Analysis Failed: ${e.message}`)
    ]);

    // ── STEP 2: Synthesis Brain — reads both, produces final unified report ──
    const synthesisPrompt = `You are the Chief Analysis Officer — the final decision-maker in a top-tier VC firm. You have received two internal assessments of a startup idea.

${langInstruction}

**Internal Assessment 1 (Risks & Flaws):**
${brain1Analysis}

---

**Internal Assessment 2 (Opportunities & Strengths):**
${brain2Analysis}

---

Your job is to SYNTHESIZE both assessments into ONE definitive, highly professional VC validation report. 
CRITICAL RULES:
- Do NOT mention "Brain 1", "Brain 2", "Internal Assessment", or multiple analysts. 
- Present the report as a single, unified analysis from our elite VC firm.
- The final score must be a BALANCED result of the risks and opportunities.
- In the "Scoring Dashboard" table, you must include a row with the exact metric name "Overall Success Probability" so our system can parse the score.

Structure your final report with rich markdown formatting, emojis, tables, and bold text:

---

# 🔬 VC Idea Validation Report

> *An elite, professional analysis of your startup idea*

## 📊 Scoring Dashboard

| Metric | Score | Rating |
|--------|-------|--------|
| Overall Success Probability | X% | ⭐⭐⭐ |
| Market Opportunity | X% | ⭐⭐⭐ |
| Problem-Solution Fit | X% | ⭐⭐⭐ |
| Competitive Moat | X% | ⭐⭐⭐ |
| Team & Execution Readiness | X% | ⭐⭐⭐ |
| Financial Viability | X% | ⭐⭐⭐ |
| Timing & Market Readiness | X% | ⭐⭐⭐ |

Rating: ⭐ = Weak (0-40%) · ⭐⭐ = Moderate (41-69%) · ⭐⭐⭐ = Strong (70-100%)

---

## 🎯 Market Analysis
- **Total Addressable Market (TAM):** [number]
- **Serviceable Addressable Market (SAM):** [number]
- **Serviceable Obtainable Market (SOM):** [3-year target]
- **Market Growth Rate:** [%/year]
- **Key Trends:** [3-5 bullets]

---

## 💡 Comprehensive Idea Assessment

### ✅ Key Strengths & Opportunities
(What makes this idea uniquely powerful and scalable)

### ❌ Critical Risks & Flaws
(The most dangerous assumptions and weaknesses that must be addressed)

---

## 🏆 Competitive Landscape
(Real competitors, positioning, and how this idea differentiates)

---

## ⚠️ Top Risk Mitigation Priorities
| Risk | Severity | How to Mitigate |
|------|----------|-----------------|
| ... | 🔴 High / 🟡 Med / 🟢 Low | ... |

---

## 💰 Path to Revenue
(Specific, realistic Year 1, Year 2, Year 3 projections)

---

## 🚀 Recommended Next Steps
(Specific, actionable next steps for THIS idea — not generic advice)

---

## 🎓 Final Verdict
(Your definitive, final verdict. Should they pursue this? What ONE assumption must they validate first?)

---

Be specific to THIS idea. Generic advice is unacceptable. Provide the most thorough, battle-tested analysis possible.`;

    // ── STEP 3: Stream the synthesis to the client (Using GLM key for synthesis) ──
    const synthesisRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${glmApiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct', // using fast model for the final synthesis
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

    if (!synthesisRes.ok) {
      const errorText = await synthesisRes.text();
      throw new Error(`Synthesis brain failed: ${synthesisRes.statusText} - ${errorText}`);
    }

    // Stream the final synthesis directly to the client
    return new Response(synthesisRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[POST /api/ai/idea-validator]', error);
    return NextResponse.json({ success: false, error: error.message || 'Dual-brain analysis failed.' }, { status: 500 });
  }
}
