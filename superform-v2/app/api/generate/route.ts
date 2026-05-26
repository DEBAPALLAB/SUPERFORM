import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder",
  });
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }
    const { intent } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Superform AI, a high-end form designer. 
          Generate a JSON structure for a form based on the user's intent. 
          Respond ONLY with a valid JSON object.
          
          Types allowed: "short", "long", "multiple", "yesno", "rating", "email", "phone".
          Aesthetics allowed: "Minimal", "Editorial", "Glass", "Brutalist", "Cinematic".
          Surfaces: "Flat", "Card", "Glass", "Frame".
          Typography: "SM", "MD", "LG", "XL".
          Radius: "NONE", "SM", "MD", "Full".

          Example JSON:
          {
            "title": "Form Title",
            "questions": [
              { "id": 1, "type": "short", "label": "Question?", "placeholder": "...", "description": "...", "required": true, "maxChars": 100, "buttonText": "Continue" }
            ],
            "aesthetic": "Editorial",
            "surface": "Flat",
            "typography": "MD",
            "radius": "SM"
          }`
        },
        {
          role: "user",
          content: `Intent: ${intent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || "{}"));
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate form" }, { status: 500 });
  }
}
