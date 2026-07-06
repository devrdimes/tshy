const fs = require('fs');

async function testNvidia() {
  const nvidiaApiKey = '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'; // using the key from user input
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
}`;

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
          { role: 'user', content: 'Generate the 10-step plan for:\n\nName: My Startup Idea\nDescription: A mobile app that connects freelance chefs with busy professionals who want home-cooked meals delivered.' }
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
    console.log('Response content preview:', data.choices?.[0]?.message?.content?.substring(0, 500));
    console.log('--- END OF PREVIEW ---');
    console.log('Last 200 chars:', data.choices?.[0]?.message?.content?.slice(-200));
  } catch (e) {
    console.log('Exception:', e);
  }
}

testNvidia();
