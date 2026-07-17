


export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { situation, emergencyType, numberLabel } = req.body;

  if (!situation || situation.trim() === '') {
    return res.status(400).json({ error: 'No situation text provided' });
  }

  
  
  
  const prompt = `
You are an emergency assistant for Indian highway situations.
The system has already determined this is a "${emergencyType}" situation, and the correct number to call is ${numberLabel}.

User's description: "${situation}"

Respond ONLY in valid JSON, with no extra text, no markdown, in this exact format:
{
  "actionSteps": ["step 1", "step 2", "step 3"],
  "shareableMessage": "a short message the user can read aloud or send to someone, describing the emergency and location clearly"
}

Keep actionSteps to 3-4 short, practical, safety-focused steps.
Keep shareableMessage under 40 words.
`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await geminiResponse.json();

    
    console.log('Gemini HTTP status:', geminiResponse.status);
    console.log('Gemini raw response:', JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(`Gemini API returned an error: ${data.error.message}`);
    }

    
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (rawText === '') {
      throw new Error('Gemini returned no text content. Check the debug log above.');
    }

    
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleanText);

    return res.status(200).json({
      success: true,
      emergencyType,
      numberLabel,
      actionSteps: parsed.actionSteps,
      shareableMessage: parsed.shareableMessage
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI assistant is temporarily unavailable. Please call the number shown above directly.'
    });
  }
}