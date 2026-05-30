'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ArtDirectionKey,
  SurfaceKey,
  TypographyKey,
  RadiusKey,
  Question,
  QuestionType,
  Issue,
  FormStyle,
} from '@/types';
import { generateId } from '@/lib/utils';
import { debounce } from '@/lib/utils';

// Auto-cascade map for art directions
const ART_DIRECTION_DEFAULTS: Record<ArtDirectionKey, { surface: SurfaceKey; radius: RadiusKey; typography: TypographyKey }> = {
  minimal:   { surface: 'flat',  radius: 'sm',   typography: 'sm' },
  editorial: { surface: 'frame', radius: 'none', typography: 'lg' },
  glass:     { surface: 'glass', radius: 'md',   typography: 'md' },
  brutalist: { surface: 'flat',  radius: 'none', typography: 'lg' },
  cinematic: { surface: 'card',  radius: 'full', typography: 'md' },
};

function defaultQuestion(type: QuestionType, order: number): Question {
  const base: Question = {
    id: generateId(),
    form_id: '',
    type,
    title: `Question ${order + 1}`,
    required: false,
    order,
  };

  switch (type) {
    case 'multiple_choice':
      return { ...base, title: 'Choose an option', options: [
        { id: generateId(), label: 'Option A' },
        { id: generateId(), label: 'Option B' },
        { id: generateId(), label: 'Option C' },
      ]};
    case 'yes_no':
      return { ...base, title: 'Yes or No?' };
    case 'rating':
      return { ...base, title: 'Rate your experience', maxRating: 10 };
    case 'email':
      return { ...base, title: 'What is your email?', placeholder: 'name@example.com' };
    case 'phone':
      return { ...base, title: 'What is your phone number?', placeholder: '+1 (555) 000-0000' };
    case 'statement':
      return { ...base, title: 'A statement to display', description: 'No answer required.' };
    case 'short_text':
      return { ...base, placeholder: 'Type your answer here...' };
    case 'long_text':
      return { ...base, placeholder: 'Tell us more...' };
    case 'date':
      return { ...base, title: 'Select a date' };
    default:
      return base;
  }
}

interface BuilderStore {
  // Identity
  formId: string;
  formTitle: string;
  formSlug: string;

  // Editor
  mode: 'build' | 'design' | 'preview';
  questions: Question[];
  selectedQuestionId: string | null;

  // Design
  artDirection: ArtDirectionKey;
  surface: SurfaceKey;
  typography: TypographyKey;
  radius: RadiusKey;
  previewingDirection: ArtDirectionKey | null;
  autoSetSurface: boolean;
  autoSetTypography: boolean;
  autoSetRadius: boolean;

  // Status
  isDirty: boolean;
  isSaving: boolean;
  issues: Issue[];

