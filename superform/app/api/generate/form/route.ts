import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_MODEL = 'anthropic/claude-3.5-sonnet';

const SYSTEM_PROMPT = `You are a form strategy expert and UX researcher. 
Your job is to turn a user's stated intent into a perfectly structured form. 
You understand: which questions actually get answered (short is better), 
what order reduces drop-off (easy questions first, commitment questions last), 
which Art Direction matches the emotional register of the use case (hackathons = Editorial, corporate = Minimal, creative = Cinematic), 
and what data the form creator will actually need in 3 months.

Return ONLY valid JSON. No preamble. No explanation. No markdown fences. Raw JSON only.

Schema:
{
  "title": string,
  "description": string,
  "estimated_completion_seconds": number,
  "art_direction": "minimal"|"editorial"|"glass"|"brutalist"|"cinematic",
  "art_direction_rationale": string,
  "questions": [
    {
      "order": number,
      "type": "short_text"|"long_text"|"multiple_choice"|"yes_no"|"rating"|"email"|"phone"|"statement",
      "title": string,
      "description": string | null,
      "placeholder": string | null,
      "required": boolean,
      "options": string[] | null,
      "rationale": string,
      "drop_off_risk": "low"|"medium"|"high"
    }
  ],
  "strategy_notes": string
}`;

export async function POST(req: NextRequest) {
  try {
    const { intent } = await req.json();
    if (!intent) return NextResponse.json({ error: 'Intent is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Superform V2',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: intent }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`AI API failed: ${response.status}`);

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    // Cleanup and Parse
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const form = JSON.parse(cleaned);

    return NextResponse.json({ form });
  } catch (err: any) {
    console.error('Generation Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
