'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function IssueBar() {
  const { issues, addQuestion } = useBuilderStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (issues.length === 0) return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-[var(--color-ink)] flex items-center px-6 z-50">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">Stage is valid · Ready to publish</span>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-[#FFFBEB] border-t border-[#F0D060] z-50 transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]",
      isExpanded ? "h-auto" : "h-8"
    )}>
      {/* Summary Row */}
      <div 
        className="h-8 flex items-center justify-between px-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-[#92700A]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#92700A]">
            {issues.length} {issues.length === 1 ? 'Optimization' : 'Optimizations'} Required
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[8px] uppercase tracking-widest text-[#92700A]/60">Click to expand</span>
          {isExpanded ? <ChevronDown className="w-3 h-3 text-[#92700A]" /> : <ChevronUp className="w-3 h-3 text-[#92700A]" />}
        </div>
      </div>

      {/* Details list */}
      {isExpanded && (
        <div className="p-6 bg-white border-t border-[#F0D060]/30 max-h-[240px] overflow-y-auto">
          <div className="space-y-4">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-center justify-between gap-6 group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    issue.type === 'error' ? 'bg-[var(--color-error)]' : 'bg-[#F0D060]'
                  )} />
                  <span className="font-mono text-[11px] text-[var(--color-ink)]">{issue.message}</span>
                </div>
                {issue.actionLabel && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (issue.action === 'add-question') addQuestion('short_text');
                    }}
                    className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] border-b border-transparent hover:border-[var(--color-ink)] transition-all"
                  >
                    {issue.actionLabel} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
