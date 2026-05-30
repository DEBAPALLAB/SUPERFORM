'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { Toggle, PillGroup } from '@/components/shared/DesignTokens';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Sliders, Type, Box, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArtDirectionKey, SurfaceKey, TypographyKey, RadiusKey } from '@/types';

const MINI_ART_CARDS: { key: ArtDirectionKey; title: string; color: string; bg: string }[] = [
  { key: 'minimal',   title: 'Minimal',   color: '#111', bg: '#fff' },
  { key: 'editorial', title: 'Editorial', color: '#2C2416', bg: '#FAF8F4' },
  { key: 'glass',     title: 'Glass',     color: '#222', bg: '#F8F8FF' },
  { key: 'brutalist', title: 'Brutalist', color: '#fff', bg: '#000' },
  { key: 'cinematic', title: 'Cinematic', color: '#E8DCC8', bg: '#0D0D0D' },
];

export function RightPanel() {
  const {
    selectedQuestionId, questions, updateQuestion, artDirection, setArtDirection,
    surface, setSurface, typography, setTypography, radius, setRadius,
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState<'details' | 'design'>('details');
  const q = questions.find((x) => x.id === selectedQuestionId);

  const surfaceOpts: { value: SurfaceKey; label: string }[] = [
    { value: 'flat', label: 'Flat' }, { value: 'card', label: 'Card' },
    { value: 'glass', label: 'Glass' }, { value: 'frame', label: 'Frame' },
  ];
  
  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-3 h-3 text-[var(--color-muted)]" />
      <span className="label-caps !text-[var(--color-ink)]">{title}</span>
    </div>
  );

  return (
    <div className="w-[320px] border-l border-[var(--color-rule)] flex flex-col h-full bg-[var(--color-paper)] shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-rule)] bg-[var(--color-canvas)]/30 p-1.5">
        {(['details', 'design'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 h-9 font-mono text-[9px] uppercase tracking-[0.2em] transition-all rounded-lg',
              activeTab === tab
                ? 'bg-white shadow-sm text-[var(--color-ink)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'details' && q ? (
            <motion.div 
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 space-y-10"
            >
              {/* Core Info - Floating Card */}
              <div className="bg-white p-7 border border-[var(--color-rule)] rounded-[28px] shadow-[var(--shadow-float)] space-y-8">
                <SectionHeader icon={Info} title="Content" />
                
                <div className="space-y-6">
                  <div>
                    <label className="label-caps block mb-3 ml-1">Question Title</label>
                    <textarea
                      value={q.title}
                      onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                      placeholder="Type your question..."
                      className="w-full font-mono text-[12px] border-none p-4 bg-[var(--color-canvas)]/50 outline-none resize-none focus:ring-1 focus:ring-[var(--color-ink)]/10 transition-all min-h-[100px] rounded-2xl leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="label-caps block mb-3 ml-1">Description</label>
                    <input
                      value={q.description || ''}
                      onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
                      placeholder="Add context (optional)..."
                      className="w-full font-mono text-[11px] border-none px-4 py-3.5 bg-[var(--color-canvas)]/50 outline-none focus:ring-1 focus:ring-[var(--color-ink)]/10 transition-all rounded-xl"
                    />
                  </div>

                  {/* Multiple choice options */}
                  {q.type === 'multiple_choice' && (
                    <div className="pt-2">
                      <label className="label-caps block mb-4 ml-1">Choice Options</label>
                      <div className="space-y-3">
                        {(q.options || []).map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2 group">
                            <input
                              value={opt.label}
                              onChange={(e) => {
                                const newOpts = [...(q.options || [])];
                                newOpts[i] = { ...opt, label: e.target.value };
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              className="flex-1 font-mono text-[11px] border border-[var(--color-rule)] bg-white px-4 py-2.5 focus:border-[var(--color-ink)] transition-colors rounded-xl shadow-sm"
                            />
                            <button
                              onClick={() => {
                                const newOpts = (q.options || []).filter((_, oi) => oi !== i);
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              className="text-[var(--color-muted)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-all p-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: generateId(), label: `Option ${(q.options?.length || 0) + 1}` }] })}
                          className="w-full py-3 border border-dashed border-[var(--color-rule)] font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-all flex items-center justify-center gap-2 rounded-xl bg-[var(--color-canvas)]/30 hover:bg-[var(--color-canvas)]/50"
                        >
                          <Plus className="w-3 h-3" /> Add Choice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation - Floating Card */}
              <div className="bg-white p-7 border border-[var(--color-rule)] rounded-[28px] shadow-[var(--shadow-float)]">
                <SectionHeader icon={Sliders} title="Rules" />
                <div className="pt-2">
                  <Toggle
                    label="Required Field"
                    checked={q.required}
                    onChange={(v) => updateQuestion(q.id, { required: v })}
                  />
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'details' ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center flex flex-col items-center justify-center h-[240px] opacity-40"
            >
               <Box className="w-8 h-8 mb-4 text-[var(--color-rule-dark)]" />
               <p className="label-caps">No element selected</p>
            </motion.div>
          ) : (
            /* Design Tab */
            <motion.div 
              key="design"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 space-y-12"
            >
              <div className="space-y-6">
                <SectionHeader icon={Type} title="Art Direction" />
                <div className="grid grid-cols-1 gap-3">
                  {MINI_ART_CARDS.map((card, i) => (
                    <motion.button
                      key={card.key}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setArtDirection(card.key)}
                      className={cn(
                        'flex items-center justify-between px-5 py-4 border transition-all group rounded-2xl',
                        artDirection === card.key ? 'border-[var(--color-ink)] shadow-md' : 'border-[var(--color-rule)] hover:border-[var(--color-muted)] hover:shadow-sm'
                      )}
                      style={{ background: card.bg }}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: card.color }}>{card.title}</span>
                      {artDirection === card.key && <div className="w-2 h-2 rounded-full bg-[var(--color-ink)] shadow-sm" />}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader icon={Box} title="Global Geometry" />
                
                <div className="space-y-6">
                  <div>
                    <label className="label-caps block mb-4 ml-1">Surface Treatment</label>
                    <div className="grid grid-cols-2 gap-3">
                      {surfaceOpts.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSurface(opt.value)}
                          className={cn(
                            'py-3.5 font-mono text-[9px] uppercase tracking-widest border transition-all rounded-xl',
                            surface === opt.value ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-md' : 'border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