  // Actions
  init: (data: {
    formId: string;
    formTitle: string;
    formSlug: string;
    questions: Question[];
    style?: Partial<FormStyle>;
  }) => void;
  setMode: (mode: 'build' | 'design' | 'preview') => void;
  setFormTitle: (title: string) => void;
  setFormSlug: (slug: string) => void;
  addQuestion: (type: QuestionType) => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  duplicateQuestion: (id: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  selectQuestion: (id: string | null) => void;
  setArtDirection: (dir: ArtDirectionKey) => void;
  previewDirection: (dir: ArtDirectionKey | null) => void;
  setSurface: (s: SurfaceKey) => void;
  setTypography: (t: TypographyKey) => void;
  setRadius: (r: RadiusKey) => void;
  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  computeIssues: () => void;
}

export const useBuilderStore = create<BuilderStore>()(
  subscribeWithSelector((set, get) => ({
    formId: '',
    formTitle: 'Untitled Form',
    formSlug: '',
    mode: 'build',
    questions: [],
    selectedQuestionId: null,
    artDirection: 'minimal',
    surface: 'flat',
    typography: 'sm',
    radius: 'sm',
    previewingDirection: null,
    autoSetSurface: true,
    autoSetTypography: true,
    autoSetRadius: true,
    isDirty: false,
    isSaving: false,
    issues: [],

    init: (data) => {
      const style = data.style || {};
      set({
        formId: data.formId,
        formTitle: data.formTitle,
        formSlug: data.formSlug,
        questions: data.questions,
        selectedQuestionId: data.questions[0]?.id || null,
        artDirection: style.art_direction || 'minimal',
        surface: style.surface || 'flat',
        typography: style.typography || 'sm',
        radius: style.radius || 'sm',
        isDirty: false,
        isSaving: false,
      });
      get().computeIssues();
    },

    setMode: (mode) => set({ mode }),

    setFormTitle: (title) => set({ formTitle: title, isDirty: true }),
    setFormSlug: (slug) => set({ formSlug: slug, isDirty: true }),

    addQuestion: (type) => {
      const { questions } = get();
      const q = defaultQuestion(type, questions.length);
      q.form_id = get().formId;
      set({
        questions: [...questions, q],
        selectedQuestionId: q.id,
        isDirty: true,
      });
      get().computeIssues();
    },

    removeQuestion: (id) => {
      const { questions, selectedQuestionId } = get();
      const filtered = questions.filter((q) => q.id !== id);
      const newSelected =
        selectedQuestionId === id
          ? filtered[0]?.id || null
          : selectedQuestionId;
      set({
        questions: filtered.map((q, i) => ({ ...q, order: i })),
        selectedQuestionId: newSelected,
        isDirty: true,
      });
      get().computeIssues();
    },

    updateQuestion: (id, updates) => {
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
        isDirty: true,
      }));
      get().computeIssues();
    },

    duplicateQuestion: (id) => {
      const { questions } = get();
      const idx = questions.findIndex((q) => q.id === id);
      if (idx === -1) return;
      const copy: Question = {
        ...questions[idx],
        id: generateId(),
        title: questions[idx].title + ' (Copy)',
        order: idx + 1,
      };
      const next = [...questions];
      next.splice(idx + 1, 0, copy);
      set({
        questions: next.map((q, i) => ({ ...q, order: i })),
        selectedQuestionId: copy.id,
        isDirty: true,
      });
      get().computeIssues();
    },

    reorderQuestions: (fromIndex, toIndex) => {
      const { questions } = get();
      const next = [...questions];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      set({ questions: next.map((q, i) => ({ ...q, order: i })), isDirty: true });
    },

    selectQuestion: (id) => set({ selectedQuestionId: id }),

    setArtDirection: (dir) => {
      const defaults = ART_DIRECTION_DEFAULTS[dir];
      set({
        artDirection: dir,
        surface: defaults.surface,
        typography: defaults.typography,
        radius: defaults.radius,
        autoSetSurface: true,
        autoSetTypography: true,
        autoSetRadius: true,
        isDirty: true,
      });
    },

    previewDirection: (dir) => set({ previewingDirection: dir }),

    setSurface: (s) => set({ surface: s, autoSetSurface: false, isDirty: true }),
    setTypography: (t) => set({ typography: t, autoSetTypography: false, isDirty: true }),
    setRadius: (r) => set({ radius: r, autoSetRadius: false, isDirty: true }),

    markSaving: (saving) => set({ isSaving: saving }),
    markSaved: () => set({ isSaving: false, isDirty: false }),

    computeIssues: () => {
      const { questions } = get();
      const issues: Issue[] = [];
      if (questions.length === 0) {
        issues.push({
          id: 'no-questions',
          type: 'error',
          message: 'No questions added',
          action: 'add-question',
          actionLabel: 'Add Question',
        });
      }
      const hasRequired = questions.some((q) => q.required);
      if (questions.length > 0 && !hasRequired) {
        issues.push({
          id: 'no-required',
          type: 'warning',
          message: 'No questions marked required',
          action: 'mark-required',
          actionLabel: 'Skip anyway',
        });
      }
      set({ issues });
    },
  }))
);
