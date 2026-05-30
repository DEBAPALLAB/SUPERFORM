'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { PillGroup } from '@/components/shared/DesignTokens';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import type { ArtDirectionKey, SurfaceKey, TypographyKey, RadiusKey } from '@/types';

const ART_DIRECTIONS: {
  key: ArtDirectionKey;
  title: string;
  subtitle: string;
  cardStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
}[] = [
  {
    key: 'minimal',
    title: 'MINIMAL',
    subtitle: 'QUIET, CENTERED, AIRY',
    cardStyle: { background: '#FFFFFF', border: '1px solid #E5E3DF', borderRadius: '4px' },
    titleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: '#111' },
    subtitleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#999' },
  },
  {
    key: 'editorial',
    title: 'EDITORIAL',
    subtitle: 'CLEAN BUT DRAMATIC',
    cardStyle: { background: '#FAF8F4', border: '1px solid #E8E0D0', borderRadius: '4px' },
    titleStyle: { fontFamily: "'Cormorant Garamond',serif", fontSize: '16px', fontWeight: 700, color: '#2C2416' },
    subtitleStyle: { fontFamily: "'Cormorant Garamond',serif", fontSize: '11px', fontStyle: 'italic', color: '#8C7B5E' },
  },
  {
    key: 'glass',
    title: 'GLASS',
    subtitle: 'BLUR, DEPTH, SHEEN',
    cardStyle: { background: 'rgba(240,240,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', borderRadius: '8px' },
    titleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 600, color: '#2A2A2A' },
    subtitleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(0,0,0,0.4)' },
  },
  {
    key: 'brutalist',
    title: 'BRUTALIST',
    subtitle: 'HARD EDGES, HIGH CONTRAST',
    cardStyle: { background: '#000000', borderRadius: '0', border: 'none' },
    titleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 900, letterSpacing: '0.1em', color: '#FFFFFF' },
    subtitleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', color: '#555' },
  },
  {
    key: 'cinematic',
    title: 'CINEMATIC',
    subtitle: 'WIDE, SOFT, LUXURIOUS',
    cardStyle: { background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '6px' },
    titleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 600, letterSpacing: '0.14em', color: '#E8DCC8' },
    subtitleStyle: { fontFamily: "'DM Mono',monospace", fontSize: '10px', fontStyle: 'italic', letterSpacing: '0.08em', color: '#7A6F5E' },
  },
];

