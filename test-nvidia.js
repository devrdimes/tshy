const fs = require('fs');

async function testNvidia() {
  const nvidiaApiKey = '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'; // using the key from user input
  const prompt = `You are an elite VC pitch deck expert. Respond in English only.

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

Make every slide SPECIFIC to this business. Compelling investor language. No generic content.`;

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate pitch deck for:\n\nName: Uber for Dogs\nDescription: A mobile app that connects dog owners with dog walkers.' }
        ],
        temperature: 0.65,
        top_p: 0.9,
        max_tokens: 2500,
      })
    });
    
    if (!res.ok) {
      console.log('Error:', res.status, await res.text());
      return;
    }
    
    const data = await res.json();
    console.log('Response content length:', data.choices?.[0]?.message?.content?.length);
    console.log('Response content preview:', data.choices?.[0]?.message?.content?.substring(0, 500));
    console.log('--- END OF PREVIEW ---');
    console.log('Last 200 chars:', data.choices?.[0]?.message?.content?.slice(-200));

    // Try parsing
    const responseText = data.choices?.[0]?.message?.content;
    const startObj = responseText.indexOf('{');
    const startArr = responseText.indexOf('[');
    const startIndex = startObj !== -1 && startArr !== -1 ? Math.min(startObj, startArr) : Math.max(startObj, startArr);
    
    const endObj = responseText.lastIndexOf('}');
    const endArr = responseText.lastIndexOf(']');
    const endIndex = endObj !== -1 && endArr !== -1 ? Math.max(endObj, endArr) : Math.max(endObj, endArr);
    
    const jsonStr = responseText.substring(startIndex, endIndex + 1);
    console.log('Valid JSON:', !!JSON.parse(jsonStr));

  } catch (e) {
    console.log('Exception:', e);
  }
}

testNvidia();
