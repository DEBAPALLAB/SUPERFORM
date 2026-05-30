'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { Monitor, Tablet, Smartphone, Minus, Plus, ChevronLeft, ChevronRight, Share2, MoreHorizontal } from 'lucide-react';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionType } from '@/types';

const VIEWPORTS = {
  desktop: { label: 'DESKTOP', Icon: Monitor, maxWidth: '1000px' },
  tablet:  { label: 'TABLET',  Icon: Tablet,  maxWidth: '768px' },
  mobile:  { label: 'MOBILE',  Icon: Smartphone, maxWidth: '390px' },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

function QuestionPreview({ question, artDirection }: {
  question: ReturnType<typeof useBuilderStore.getState>['questions'][number];
  artDirection: ReturnType<typeof useBuilderStore.getState>['artDirection'];
}) {
  const theme = THEME_STYLES[artDirection];
  const btnStyle = CONTINUE_BTN_STYLES[artDirection];
  const isBrutalist = artDirection === 'brutalist';

  const titleStyle: React.CSSProperties = {
    fontFamily: isBrutalist ? "'DM Mono', monospace" : "'Cormorant Garamond', serif",
    fontSize: 'clamp(20px, 2.5vw, 32px)', // Smaller, more sophisticated
    lineHeight: 1.2,
    fontWeight: isBrutalist ? 900 : 500,
    color: theme.color,
    letterSpacing: isBrutalist ? '0.05em' : '-0.01em',
    marginBottom: '8px'
  };

  const renderInput = (type: QuestionType) => {
    const inputBase = "bg-transparent border-b border-[var(--color-rule)] outline-none py-3 font-mono text-base transition-all focus:border-[var(--color-ink)] w-full max-w-[400px] placeholder:italic placeholder:text-[var(--color-muted)]";
    
    switch (type) {
      case 'short_text':
      case 'email':
      case 'phone':
        return <input disabled placeholder={question.placeholder || 'Type here...'} className={inputBase} />;
      case 'long_text':
        return <textarea disabled placeholder={question.placeholder || 'Share your thoughts...'} className={cn(inputBase, "min-h-[120px] resize-none")} />;
      case 'multiple_choice':
        return (
          <div className="grid grid-cols-1 gap-2 mt-6 max-w-[400px]">
            {(question.options || []).map((opt, i) => (
              <div key={opt.id} className="choice-card group !py-3 !px-4">
                <span className="font-mono text-[9px] w-5 h-5 border border-[var(--color-rule)] flex items-center justify-center group-hover:border-[var(--color-ink)] transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-[13px]">{opt.label}</span>
              </div>
            ))}
          </div>
        );
      case 'rating':
        return (
          <div className="flex gap-1.5 mt-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {Array.from({ length: question.maxRating || 10 }, (_, i) => (
              <div key={i} className="rating-btn !w-10 !h-10 !text-xs shrink-0">
                {i + 1}
              </div>
            ))}
          </div>
        );
      case 'yes_no':
        return (
          <div className="flex gap-3 mt-6 max-w-[320px]">
            {['YES', 'NO'].map((label) => (
              <div key={label} className="choice-card flex-1 justify-center !py-4">
                <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="font-mono text-[10px] text-[var(--color-muted)] italic">Interactive component: {type}</p>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.6 }
      }}
      key={question.id}
      className="w-full max-w-[640px] mx-auto px-10 py-10 flex flex-col justify-center min-h-full"
    >
      <div className="space-y-1 mb-10 opacity-40">
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--color-muted)]"
        >
          Node {String(question.order + 1).padStart(2, '0')}
        </motion.span>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-px bg-[var(--color-ink)]" 
        />
      </div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        style={titleStyle}
      >
        {question.title || 'Untitled'}
        {question.required && <span className="text-[var(--color-accent)] ml-2 text-sm">*</span>}
      </motion.h2>

      {question.description && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="font-editorial text-base italic text-[var(--color-muted)] mb-8 leading-relaxed max-w-[480px]"
        >
          {question.description}
        </motion.p>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-4"
      >
        {renderInput(question.type)}
      </motion.div>

      {question.type !== 'statement' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-12 flex items-center gap-6"
        >
          <button style={{ ...btnStyle, padding: '12px 32px', fontSize: '11px' }} className="btn-primary">
            Continue
          </button>
          <span className="label-caps !text-[var(--color-muted)] !tracking-[0.1em] opacity-40">Press Enter ↵</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function CenterCanvas() {
  const { questions, selectedQuestionId, selectQuestion, artDirection, formSlug } = useBuilderStore();
  const [viewport, setViewport] = useState<ViewportKey>('desktop');
  const [zoom, setZoom] = useState(100);

  const activeQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];
  const activeIndex = questions.findIndex((q) => q.id === activeQuestion?.id);

  const theme = THEME_STYLES[artDirection];

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-canvas)] relative overflow-hidden">
      {/* Sub-Nav / Toolbar */}
      <div className="h-14 border-b border-[var(--color-rule)] bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-8">
          <span className="label-caps !text-[var(--color-ink)] !tracking-[0.2em]">Studio</span>
          <div className="flex bg-[var(--color-canvas)] p-1 rounded-xl border border-[var(--color-rule)] shadow-inner">
            {(Object.keys(VIEWPORTS) as ViewportKey[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={cn(
                  'px-4 py-1.5 font-mono text-[9px] tracking-[0.2em] transition-all rounded-lg',
                  viewport === v ? 'bg-white shadow-sm text-[var(--color-ink)] font-bold' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-[var(--color-canvas)]/50 px-3 py-1.5 rounded-full border border-[var(--color-rule)]">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"><Minus className="w-3.5 h-3.5" /></button>
            <span className="font-mono text-[9px] w-10 text-center font-bold">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="h-4 w-px bg-[var(--color-rule)]" />
          <button onClick={() => setZoom(100)} className="label-caps hover:text-[var(--color-ink)] !tracking-[0.2em] transition-colors">Reset</button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-auto dot-grid relative flex justify-center items-center p-12">
        <motion.div
          animate={{ 
            width: VIEWPORTS[viewport].maxWidth,
            scale: zoom / 100
          }}
          transition={{ 
            type: 'spring', 
            damping: 35, 
            stiffness: 120,
            mass: 1.2
          }}
          className="bg-white shadow-[var(--shadow-float)] border border-[var(--color-rule-dark)] relative flex flex-col h-[75vh] min-h-[560px] max-h-[840px] overflow-hidden rounded-[32px]"
        >
          {/* Virtual Browser Chrome */}
          <div className="h-12 border-b border-[var(--color-rule)] bg-[var(--color-canvas)]/30 flex items-center justify-between px-6 shrink-0">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
            </div>
            <div className="bg-white border border-[var(--color-rule)] h-6 flex-1 mx-10 rounded-full px-4 flex items-center justify-between shadow-sm">
              <span className="font-mono text-[8px] text-[var(--color-muted)] truncate tracking-[0.1em] uppercase font-medium">
                superform.so/f/{formSlug?.toLowerCase()}
              </span>
              <Share2 className="w-2.5 h-2.5 text-[var(--color-muted)]" />
            </div>
            <MoreHorizontal className="w-4 h-4 text-[var(--color-muted)]" />
          </div>

          <div className="flex-1 overflow-y-auto relative" style={theme}>
             {/* The Centering Engine */}
             <div className="absolute inset-0 flex flex-col">
                <AnimatePresence mode="wait">
                  {activeQuestion ? (
                    <QuestionPreview key={activeQuestion.id} question={activeQuestion} artDirection={artDirection} />
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="label-caps opacity-20">No content</p>
                    </div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Scrubber */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-[var(--color-rule)] p-1.5 flex items-center gap-2 shadow-[var(--shadow-float)] z-30 rounded-2xl">
        <button
          onClick={() => activeIndex > 0 && selectQuestion(questions[activeIndex - 1].id)}
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-canvas)] transition-all rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="px-6 border-l border-r border-[var(--color-rule)]">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-muted)] font-bold">
            <span className="text-[var(--color-ink)]">{activeIndex + 1}</span> <span className="opacity-30">/</span> {questions.length}
          </span>
        </div>
        <button
          onClick={() => activeIndex < questions.length - 1 && selectQuestion(questions[activeIndex + 1].id)}
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-canvas)] transition-all rounded-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