const SURFACE_OPTIONS: { value: SurfaceKey; label: string; style: React.CSSProperties }[] = [
  { value: 'flat',  label: 'FLAT',  style: { background: 'transparent', border: '1px solid var(--color-rule)' } },
  { value: 'card',  label: 'CARD',  style: { background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } },
  { value: 'glass', label: 'GLASS', style: { background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,200,200,0.5)' } },
  { value: 'frame', label: 'FRAME', style: { background: 'transparent', border: '2px solid var(--color-ink)' } },
];

const RADIUS_MAP: Record<RadiusKey, string> = { none: '0', sm: '4px', md: '8px', full: '9999px' };
const TYPO_SIZES: Record<TypographyKey, string> = { sm: 'clamp(22px,3vw,32px)', md: 'clamp(28px,4vw,42px)', lg: 'clamp(32px,5vw,52px)', xl: 'clamp(40px,6vw,64px)' };

export function DesignMode() {
  const { artDirection, setArtDirection, previewDirection, surface, setSurface, typography, setTypography, radius, setRadius, previewingDirection, questions, autoSetSurface, autoSetTypography, autoSetRadius } = useBuilderStore();
  const activeDirection = previewingDirection || artDirection;
  const theme = THEME_STYLES[activeDirection];
  const btnStyle = CONTINUE_BTN_STYLES[activeDirection];
  const previewQ = questions[0];

  const typoOpts: { value: TypographyKey; label: string }[] = [{ value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'lg', label: 'LG' }, { value: 'xl', label: 'XL' }];
  const radiusOpts: { value: RadiusKey; label: string }[] = [{ value: 'none', label: 'NONE' }, { value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'full', label: 'FULL' }];

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[420px] border-r border-[var(--color-rule)] flex flex-col overflow-y-auto shrink-0 p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-4">Art Direction</p>
        <div className="space-y-2 mb-8">
          {ART_DIRECTIONS.map((ad) => (
            <button
              key={ad.key}
              onClick={() => setArtDirection(ad.key)}
              onMouseEnter={() => previewDirection(ad.key)}
              onMouseLeave={() => previewDirection(null)}
              className={cn('w-full flex flex-col justify-center transition-all duration-[120ms]', artDirection === ad.key ? 'ring-2 ring-[var(--color-ink)]' : 'hover:scale-[1.01]')}
              style={{ ...ad.cardStyle, height: '80px', padding: '20px 24px', textAlign: 'left' }}
            >
              <div style={ad.titleStyle}>{ad.title}</div>
              <div style={{ ...ad.subtitleStyle, marginTop: '4px' }}>{ad.subtitle}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-[var(--color-rule)] my-6" />
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-4">Refine</p>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Surface</p>
            {autoSetSurface && <div className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SURFACE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSurface(opt.value)}
                style={surface === opt.value ? { background: 'var(--color-ink)', color: 'white' } : opt.style}
                className="h-12 font-mono text-[10px] uppercase tracking-wider transition-all">{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Typography</p>
            {autoSetTypography && <div className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />}
          </div>
          <PillGroup options={typoOpts} value={typography} onChange={setTypography} height={32} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">Radius</p>
            {autoSetRadius && <div className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />}
          </div>
          <PillGroup options={radiusOpts} value={radius} onChange={setRadius} height={32} />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div className="absolute top-5 left-5 font-mono text-[9px] z-10" style={{ color: '#BBB' }}>
          {previewingDirection ? `PREVIEWING ${previewingDirection.toUpperCase()}` : 'LIVE PREVIEW'}
        </div>
        <div className="absolute top-5 right-5 font-mono text-[9px] z-10" style={{ color: '#BBB' }}>NODE #01</div>
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative" style={{ ...theme, minWidth: '520px', maxWidth: '680px', width: '100%', padding: '48px 56px', boxShadow: surface === 'card' ? '0 8px 40px rgba(0,0,0,0.10)' : undefined, borderRadius: RADIUS_MAP[radius], transition: 'all 120ms ease' }}>
            {previewQ ? (
              <>
                <div className="font-mono text-[10px] mb-4" style={{ color: theme.color, opacity: 0.4 }}>01 →</div>
                <h2 style={{ fontFamily: activeDirection === 'brutalist' ? "'DM Mono',monospace" : "'Cormorant Garamond',serif", fontSize: TYPO_SIZES[typography], fontWeight: activeDirection === 'brutalist' ? 900 : 500, lineHeight: 1.1, color: theme.color, marginBottom: '32px', transition: 'all 120ms ease' }}>
                  {previewQ.title}
                </h2>
                <div style={{ borderBottom: `1px solid ${activeDirection === 'cinematic' ? '#2A2A2A' : 'var(--color-rule)'}`, paddingBottom: '8px', fontFamily: "'DM Mono',monospace", fontSize: '16px', color: activeDirection === 'cinematic' ? '#7A6F5E' : 'var(--color-muted)', fontStyle: 'italic', marginBottom: '32px' }}>
                  {previewQ.placeholder || 'Type your answer here...'}
                </div>
                <button style={{ ...btnStyle, padding: '14px 28px', fontFamily: "'DM Mono',monospace", fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 120ms ease' }}>
                  CONTINUE →
                </button>
              </>
            ) : (
              <p className="font-mono text-[11px] text-[var(--color-muted)] text-center py-12">Add questions in Build mode.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
