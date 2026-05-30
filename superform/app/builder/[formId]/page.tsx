'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useAutoSave } from '@/lib/useAutoSave';
import { supabase } from '@/lib/supabase';
import { BuilderNav } from '@/components/builder/BuilderNav';
import { LeftPanel } from '@/components/builder/LeftPanel';
import { CenterCanvas } from '@/components/builder/CenterCanvas';
import { RightPanel } from '@/components/builder/RightPanel';
import { DesignMode } from '@/components/builder/DesignMode';
import { PreviewMode } from '@/components/builder/PreviewMode';
import { PublishModal } from '@/components/builder/PublishModal';
import { IssueBar } from '@/components/builder/IssueBar';
import type { Question, FormStyle } from '@/types';

export default function BuilderPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { mode, setMode, init } = useBuilderStore();
  const [showPublish, setShowPublish] = useState(false);
  const [loading, setLoading] = useState(true);

  useAutoSave();

  useEffect(() => {
    async function load() {
      try {
        // Fetch form
        const { data: form } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();

        // Fetch questions
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('form_id', formId)
          .order('order');

        // Fetch style
        const { data: style } = await supabase
          .from('form_styles')
          .select('*')
          .eq('form_id', formId)
          .single();

        if (form) {
          init({
            formId: form.id,
            formTitle: form.title,
            formSlug: form.slug,
            questions: (questions || []).map((q: any) => ({
              ...q,
              options: Array.isArray(q.options) ? q.options : [],
            })),
            style: style as FormStyle | undefined,
          });
        } else {
          // If ID exists but not in DB, it's likely a fresh AI generation
          // We don't overwrite the store in this case
          console.log('Form not found in DB, keeping current store state');
        }
      } catch (err) {
        console.error('Failed to load form from DB:', err);
      } finally {
        setLoading(false);
      }
    }

    if (formId && formId !== 'new') {
      load();
    } else {
      // New form — seed with one question
      init({
        formId: formId || 'temp',
        formTitle: 'Untitled Form',
        formSlug: 'untitled-form',
        questions: [],
      });
      setLoading(false);
    }
  }, [formId, init]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-paper)]">
        <div className="relative w-48 h-0.5 bg-[var(--color-rule)] overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[var(--color-ink)]"
            style={{ animation: 'slide-rule 1.2s ease-in-out infinite' }}
          />
        </div>
        <style>{`@keyframes slide-rule { 0%{left:-100%;width:100%} 50%{left:0%;width:100%} 100%{left:100%;width:100%} }`}</style>
      </div>
    );
  }

  if (mode === 'preview') {
    return <PreviewMode onBack={() => setMode('build')} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-paper)] overflow-hidden">
      <BuilderNav onPublish={() => setShowPublish(true)} />

      <div className="flex flex-1 overflow-hidden">
        {mode === 'build' && (
          <>
            <LeftPanel />
            <CenterCanvas />
            <RightPanel />
          </>
        )}
        {mode === 'design' && <DesignMode />}
      </div>

      <IssueBar />

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </div>
  );
}
