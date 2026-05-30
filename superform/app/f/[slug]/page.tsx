'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import type { Question, Form, FormStyle, ArtDirectionKey, RadiusKey, TypographyKey } from '@/types';
import { generateId } from '@/lib/utils';

const RADIUS_MAP: Record<RadiusKey, string> = { none: '0', sm: '4px', md: '8px', full: '9999px' };
const TYPO_SIZES: Record<TypographyKey, string> = { sm: 'clamp(24px,3.5vw,36px)', md: 'clamp(28px,4vw,48px)', lg: 'clamp(32px,5vw,56px)', xl: 'clamp(40px,6vw,72px)' };

function RespondentInput({ question, value, onChange, artDirection }: {
  question: Question; value: string; onChange: (v: string) => void; artDirection: ArtDirectionKey;
}) {
  const theme = THEME_STYLES[artDirection];
  const inputStyle: React.CSSProperties = {
    borderBottom: `1px solid ${artDirection === 'cinematic' ? '#2A2A2A' : 'var(--color-rule)'}`,
    background: 'transparent', outline: 'none', fontFamily: "'DM Mono',monospace",
    fontSize: '18px', color: theme.color as string, width: '100%', padding: '12px 0',
  };

  switch (question.type) {
    case 'short_text': case 'email': case 'phone':
      return <input value={value} onChange={e => onChange(e.target.value)} placeholder={question.placeholder || 'Type your answer...'} style={inputStyle} className="placeholder:text-[var(--color-muted)] placeholder:italic" autoFocus />;
    case 'long_text':
      return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={question.placeholder || 'Tell us more...'} style={{ ...inputStyle, minHeight: '120px', resize: 'none' }} className="placeholder:text-[var(--color-muted)] placeholder:italic" autoFocus />;
    case 'multiple_choice': {
      const opts = question.options || [];
      return (
        <div className="space-y-3 w-full">
          {opts.map((opt, i) => {
            const isSelected = value === opt.id;
            return (
              <button key={opt.id} onClick={() => onChange(opt.id)}
                className="w-full flex items-center gap-4 p-4 border transition-all text-left"
                style={{ borderColor: isSelected ? theme.color as string : 'var(--color-rule)', background: isSelected ? theme.color as string : 'transparent', color: isSelected ? (artDirection === 'cinematic' ? '#0D0D0D' : 'white') : theme.color as string }}>
                <span className="font-mono text-[11px] border border-current px-2 py-0.5 shrink-0">{String.fromCharCode(65 + i)}</span>
                <span className="font-editorial text-lg">{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    }
    case 'yes_no':
      return (
        <div className="flex gap-4 w-full">
          {['yes', 'no'].map(v => {
            const isSelected = value === v;
            return (
              <button key={v} onClick={() => onChange(v)}
                className="flex-1 h-20 border flex items-center justify-center gap-3 transition-all font-mono text-sm"
                style={{ borderColor: isSelected ? theme.color as string : 'var(--color-rule)', background: isSelected ? theme.color as string : 'transparent', color: isSelected ? 'white' : theme.color as string }}>
                <span className="text-[11px] border border-current px-2 py-0.5">{v === 'yes' ? 'Y' : 'N'}</span>
                {v.toUpperCase()}
              </button>
            );
          })}
        </div>
      );
    case 'rating': {
      const max = question.maxRating || 10;
      const num = parseInt(value) || 0;
      return (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: max }, (_, i) => (
            <button key={i} onClick={() => onChange(String(i + 1))}
              className="w-10 h-10 border font-mono text-[13px] transition-all flex items-center justify-center"
              style={{ background: i < num ? theme.color as string : 'transparent', color: i < num ? 'white' : theme.color as string, borderColor: i < num ? theme.color as string : 'var(--color-rule)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      );
    }
    case 'date':
      return (
        <div className="flex items-center gap-3">
          {['MM', 'DD', 'YYYY'].map((p, i) => (
            <div key={p} className="flex items-center gap-3">
              <input placeholder={p} style={{ ...inputStyle, width: p === 'YYYY' ? '64px' : '44px' }} className="placeholder:text-[var(--color-muted)]" />
              {i < 2 && <span style={{ color: theme.color as string, opacity: 0.3 }}>/</span>}
            </div>
          ))}
        </div>
      );
    default:
      return <input value={value} onChange={e => onChange(e.target.value)} placeholder="Type your answer..." style={inputStyle} className="placeholder:text-[var(--color-muted)] placeholder:italic" autoFocus />;
  }
}

export default function RespondentPage({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState<Form | null>(null);
  const [style, setStyle] = useState<FormStyle | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [responseId] = useState(generateId());
  const [showHint, setShowHint] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const hintTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    async function load() {
      const { data: formData } = await supabase.from('forms').select('*').eq('slug', params.slug).eq('is_published', true).single();
      if (!formData) { setLoading(false); return; }
      setForm(formData as Form);

      const { data: qs } = await supabase.from('questions').select('*').eq('form_id', formData.id).order('order');
      setQuestions((qs || []) as Question[]);

      const { data: styleData } = await supabase.from('form_styles').select('*').eq('form_id', formData.id).single();
      setStyle(styleData as FormStyle | null);
      setLoading(false);

      // Record response start
      await supabase.from('responses').insert({ id: responseId, form_id: formData.id, started_at: new Date().toISOString() });
    }
    load();
  }, [params.slug, responseId]);

  const resetHint = useCallback(() => {
    setShowHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 3000);
  }, []);

  useEffect(() => { resetHint(); }, [currentIndex, resetHint]);

  const artDirection: ArtDirectionKey = style?.art_direction || 'minimal';
  const typography: TypographyKey = style?.typography || 'md';
  const radius: RadiusKey = style?.radius || 'none';
  const theme = THEME_STYLES[artDirection];
  const btnStyle = CONTINUE_BTN_STYLES[artDirection];
  const q = questions[currentIndex];

  const getTransition = () => {
    switch (artDirection) {
      case 'brutalist': return 'none';
      case 'cinematic': return 'all 600ms ease-in-out';
      case 'glass': return 'all 300ms ease';
      default: return 'all 250ms ease';
    }
  };

  const advance = useCallback(async () => {
    if (!q) return;
    const answer = answers[q.id] || '';
    if (q.required && !answer.trim()) return;

    // Save answer
    try {
      await supabase.from('answers').insert({ id: generateId(), response_id: responseId, question_id: q.id, value: answer, created_at: new Date().toISOString() });
    } catch (e) { console.error(e); }

    if (currentIndex >= questions.length - 1) {
      // Complete response
      await supabase.from('responses').update({ completed_at: new Date().toISOString() }).eq('id', responseId);
      setIsDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
    resetHint();
  }, [q, answers, currentIndex, questions.length, responseId, resetHint]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) { setCurrentIndex(i => i - 1); resetHint(); }
  }, [currentIndex, resetHint]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); advance(); }
      if (e.key === 'Escape') goBack();
      // Letter shortcuts for multiple choice
      if (q?.type === 'multiple_choice') {
        const idx = e.key.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < (q.options?.length || 0)) {
          setAnswers(prev => ({ ...prev, [q.id]: q.options![idx].id }));
        }
      }
      if (q?.type === 'yes_no') {
        if (e.key.toLowerCase() === 'y') setAnswers(prev => ({ ...prev, [q.id]: 'yes' }));
        if (e.key.toLowerCase() === 'n') setAnswers(prev => ({ ...prev, [q.id]: 'no' }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack, q]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: theme.background as string }}>
      <div className="w-32 h-0.5 bg-[var(--color-rule)] overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-[var(--color-ink)] w-full" style={{ animation: 'slide-rule 1s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );

  if (!form) return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-paper)]">
      <div className="text-center space-y-4">
        <h1 className="font-display text-6xl tracking-wider">404</h1>
        <p className="font-mono text-[11px] text-[var(--color-muted)] uppercase tracking-widest">Form not found</p>
      </div>
    </div>
  );

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const bgStyle = artDirection === 'glass' ? { background: 'linear-gradient(135deg, #e8e8f8, #f0e8e8)' } : { background: theme.background as string };

  return (
    <div className="min-h-screen flex flex-col" style={{ ...bgStyle, fontFamily: theme.fontFamily, transition: getTransition() }}>
      {/* Progress bar */}
      <div className="h-0.5 shrink-0" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full transition-all duration-[250ms]" style={{ width: `${isDone ? 100 : progress}%`, background: theme.color as string }} />
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {isDone ? (
          <div className="text-center max-w-lg">
            {form.settings?.ending_type === 'redirect' && form.settings?.ending_redirect_url ? (
              <p className="font-editorial text-2xl italic" style={{ color: theme.color as string }}>Redirecting...</p>
            ) : (
              <p className="font-editorial text-5xl italic font-medium" style={{ color: theme.color as string }}>Thank you.</p>
            )}
          </div>
        ) : q ? (
          <div key={currentIndex} className="w-full max-w-2xl" style={{ transition: getTransition() }}>
            <div style={{ ...theme, borderRadius: RADIUS_MAP[radius], padding: '48px 56px' }}>
              <div className="font-mono text-[10px] mb-6" style={{ color: theme.color as string, opacity: 0.4 }}>
                {String(currentIndex + 1).padStart(2, '0')} →
              </div>
              <h2 style={{ fontFamily: artDirection === 'brutalist' ? "'DM Mono',monospace" : "'Cormorant Garamond',serif", fontSize: TYPO_SIZES[typography], fontWeight: artDirection === 'brutalist' ? 900 : 500, lineHeight: 1.1, color: theme.color as string, marginBottom: '32px' }}>
                {q.title}
                {q.required && <span className="text-[var(--color-error)] ml-1">*</span>}
              </h2>

              {q.description && (
                <p className="font-editorial text-lg italic mb-8" style={{ color: theme.color as string, opacity: 0.6 }}>{q.description}</p>
              )}

              {q.type !== 'statement' && (
                <div className="mb-10">
                  <RespondentInput question={q} value={answers[q.id] || ''} onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))} artDirection={artDirection} />
                </div>
              )}

              {q.type === 'statement' ? (
                <button onClick={advance} className="font-mono text-[10px] uppercase tracking-widest border-b transition-colors" style={{ color: theme.color as string, borderColor: theme.color as string }}>
                  CONTINUE →
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={advance} style={{ ...btnStyle, padding: '14px 28px', fontFamily: "'DM Mono',monospace", fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {currentIndex === questions.length - 1 ? 'SUBMIT →' : 'CONTINUE →'}
                  </button>
                  <span className="font-mono text-[10px] transition-opacity duration-300" style={{ color: theme.color as string, opacity: showHint ? 0.4 : 0 }}>
                    PRESS ENTER →
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Back nav */}
      {currentIndex > 0 && !isDone && (
        <div className="pb-8 flex justify-center">
          <button onClick={goBack} className="font-mono text-[10px] uppercase tracking-widest transition-colors" style={{ color: theme.color as string, opacity: 0.4 }}>
            ← BACK
          </button>
        </div>
      )}
    </div>
  );
}
