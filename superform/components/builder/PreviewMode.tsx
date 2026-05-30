'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import { cn } from '@/lib/utils';
import { Monitor, Smartphone } from 'lucide-react';
import type { QuestionType } from '@/types';

const TYPO_SIZES = { sm: 'clamp(22px,3vw,32px)', md: 'clamp(28px,4vw,42px)', lg: 'clamp(32px,5vw,52px)', xl: 'clamp(40px,6vw,64px)' };

function PreviewInput({ type, options, placeholder, color, maxRating }: {
  type: QuestionType; options?: { id: string; label: string }[]; placeholder?: string; color?: string; maxRating?: number;
}) {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  const inputStyle: React.CSSProperties = { borderBottom: '1px solid var(--color-rule)', background: 'transparent', outline: 'none', fontFamily: "'DM Mono',monospace", fontSize: '16px', color, width: '100%', padding: '8px 0' };

  switch (type) {
    case 'short_text': case 'email': case 'phone':
      return <input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder || 'Type your answer...'} style={inputStyle} className="placeholder:text-[var(--color-muted)] placeholder:italic" />;
    case 'long_text':
      return <textarea value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder || 'Tell us more...'} style={{ ...inputStyle, minHeight: '120px', resize: 'none' }} className="placeholder:text-[var(--color-muted)] placeholder:italic" />;
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {(options || []).map((opt, i) => (
            <div key={opt.id} onClick={() => setSelected(opt.id)} className={cn('choice-card cursor-pointer', selected === opt.id ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]' : '')} style={{ color: selected === opt.id ? 'white' : color }}>
              <span className="font-mono text-[10px] border border-current px-1.5 py-0.5">{String.fromCharCode(65 + i)}</span>
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      );
    case 'yes_no':
      return (
        <div className="flex gap-4">
          {['YES', 'NO'].map(label => (
            <div key={label} onClick={() => setSelected(label)}
              className="flex-1 h-16 border flex items-center justify-center gap-3 cursor-pointer transition-all font-mono text-sm"
              style={{ background: selected === label ? 'var(--color-ink)' : 'transparent', color: selected === label ? 'white' : color, borderColor: selected === label ? 'var(--color-ink)' : 'var(--color-rule)' }}>
              <span className="text-[10px] border border-current px-1.5 py-0.5">{label === 'YES' ? 'Y' : 'N'}</span>
              {label}
            </div>
          ))}
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: maxRating || 10 }, (_, i) => (
            <button key={i} onClick={() => setRating(i + 1)}
              className="rating-btn"
              style={{ background: rating !== null && i < rating ? 'var(--color-ink)' : 'transparent', color: rating !== null && i < rating ? 'white' : color, borderColor: 'var(--color-rule)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      );
    case 'date':
      return (
        <div className="flex items-center gap-2">
          {['MM', 'DD', 'YYYY'].map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <input placeholder={p} style={{ ...inputStyle, width: p === 'YYYY' ? '60px' : '40px' }} className="placeholder:text-[var(--color-muted)]" />
              {i < 2 && <span style={{ color, opacity: 0.3 }}>/</span>}
            </div>
          ))}
        </div>
      );
    default:
      return <input value={value} onChange={e => setValue(e.target.value)} placeholder="Type your answer..." style={inputStyle} className="placeholder:text-[var(--color-muted)] placeholder:italic" />;
  }
}

export function PreviewMode({ onBack }: { onBack: () => void }) {
  const { questions, artDirection, surface, typography, radius } = useBuilderStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const theme = THEME_STYLES[artDirection];
  const btnStyle = CONTINUE_BTN_STYLES[artDirection];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const q = questions[currentIndex];
  const isDone = currentIndex >= questions.length;

  const RADIUS_MAP = { none: '0', sm: '4px', md: '8px', full: '9999px' };
  const titleSize = TYPO_SIZES[typography];

  const advance = useCallback(() => {
    if (currentIndex < questions.length) { setDirection('forward'); setCurrentIndex(i => i + 1); }
  }, [currentIndex, questions.length]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) { setDirection('back'); setCurrentIndex(i => i - 1); }
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') advance();
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack]);

  const transitionDuration = artDirection === 'brutalist' ? '0ms' : artDirection === 'cinematic' ? '600ms' : '250ms';

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--color-canvas)' }}>
      {/* Progress bar */}
      <div className="h-0.5 bg-[var(--color-rule)] shrink-0">
        <div className="h-full bg-[var(--color-ink)] transition-all duration-[250ms]" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div className="h-10 flex items-center justify-between px-6 shrink-0">
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
          ← BACK TO EDITOR
        </button>
        <div className="flex gap-1">
          {(['desktop', 'mobile'] as const).map(v => (
            <button key={v} onClick={() => setViewport(v)}
              className={cn('flex items-center gap-1 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all',
                viewport === v ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]')}>
              {v === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-6">
        <div style={{ width: viewport === 'mobile' ? '390px' : '680px', maxWidth: '100%', transition: 'width 250ms ease' }}>
          {isDone ? (
            <div className="text-center" style={{ fontFamily: "'Cormorant Garamond',serif", color: theme.color }}>
              <p style={{ fontSize: 'clamp(24px,4vw,48px)', fontStyle: 'italic', fontWeight: 500 }}>Thank you.</p>
              <button onClick={() => setCurrentIndex(0)} className="mt-8 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors border-b border-[var(--color-rule)]">
                Restart
              </button>
            </div>
          ) : q ? (
            <div key={currentIndex} className="space-y-8" style={{ ...theme, padding: '48px 56px', borderRadius: RADIUS_MAP[radius as keyof typeof RADIUS_MAP], boxShadow: surface === 'card' ? '0 8px 40px rgba(0,0,0,0.10)' : undefined, animationDuration: transitionDuration }}>
              <div className="font-mono text-[10px] text-[var(--color-muted)]">
                {String(currentIndex + 1).padStart(2, '0')} →
              </div>
              <h2 style={{ fontFamily: artDirection === 'brutalist' ? "'DM Mono',monospace" : "'Cormorant Garamond',serif", fontSize: titleSize, fontWeight: artDirection === 'brutalist' ? 900 : 500, lineHeight: 1.1, color: theme.color }}>
                {q.title}
                {q.required && <span className="text-[var(--color-error)] ml-1">*</span>}
              </h2>
              {q.description && <p className="font-editorial text-base italic opacity-60" style={{ color: theme.color }}>{q.description}</p>}
              <PreviewInput type={q.type} options={q.options} placeholder={q.placeholder} color={theme.color as string} maxRating={q.maxRating} />
              {q.type !== 'statement' && (
                <div className="flex items-center gap-4 pt-2">
                  <button onClick={advance} style={{ ...btnStyle, padding: '14px 28px', fontFamily: "'DM Mono',monospace", fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {currentIndex === questions.length - 1 ? 'SUBMIT →' : 'CONTINUE →'}
                  </button>
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">PRESS ENTER →</span>
                </div>
              )}
              {q.type === 'statement' && (
                <button onClick={advance} className="font-mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors border-b border-[var(--color-rule)]">
                  CONTINUE →
                </button>
              )}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-[var(--color-muted)] text-center">No questions added.</p>
          )}
        </div>
      </div>

      {/* Back button */}
      {currentIndex > 0 && !isDone && (
        <div className="pb-6 flex justify-center">
          <button onClick={goBack} className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
            ← BACK
          </button>
        </div>
      )}
    </div>
  );
}
