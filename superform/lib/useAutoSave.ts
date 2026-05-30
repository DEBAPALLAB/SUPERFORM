'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useBuilderStore } from '@/store/useBuilderStore';
import { debounce } from '@/lib/utils';
import type { FormStyle } from '@/types';

const AUTO_SAVE_DELAY = 800;

export function useAutoSave() {
  const store = useBuilderStore();
  const isMounted = useRef(false);

  const save = useRef(
    debounce(async (state: ReturnType<typeof useBuilderStore.getState>) => {
      if (!state.formId || !state.isDirty) return;
      state.markSaving(true);

      try {
        // Update form title
        await supabase
          .from('forms')
          .update({ title: state.formTitle, slug: state.formSlug })
          .eq('id', state.formId);

        // Upsert style
        const styleData: Partial<FormStyle> = {
          art_direction: state.artDirection,
          surface: state.surface,
          typography: state.typography,
          radius: state.radius,
        };

        await supabase
          .from('form_styles')
          .upsert({ form_id: state.formId, ...styleData }, { onConflict: 'form_id' });

        // Upsert questions
        const questionsData = state.questions.map((q) => ({
          id: q.id,
          form_id: state.formId,
          type: q.type,
          title: q.title,
          description: q.description || null,
          placeholder: q.placeholder || null,
          required: q.required,
          order: q.order,
          options: q.options || [],
          logic: q.logic || [],
        }));

        if (questionsData.length > 0) {
          await supabase.from('questions').upsert(questionsData, { onConflict: 'id' });
        }

        state.markSaved();
      } catch (err) {
        console.error('Auto-save failed:', err);
        state.markSaving(false);
      }
    }, AUTO_SAVE_DELAY)
  ).current;

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    save(useBuilderStore.getState());
  }, [
    store.isDirty,
    store.formTitle,
    store.formSlug,
    store.artDirection,
    store.surface,
    store.typography,
    store.radius,
    store.questions,
    save,
  ]);
}
