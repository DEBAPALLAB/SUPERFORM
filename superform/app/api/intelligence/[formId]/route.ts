import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CLAUDE_MODEL = 'anthropic/claude-3.5-sonnet';

export async function GET(req: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const formId = params.formId;
    const apiKey = process.env.OPENROUTER_API_KEY;

    // 1. Fetch all responses and questions for this form
    const { data: questions } = await supabase.from('questions').select('*').eq('form_id', formId).order('order');
    const { data: responses } = await supabase.from('responses').select('*, answers(*)').eq('form_id', formId);
    
    if (!questions || !responses) throw new Error('Data fetch failed');

    const totalResponses = responses.length;
    if (totalResponses === 0) return NextResponse.json({ error: 'No responses yet' });

    // 2. Compute Drop-off Map
    const dropOffMap = questions.map(q => {
      const answersForQ = responses.filter(r => r.answers.some((a: any) => a.question_id === q.id));
      return {
        question_id: q.id,
        title: q.title,
        count: answersForQ.length,
        percentage: (answersForQ.length / totalResponses) * 100
      };
    });

    // 3. Compute Completion Rate & Avg Time
    const completed = responses.filter(r => r.completed_at).length;
    const completionRate = (completed / totalResponses) * 100;
    
    const times = responses
      .filter(r => r.completed_at && r.started_at)
      .map(r => (new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime()) / 1000);
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    // 4. Compute Choice Distributions (Multiple Choice)
    const choiceDist: Record<string, Record<string, number>> = {};
    questions.filter(q => q.type === 'multiple_choice').forEach(q => {
      const counts: Record<string, number> = {};
      responses.forEach(r => {
        const ans = r.answers.find((a: any) => a.question_id === q.id);
        if (ans) counts[ans.value] = (counts[ans.value] || 0) + 1;
      });
      choiceDist[q.id] = counts;
    });

    // 5. AI Pattern Brief (Claude)
    let aiSummary = "Insufficient data for pattern briefing.";
    if (totalResponses >= 3 && apiKey) {
      const dataForAI = responses.map(r => ({
        id: r.id,
        answers: r.answers.map((a: any) => {
          const q = questions.find(qu => qu.id === a.question_id);
          return { q: q?.title, a: a.value };
        })
      }));

      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          messages: [{
            role: 'system',
            content: 'You are a research analyst. Given a set of form responses, write a 3-sentence plain-language summary of what the data shows. Focus on: who is responding, what they want, and what surprised you. Write in present tense. Be specific. No fluff.'
          }, {
            role: 'user',
            content: JSON.stringify(dataForAI)
          }]
        })
      });
      
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiSummary = aiData.choices?.[0]?.message?.content || aiSummary;
      }
    }

    // 6. Save to DB
    const intelligence = {
      form_id: formId,
      computed_at: new Date().toISOString(),
      completion_rate: completionRate,
      avg_completion_seconds: Math.round(avgTime),
      drop_off_by_question: dropOffMap,
      choice_distributions: choiceDist,
      ai_summary: aiSummary,
      response_count_at_compute: totalResponses
    };

    await supabase.from('form_intelligence').upsert(intelligence, { onConflict: 'form_id' });

    return NextResponse.json(intelligence);
  } catch (err: any) {
    console.error('Intelligence computation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
