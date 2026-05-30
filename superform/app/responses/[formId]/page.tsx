'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Question, Answer } from '@/types';

interface ResponseRow {
  id: string;
  started_at: string;
  completed_at?: string;
  answers: Answer[];
}

export default function ResponsesPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [formTitle, setFormTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeResponse, setActiveResponse] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: form } = await supabase.from('forms').select('title').eq('id', formId).single();
      setFormTitle(form?.title || 'Form');

      const { data: qs } = await supabase.from('questions').select('*').eq('form_id', formId).order('order');
      setQuestions((qs || []) as Question[]);

      const { data: rs } = await supabase.from('responses').select('*, answers(*)').eq('form_id', formId).order('started_at', { ascending: false });
      setResponses((rs || []) as ResponseRow[]);
      setLoading(false);
    }
    load();
  }, [formId]);

  const completed = responses.filter(r => r.completed_at).length;
  const completionRate = responses.length > 0 ? Math.round((completed / responses.length) * 100) : 0;

  const getAnswerValue = (response: ResponseRow, questionId: string) => {
    return response.answers?.find(a => a.question_id === questionId)?.value || '—';
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="h-14 border-b border-[var(--color-rule)] flex items-center justify-between px-8 sticky top-0 bg-[var(--color-paper)] z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-display text-xl tracking-wider">SUPERFORM</Link>
          <span className="text-[var(--color-muted)] font-mono text-[10px]">/</span>
          <span className="font-mono text-[12px] text-[var(--color-muted)]">{formTitle}</span>
          <span className="text-[var(--color-muted)] font-mono text-[10px]">/</span>
          <span className="font-mono text-[12px]">RESPONSES</span>
        </div>
        <Link href={`/builder/${formId}`}>
          <button className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-[var(--color-rule)] hover:border-[var(--color-ink)] transition-colors">
            ← BACK TO BUILDER
          </button>
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-0 border border-[var(--color-rule)] mb-12">
          {[
            { label: 'Total Responses', value: responses.length },
            { label: 'Completed', value: completed },
            { label: 'Completion Rate', value: `${completionRate}%` },
          ].map((stat, i) => (
            <div key={i} className={`p-8 ${i < 2 ? 'border-r border-[var(--color-rule)]' : ''}`}>
              <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-2">{stat.label}</div>
              <div className="font-display text-5xl tracking-wider">{stat.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-32 h-0.5 bg-[var(--color-rule)] overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-[var(--color-ink)] w-full" style={{ animation: 'slide-rule 1s ease-in-out infinite' }} />
            </div>
            <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-5xl tracking-wider mb-4">NO RESPONSES YET.</h2>
            <p className="font-editorial text-lg italic text-[var(--color-muted)]">Share your form to start collecting responses.</p>
          </div>
        ) : (
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-4">{responses.length} Responses</div>

            {/* Response table */}
            <div className="border border-[var(--color-rule)] overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-canvas)]">
                    <th className="text-left p-4 font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] w-8">#</th>
                    <th className="text-left p-4 font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Submitted</th>
                    <th className="text-left p-4 font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Status</th>
                    {questions.slice(0, 3).map(q => (
                      <th key={q.id} className="text-left p-4 font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] max-w-[160px]">
                        <span className="truncate block">{q.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={r.id}
                      onClick={() => setActiveResponse(activeResponse === r.id ? null : r.id)}
                      className="border-b border-[var(--color-rule)] hover:bg-[var(--color-canvas)] transition-colors cursor-pointer">
                      <td className="p-4 font-mono text-[10px] text-[var(--color-muted)]">{String(i + 1).padStart(2, '0')}</td>
                      <td className="p-4 font-mono text-[10px]">
                        {new Date(r.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 ${r.completed_at ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]'}`}>
                          {r.completed_at ? 'COMPLETE' : 'PARTIAL'}
                        </span>
                      </td>
                      {questions.slice(0, 3).map(q => (
                        <td key={q.id} className="p-4 font-mono text-[11px] max-w-[160px]">
                          <span className="truncate block">{getAnswerValue(r, q.id)}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
