'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface BuilderNavProps {
  onPublish: () => void;
}

export function BuilderNav({ onPublish }: BuilderNavProps) {
  const searchParams = useSearchParams();
  const [strategyNote, setStrategyNote] = useState(searchParams.get('notes'));

  const {
    formTitle, setFormTitle, mode, setMode,
    isSaving, isDirty, formSlug
  } = useBuilderStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(formTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitleVal(formTitle); }, [formTitle]);

  const handleTitleClick = () => {
    setEditingTitle(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    setFormTitle(titleVal.trim() || 'Untitled Form');
  };

  const modes = [
    { key: 'build', label: 'BUILD' },
    { key: 'design', label: 'DESIGN' },
    { key: 'preview', label: 'PREVIEW' },
  ] as const;

  return (
    <div className="relative">
      <nav className="h-16 border-b border-[var(--color-rule)] flex items-center justify-between px-6 bg-[var(--color-paper)] sticky top-0 z-50 shrink-0">
        {/* Left — Project Info */}
        <div className="flex items-center gap-5 min-w-[240px]">
          <Link href="/dashboard" className="w-8 h-8 bg-[var(--color-ink)] flex items-center justify-center shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
            <span className="text-white font-editorial text-sm leading-none italic font-bold">f</span>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <input
                  ref={inputRef}
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  className="font-mono text-[12px] uppercase tracking-widest bg-transparent outline-none border-b border-[var(--color-ink)] w-full py-0.5"
                />
              ) : (
                <button
                  onClick={handleTitleClick}
                  className="font-mono text-[12px] uppercase tracking-[0.15em] truncate hover:text-[var(--color-muted)] transition-colors font-bold"
                >
                  {formTitle}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-mono text-[8px] uppercase tracking-[0.2em] font-medium",
                isSaving ? "text-[var(--color-accent)] animate-pulse" : isDirty ? "text-[var(--color-muted)]" : "text-[var(--color-success)]"
              )}>
                {isSaving ? 'Synchronizing...' : isDirty ? 'Unsaved Changes' : 'Synced to Cloud'}
              </span>
            </div>
          </div>
        </div>

        {/* Center — Mode Control */}
        <div className="flex bg-[var(--color-canvas)] p-1.5 rounded-xl border border-[var(--color-rule)] shadow-inner">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'nav-tab min-w-[100px] h-8 rounded-lg text-[9px] tracking-[0.2em] font-mono transition-all',
                mode === m.key
                  ? 'bg-white shadow-sm text-[var(--color-ink)] font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-4 min-w-[240px] justify-end">
          <a
            href={`/f/${formSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.2em] uppercase px-5 py-2.5 border border-[var(--color-rule)] hover:border-[var(--color-ink)] transition-all rounded-xl hover:shadow-sm"
          >
            View Live
          </a>
          <button
            onClick={onPublish}
            className="btn-primary py-2.5 px-8 rounded-xl h-10 flex items-center justify-center"
          >
            Publish
          </button>
        </div>
      </nav>

      {/* Ephemeral Strategy Note V2 */}
      <AnimatePresence>
        {strategyNote && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="absolute top-20 left-10 z-[60] w-[340px] bg-[var(--color-canvas)] border-l-[3px] border-[var(--color-accent)] p-5 shadow-2xl"
          >
             <p className="label-caps !text-[var(--color-muted)] mb-3 !text-[9px]">Research Strategy</p>
             <p className="font-mono text-[11px] leading-relaxed text-[var(--color-ink)]">
                {strategyNote}
             </p>
             <button 
                onClick={() => setStrategyNote(null)}
                className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-accent)]"
             >
                Got it
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
