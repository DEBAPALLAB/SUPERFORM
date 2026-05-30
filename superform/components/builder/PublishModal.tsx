'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface PublishModalProps {
  onClose: () => void;
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'error' }) {
  return (
    <div className={cn('w-2 h-2 rounded-full shrink-0', {
      'bg-[var(--color-success)]': status === 'ok',
      'bg-[var(--color-accent)]': status === 'warn',
      'bg-[var(--color-error)]': status === 'error',
    })} />
  );
}

function Confetti() {
  const colors = ['#C9A84C', '#111111', '#27AE60', '#C0392B', '#E8DCC8'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1}s`,
    size: `${Math.random() * 8 + 4}px`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece absolute" style={{ background: p.color, left: p.left, width: p.size, height: p.size, animationDelay: p.delay, top: '-20px' }} />
      ))}
    </div>
  );
}

export function PublishModal({ onClose }: PublishModalProps) {
  const { questions, artDirection, formSlug, setFormSlug, formId, issues } = useBuilderStore();
  const [slug, setSlug] = useState(formSlug);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasQuestions = questions.length > 0;
  const hasDesign = artDirection !== 'minimal';
  const hasRequired = questions.some(q => q.required);
  const hasError = !hasQuestions;

  const checklist = [
    { label: 'Questions added', status: hasQuestions ? 'ok' : 'error' as const, fix: null },
    { label: 'Design applied', status: hasDesign ? 'ok' : 'warn' as const, fix: null },
    {
      label: 'No questions marked required',
      status: hasRequired ? 'ok' : 'warn' as const,
      fix: !hasRequired ? 'Skip anyway' : null,
    },
    {
      label: 'Redirect URL not set',
      status: redirectUrl ? 'ok' : 'warn' as const,
      fix: !redirectUrl ? (
        <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." className="ml-2 font-mono text-[10px] border-b border-[var(--color-rule)] bg-transparent outline-none px-1 py-0.5 w-40" />
      ) : null,
    },
  ];

  const publish = async () => {
    if (hasError) return;
    setIsPublishing(true);
    try {
      setFormSlug(slug);
      await supabase.from('forms').update({ is_published: true, slug }).eq('id', formId);
      setIsPublished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`superform.so/f/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {isPublished && <Confetti />}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div className="bg-[var(--color-paper)] w-full max-w-lg" style={{ borderRadius: '2px' }}>
          {/* Header */}
          <div className="p-8 border-b border-[var(--color-rule)]">
            <h2 className="font-display text-4xl tracking-wider text-[var(--color-ink)]">
              {isPublished ? 'PUBLISHED!' : 'READY TO PUBLISH?'}
            </h2>
          </div>

          {!isPublished ? (
            <>
              {/* Checklist */}
              <div className="p-6 space-y-1 border-b border-[var(--color-rule)]">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 h-10">
                    <StatusDot status={item.status} />
                    <span className="font-mono text-[12px] flex-1">{item.label}</span>
                    {item.fix && typeof item.fix === 'string' ? (
                      <button className="font-mono text-[10px] text-[var(--color-muted)] underline">{item.fix}</button>
                    ) : item.fix}
                  </div>
                ))}
              </div>

              {/* Slug */}
              <div className="p-6 border-b border-[var(--color-rule)]">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-2">Your Form Link</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--color-muted)]">superform.so/f/</span>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="font-mono text-[11px] border-b border-[var(--color-rule)] bg-transparent outline-none flex-1 focus:border-[var(--color-ink)] transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex items-center gap-3 justify-end">
                <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors px-4 py-2 border border-[var(--color-rule)]">
                  CANCEL
                </button>
                <button
                  onClick={publish}
                  disabled={hasError || isPublishing}
                  className="font-mono text-[10px] uppercase tracking-widest px-6 py-2 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'PUBLISHING...' : 'PUBLISH NOW →'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-6">
              <p className="font-editorial text-xl italic text-[var(--color-muted)]">Your form is live.</p>
              <div className="flex items-center justify-center gap-2 font-mono text-sm">
                <span className="text-[var(--color-muted)]">superform.so/f/</span>
                <span className="text-[var(--color-ink)] font-bold">{slug}</span>
              </div>
              <button onClick={copyLink} className="font-mono text-[10px] uppercase tracking-widest px-6 py-3 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors">
                {copied ? '✓ COPIED!' : 'COPY LINK →'}
              </button>
              <div>
                <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
