'use client';

import { cn } from '@/lib/utils';
import type { ArtDirectionKey, SurfaceKey, RadiusKey } from '@/types';

const RADIUS_MAP: Record<RadiusKey, string> = {
  none: '0px',
  sm: '4px',
  md: '12px',
  full: '9999px',
};

const SURFACE_STYLES: Record<SurfaceKey, React.CSSProperties> = {
  flat: { background: 'transparent', border: '1px solid transparent' },
  card: { background: '#ffffff', boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)', border: '1px solid var(--color-rule)' },
  glass: {
    background: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.6)',
  },
  frame: { background: 'transparent', border: '1.5px solid var(--color-ink)' },
};

export const THEME_STYLES: Record<ArtDirectionKey, React.CSSProperties & { fontFamily?: string }> = {
  minimal: {
    fontFamily: "'DM Mono', monospace",
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '2px',
  },
  editorial: {
    fontFamily: "'Cormorant Garamond', serif",
    background: '#FAF8F4',
    color: '#2C2416',
    borderRadius: '0',
  },
  glass: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: '24px',
    color: '#0A0A0A',
  },
  brutalist: {
    fontFamily: "'DM Mono', monospace",
    background: '#FFFFFF',
    fontWeight: 900,
    borderRadius: '0',
    border: '4px solid #000',
    color: '#000000',
  },
  cinematic: {
    fontFamily: "'Cormorant Garamond', serif",
    background: '#0D0D0D',
    color: '#E8DCC8',
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
};

export const CONTINUE_BTN_STYLES: Record<ArtDirectionKey, React.CSSProperties> = {
  minimal:   { background: '#0A0A0A', color: '#ffffff', border: 'none', borderRadius: 0 },
  editorial: { background: '#2C2416', color: '#FAF8F4', border: 'none', borderRadius: 0 },
  glass:     { background: '#0A0A0A', color: '#ffffff', border: 'none', borderRadius: 30 },
  brutalist: { background: '#000000', color: '#ffffff', border: 'none', borderRadius: 0 },
  cinematic: { background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: 0 },
};

interface FormCardProps {
  artDirection: ArtDirectionKey;
  surface?: SurfaceKey;
  radius?: RadiusKey;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function FormCard({ artDirection, surface, radius, children, className, style }: FormCardProps) {
  const themeStyle = THEME_STYLES[artDirection];
  const surfaceStyle = surface ? SURFACE_STYLES[surface] : {};
  const borderRadius = radius ? RADIUS_MAP[radius] : themeStyle.borderRadius;

  return (
    <div
      className={cn('transition-all duration-500', className)}
      style={{
        ...themeStyle,
        ...surfaceStyle,
        borderRadius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {label && <span className="label-caps !text-[var(--color-muted)]">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('toggle-track', checked && 'active')}
      >
        <div className="toggle-thumb" />
      </button>
    </div>
  );
}

export function PillGroup<T extends string>({ options, value, onChange, height = 36 }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; height?: number }) {
  return (
    <div className="flex gap-1 bg-[var(--color-canvas)] p-1 border border-[var(--color-rule)] rounded-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{ height }}
          className={cn(
            'flex-1 px-3 font-mono text-[9px] uppercase tracking-widest transition-all',
            value === opt.value
              ? 'bg-white shadow-sm text-[var(--color-ink)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
