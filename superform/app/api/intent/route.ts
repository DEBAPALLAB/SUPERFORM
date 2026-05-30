import { NextRequest, NextResponse } from 'next/server';

// Default model — override via OPENROUTER_MODEL env var
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

const SYSTEM_PROMPT = `You are a high-end form designer for "Superform". 
Generate a JSON schema for a form based on the user's intent. 

THEME OPTIONS: "minimal", "editorial", "brutalist", "cinematic".
QUESTION TYPES: "short_text", "long_text", "multiple_choice", "rating", "yes_no", "email", "statement".

STRICT RULES:
1. Generate EXACTLY 6-8 questions.
2. Return ONLY the JSON object. No intro text, no markdown code blocks.
3. Use this structure:
{
  "title": "Form Name",
  "artDirection": "minimal",
  "questions": [
    {
      "type": "short_text",
      "title": "Question Text",
      "description": "Subtext",
      "required": true,
      "options": [] 
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { intent } = await req.json();
    if (!intent) return NextResponse.json({ error: 'Intent is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing');

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    console.log('--- STARTING AI GENERATION ---');
    console.log('Intent:', intent);
    console.log('Model:', model);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Superform',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Intent: ${intent}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter Error:', err);
      return NextResponse.json({ error: 'AI Service Error' }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    console.log('--- AI RAW OUTPUT ---');
    console.log(rawText);
    console.log('--- END AI OUTPUT ---');

    // Clean up markdown fences if present
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      let form = JSON.parse(cleaned);
      
      // If AI already wrapped it in { "form": ... }, unwrap it
      if (form.form && typeof form.form === 'object' && !Array.isArray(form.form)) {
        form = form.form;
      }

      // Ensure it has questions
      const questions = form.questions || form.form?.questions;
      if (!questions || !Array.isArray(questions)) {
         throw new Error('Missing questions array');
      }
      
      return NextResponse.json({ form });
    } catch (parseErr) {
      console.error('JSON Parse Error. Cleaned text was:', cleaned);
      // Try to find JSON block manually if it still has junk
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json({ form: JSON.parse(jsonMatch[0]) });
      }
      throw parseErr;
    }

  } catch (err: any) {
    console.error('Generation failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
