'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArtDirectionKey } from '@/types';

const DEMO_OPTIONS: { key: ArtDirectionKey; label: string; subLabel: string }[] = [
  { key: 'minimal',   label: 'Minimal & Clean',       subLabel: 'Quiet precision' },
  { key: 'editorial', label: 'Editorial & Dramatic',   subLabel: 'Bold narratives' },
  { key: 'brutalist', label: 'Raw & Brutalist',        subLabel: 'Hard edges' },
  { key: 'cinematic', label: 'Cinematic & Luxurious',  subLabel: 'Wide luxury' },
];

const RADIUS_MAP = { none: '0', sm: '4px', md: '8px', full: '9999px' };
const AD_RADIUS: Record<ArtDirectionKey, string> = {
  minimal: '2px', editorial: '0', glass: '12px', brutalist: '0', cinematic: '4px',
};

function LiveDemo() {
  const [selected, setSelected] = useState<ArtDirectionKey | null>(null);
  const theme = THEME_STYLES[selected || 'minimal'];
  const btnStyle = CONTINUE_BTN_STYLES[selected || 'minimal'];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        layout
        style={{
          ...theme,
          padding: '48px 40px',
          borderRadius: AD_RADIUS[selected || 'minimal'],
          boxShadow: selected === 'minimal' || !selected ? 'none' : '0 20px 60px rgba(0,0,0,0.12)',
          transition: 'all 500ms var(--ease-out-expo)',
          border: selected === 'brutalist' ? '3px solid #000' : selected === 'glass' ? '1px solid rgba(255,255,255,0.8)' : undefined,
          backdropFilter: selected === 'glass' ? 'blur(20px)' : undefined,
        }}
        className="relative overflow-hidden"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="font-mono text-[9px] mb-4" 
          style={{ color: theme.color as string }}
        >
          01 →
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.h3 
            key={selected || 'default'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              fontFamily: selected === 'brutalist' ? "'DM Mono',monospace" : "'Cormorant Garamond',serif",
              fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: selected === 'brutalist' ? 900 : 500,
              lineHeight: 1.1,
              color: theme.color as string,
              marginBottom: '32px',
            }}
          >
            What defines your aesthetic?
          </motion.h3>
        </AnimatePresence>

        <div className="space-y-2">
          {DEMO_OPTIONS.map((opt, i) => {
            const isSelected = selected === opt.key;
            return (
              <motion.button
                key={opt.key}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(isSelected ? null : opt.key)}
                className="w-full flex items-center gap-3 p-3 border text-left transition-all"
                style={{
                  background: isSelected ? theme.color as string : 'transparent',
                  color: isSelected ? (selected === 'cinematic' ? '#0D0D0D' : 'white') : theme.color as string,
                  borderColor: isSelected ? theme.color as string : selected === 'cinematic' ? '#2A2A2A' : 'var(--color-rule)',
                  borderRadius: selected === 'brutalist' ? '0' : '2px',
                }}
              >
                <span className="font-mono text-[9px] border border-current px-1.5 py-0.5 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wide">{opt.label}</div>
                  <div className="font-mono text-[9px] opacity-50 mt-0.5">{opt.subLabel}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 flex items-center gap-4 overflow-hidden"
            >
              <button style={{ ...btnStyle, padding: '12px 24px', fontFamily: "'DM Mono',monospace", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CONTINUE →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {selected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            THEME APPLIED: <span className="text-[var(--color-ink)]">{selected.toUpperCase()}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-14 border-b border-[var(--color-rule)] flex items-center justify-between px-8 sticky top-0 bg-[var(--color-paper)]/80 backdrop-blur-md z-50"
      >
        <Link href="/" className="font-display text-2xl tracking-wider text-[var(--color-ink)]">SUPERFORM</Link>

        <nav className="hidden md:flex items-center gap-8">
          {['FEATURES', 'SHOWCASE', 'PRICING'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth">
            <button className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors border border-transparent hover:border-[var(--color-rule)]">
              LOG IN
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="font-mono text-[10px] uppercase tracking-widest px-5 py-2 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors shadow-lg hover:shadow-xl">
              START BUILDING
            </button>
          </Link>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="px-8 md:px-16 py-24 grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto overflow-hidden">
        {/* Left */}
        <div className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block border border-[var(--color-rule)] px-3 py-1.5"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Forms, Evolved.</span>
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display leading-[0.9] text-[clamp(64px,8vw,120px)]"
            >
              <span className="block text-[var(--color-ink)]">YOUR FORM.</span>
              <span className="block text-[var(--color-muted)]">THEIR EXPERIENCE.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="font-editorial text-xl italic text-[var(--color-muted)] max-w-sm leading-relaxed"
            >
              Build forms so beautiful, people ask what you used.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-3"
          >
            <Link href="/dashboard">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="font-mono text-[12px] uppercase tracking-widest px-8 py-4 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors flex items-center gap-2 shadow-xl"
              >
                START BUILDING FREE →
              </motion.button>
            </Link>
            <p className="font-mono text-[10px] text-[var(--color-muted)]">
              No credit card. No Superform branding. Free forever for 3 forms.
            </p>
          </motion.div>
        </div>

        {/* Right — live demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--color-rule)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Live Product Demo</span>
            <div className="h-px flex-1 bg-[var(--color-rule)]" />
          </div>
          <LiveDemo />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[var(--color-rule)] px-8 md:px-16 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-rule)]">
          {/* Design Studio */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-12 md:py-0 md:pr-12"
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-6">01</div>
            <h2 className="font-display text-4xl tracking-wider mb-4">DESIGN STUDIO</h2>
            <p className="font-editorial text-lg italic text-[var(--color-muted)] mb-8 leading-relaxed">
              Five Art Direction presets. Every detail designed to match your brand.
            </p>
            <div className="space-y-2">
              {(['minimal','editorial','glass','brutalist','cinematic'] as ArtDirectionKey[]).map(dir => {
                const t = THEME_STYLES[dir];
                return (
                  <div key={dir} className="h-8 flex items-center px-3 font-mono text-[9px] uppercase tracking-widest transition-all" style={{ ...t, border: dir === 'brutalist' ? '2px solid #000' : '1px solid var(--color-rule)', opacity: 0.8 }}>
                    {dir}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Smart Builder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="py-12 md:py-0 md:px-12"
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-6">02</div>
            <h2 className="font-display text-4xl tracking-wider mb-4">SMART BUILDER</h2>
            <p className="font-editorial text-lg italic text-[var(--color-muted)] mb-8 leading-relaxed">
              Describe what you need. AI builds the form for you in seconds.
            </p>
            <div className="border border-[var(--color-rule)] p-4">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-3">Intent Generator</p>
              <div className="flex items-center gap-2 border-b border-[var(--color-rule)] pb-3">
                <span className="font-editorial text-lg italic text-[var(--color-muted)]">I want to collect feedback for...</span>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {['WAITLIST', 'FEEDBACK'].map(c => (
                  <span key={c} className="font-mono text-[8px] uppercase tracking-widest border border-[var(--color-rule)] px-2 py-1 text-[var(--color-muted)]">{c}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Response Room */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="py-12 md:py-0 md:pl-12"
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-6">03</div>
            <h2 className="font-display text-4xl tracking-wider mb-4">RESPONSE ROOM</h2>
            <p className="font-editorial text-lg italic text-[var(--color-muted)] mb-8 leading-relaxed">
              Every response tells a story. Built-in intelligence surfaces the signal.
            </p>
            <div className="border border-[var(--color-rule)] p-4 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-mono text-[9px] text-[var(--color-muted)] uppercase tracking-widest">Responses</div>
                  <div className="font-display text-4xl">247</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] text-[var(--color-muted)] uppercase tracking-widest">Completion</div>
                  <div className="font-display text-4xl">84%</div>
                </div>
              </div>
              <div className="h-0.5 bg-[var(--color-rule)] relative">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '84%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-0 left-0 h-full bg-[var(--color-ink)]" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-rule)] px-8 md:px-16 py-8 flex items-center justify-between max-w-7xl mx-auto">
        <span className="font-display text-xl tracking-wider">SUPERFORM</span>
        <div className="flex items-center gap-8">
          {['Twitter', 'Github', 'Contact'].map(link => (
            <a key={link} href="#" className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
