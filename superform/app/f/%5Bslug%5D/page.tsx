'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import type { Question, Form, FormStyle, ArtDirectionKey } from '@/types';
import { generateId, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function RespondentInput({ question, value, onChange, artDirection }: {
  question: Question; value: string; onChange: (v: string) => void; artDirection: ArtDirectionKey;
}) {
  const inputBase = "bg-transparent border-b border-[var(--color-rule)] outline-none py-3 font-mono text-lg transition-all focus:border-[var(--color-ink)] w-full max-w-[440px] placeholder:italic placeholder:text-[var(--color-muted)]";
  
  switch (question.type) {
    case 'short_text': case 'email': case 'phone':
      return <input value={value} onChange={e => onChange(e.target.value)} placeholder={question.placeholder || 'Type here...'} className={inputBase} autoFocus />;
    case 'long_text':
      return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={question.placeholder || 'Share your thoughts...'} className={cn(inputBase, "min-h-[140px] resize-none")} autoFocus />;
    case 'multiple_choice':
      return (
        <div className="grid grid-cols-1 gap-2 mt-6 max-w-[440px]">
          {(question.options || []).map((opt, i) => {
            const isSelected = value === opt.id;
            return (
              <button key={opt.id} onClick={() => onChange(opt.id)}
                className={cn("choice-card group !py-3 !px-4", isSelected && "selected")}>
                <span className={cn("font-mono text-[9px] w-5 h-5 border border-[var(--color-rule)] flex items-center justify-center transition-colors", isSelected ? "border-white" : "group-hover:border-[var(--color-ink)]")}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-[13px] text-left">{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-2 mt-6 overflow-x-auto pb-4 no-scrollbar">
          {Array.from({ length: question.maxRating || 10 }, (_, i) => {
            const isSelected = parseInt(value) === i + 1;
            return (
              <button key={i} onClick={() => onChange(String(i + 1))}
                className={cn("rating-btn !w-12 !h-12 !text-xs shrink-0", isSelected && "active")}>
                {i + 1}
              </button>
            );
          })}
        </div>
      );
    case 'yes_no':
      return (
        <div className="flex gap-3 mt-6 max-w-[340px]">
          {['yes', 'no'].map((v) => {
            const isSelected = value === v;
            return (
              <button key={v} onClick={() => onChange(v)}
                className={cn("choice-card flex-1 justify-center !py-5", isSelected && "selected")}>
                <span className="font-mono text-[10px] uppercase tracking-widest">{v}</span>
              </button>
            );
          })}
        </div>
      );
    default:
      return <input value={value} onChange={e => onChange(e.target.value)} className={inputBase} autoFocus />;
  }
}

export default function RespondentPage({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState<Form | null>(null);
  const [style, setStyle] = useState<FormStyle | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [responseId] = useState(generateId());

  useEffect(() => {
    async function load() {
      // Fetch Form (Check by slug, allow any status for testing)
      const { data: formData, error: fErr } = await supabase
        .from('forms')
        .select('*')
        .eq('slug', params.slug)
        .single();
      
      if (!formData) { console.error('Form not found:', fErr); setLoading(false); return; }
      setForm(formData as Form);

      // Fetch Questions
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formData.id)
        .order('order', { ascending: true });
      setQuestions((qs || []) as Question[]);

      // Fetch Style
      const { data: styleData } = await supabase
        .from('form_styles')
        .select('*')
        .eq('form_id', formData.id)
        .single();
      setStyle(styleData as FormStyle);
      
      setLoading(false);
    }
    load();
  }, [params.slug]);

  const advance = useCallback(() => {
    const q = questions[currentIndex];
    if (!q) return;
    if (q.required && !answers[q.id]) return;

    if (currentIndex >= questions.length - 1) {
      setIsDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, questions, answers]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') advance();
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-16 h-0.5 bg-[var(--color-rule)] overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-[var(--color-ink)] w-full animate-progress" />
      </div>
      <style>{`@keyframes progress{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}} .animate-progress{animation:progress 1s ease-in-out infinite}`}</style>
    </div>
  );

  if (!form) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--color-canvas)] text-center p-6">
      <h1 className="font-display text-4xl mb-4">404 — Not Found</h1>
      <p className="label-caps">The form you are looking for does not exist.</p>
    </div>
  );

  const artDirection: ArtDirectionKey = style?.art_direction || 'minimal';
  const theme = THEME_STYLES[artDirection];
  const btnStyle = CONTINUE_BTN_STYLES[artDirection];
  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={theme}>
      {/* Progress */}
      <div className="h-1 bg-[var(--color-rule)]/20 sticky top-0 z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${isDone ? 100 : progress}%` }}
          className="h-full bg-[var(--color-ink)]"
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative p-8">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div 
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <h2 className="font-editorial text-5xl italic">Thank you.</h2>
              <p className="label-caps opacity-40">Your response has been recorded.</p>
            </motion.div>
          ) : q ? (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-[640px] flex flex-col justify-center min-h-[400px]"
            >
              <div className="space-y-1 mb-8 opacity-40">
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase">
                   {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <div className="h-px w-8 bg-current" />
              </div>

              <h2 className={cn(
                "mb-4 leading-tight",
                artDirection === 'brutalist' ? "font-mono font-black uppercase text-2xl tracking-tighter" : "font-editorial text-3xl italic"
              )}>
                {q.title}
                {q.required && <span className="text-[var(--color-error)] ml-2 text-sm">*</span>}
              </h2>

              {q.description && (
                <p className="font-editorial text-lg opacity-60 mb-10 max-w-[480px]">
                  {q.description}
                </p>
              )}

              <div className="mt-2">
                <RespondentInput 
                  question={q} 
                  value={answers[q.id] || ''} 
                  onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))} 
                  artDirection={artDirection} 
                />
              </div>

              <div className="mt-16 flex items-center gap-6">
                <button 
                  onClick={advance}
                  style={{ ...btnStyle, padding: '14px 40px' }} 
                  className="btn-primary"
                >
                  {currentIndex === questions.length - 1 ? 'Submit' : 'Continue'}
                </button>
                <span className="label-caps !text-current !tracking-[0.1em] opacity-30 text-[9px]">Press Enter ↵</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      {!isDone && currentIndex > 0 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button onClick={goBack} className="label-caps hover:opacity-100 opacity-40 transition-opacity">
            ← Previous
          </button>
        </div>
      )}
    </div>
  );
}
