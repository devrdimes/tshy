const fs = require('fs');

async function testNvidia() {
  const nvidiaApiKey = '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'; 
  const prompt = `You are an elite business strategist. Generate exactly 10 actionable business plan steps for the startup below. Be specific to this business — no generic advice.

Return ONLY a valid JSON object. No markdown, no text outside JSON.

Format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "2 sentences what this step is about",
      "category": "research|strategy|financial|legal|product|marketing|operations|team",
      "guidance": "Specific 2-3 sentence guidance for this exact business",
      "tips": "1-2 sentence expert tip",
      "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"],
      "resources": ["Tool/resource 1", "Tool/resource 2", "Tool/resource 3"],
      "estimatedDays": 14
    }
  ]
}

The 10 steps must cover: Market Research, Value Proposition, Business Model, Financial Planning, Legal Setup, Product Development, Marketing Strategy, Operations, Team Building, Launch Strategy. Tailor each step to the specific business context.`;

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
          { role: 'user', content: 'Generate the 10-step plan for:\n\nName: Uber for Dogs\nDescription: Dog walking app.' }
        ],
        temperature: 0.6,
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
    console.log('Last 200 chars:', data.choices?.[0]?.message?.content?.slice(-200));

    const responseText = data.choices?.[0]?.message?.content;
    try {
        JSON.parse(responseText);
        console.log("JSON parsed successfully directly");
    } catch (e) {
        console.log("JSON parse failed directly:", e.message);
        
        // Try the extraction logic
        const startObj = responseText.indexOf('{');
        const startArr = responseText.indexOf('[');
        const startIndex = startObj !== -1 && startArr !== -1 ? Math.min(startObj, startArr) : Math.max(startObj, startArr);
        
        const endObj = responseText.lastIndexOf('}');
        const endArr = responseText.lastIndexOf(']');
        const endIndex = endObj !== -1 && endArr !== -1 ? Math.max(endObj, endArr) : Math.max(endObj, endArr);
        
        const jsonStr = responseText.substring(startIndex, endIndex + 1);
        try {
            JSON.parse(jsonStr);
            console.log("JSON parsed after extraction");
        } catch (e2) {
            console.log("JSON parse still failed after extraction:", e2.message);
        }
    }

  } catch (e) {
    console.log('Exception:', e);
  }
}

testNvidia();
