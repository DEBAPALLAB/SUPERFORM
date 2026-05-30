'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { cn } from '@/lib/utils';
import { 
  Type, 
  AlignLeft, 
  CheckSquare, 
  CheckCircle, 
  Star, 
  Mail, 
  Phone, 
  Calendar, 
  Plus, 
  GripVertical, 
  Trash2, 
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateId } from '@/lib/utils';
import type { QuestionType } from '@/types';

const QUESTION_TYPES: { type: QuestionType; label: string; Icon: any }[] = [
  { type: 'short_text', label: 'Short Text', Icon: Type },
  { type: 'long_text', label: 'Long Text', Icon: AlignLeft },
  { type: 'multiple_choice', label: 'Choices', Icon: CheckSquare },
  { type: 'yes_no', label: 'Yes / No', Icon: CheckCircle },
  { type: 'rating', label: 'Rating', Icon: Star },
  { type: 'email', label: 'Email', Icon: Mail },
  { type: 'phone', label: 'Phone', Icon: Phone },
  { type: 'date', label: 'Date', Icon: Calendar },
  { type: 'statement', label: 'Statement', Icon: MessageSquare },
];

function SortableQuestionRow({ question, index }: { question: any; index: number }) {
  const { selectedQuestionId, selectQuestion, deleteQuestion } = useBuilderStore();
  const isActive = selectedQuestionId === question.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      layout
      style={style}
      onClick={() => selectQuestion(question.id)}
      className={cn(
        'group flex items-center gap-4 px-6 py-5 cursor-pointer transition-all mx-5 mb-4 border',
        isActive 
          ? 'bg-white border-[var(--color-ink)] shadow-[var(--shadow-float)] scale-[1.02]' 
          : 'bg-white/40 border-[var(--color-rule)] hover:border-[var(--color-muted)] hover:bg-white/80 hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
      style={{ ...style, borderRadius: 'var(--radius-md)' }}
    >
      <button 
        {...attributes} 
        {...listeners} 
        className="text-[var(--color-rule-dark)] hover:text-[var(--color-muted)] transition-colors p-1"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      
      <span className="font-mono text-[9px] text-[var(--color-muted)] w-5 shrink-0 font-bold tracking-tighter">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-mono text-[10px] truncate uppercase tracking-[0.12em] transition-colors',
          isActive ? 'text-[var(--color-ink)] font-bold' : 'text-[var(--color-muted)]'
        )}>
          {question.title || 'Untitled question'}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
        className="opacity-0 group-hover:opacity-100 p-2 text-[var(--color-muted)] hover:text-[var(--color-error)] transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function LeftPanel() {
  const { questions, addQuestion, reorderQuestions } = useBuilderStore();
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      reorderQuestions(oldIndex, newIndex);
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    addQuestion(type);
    setShowPicker(false);
  };

  return (
    <div className="w-[320px] border-r border-[var(--color-rule)] flex flex-col h-full bg-[var(--color-paper)] shrink-0 z-20">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--color-rule)] flex items-center justify-between">
        <span className="label-caps !text-[var(--color-ink)] !tracking-[0.2em]">Questions</span>
        <span className="font-mono text-[10px] text-[var(--color-muted)] bg-[var(--color-canvas)] px-2 py-0.5 rounded-full">{questions.length}</span>
      </div>

      {/* Primary Action */}
      <div className="p-6 bg-[var(--color-canvas)]/10 border-b border-[var(--color-rule)]">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="btn-primary w-full flex items-center justify-center gap-3 h-12 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative pt-6">
        {questions.length === 0 ? (
          <div className="p-12 text-center h-[240px] flex flex-col items-center justify-center opacity-30">
            <MessageSquare className="w-8 h-8 mb-4 text-[var(--color-rule-dark)]" />
            <p className="label-caps !leading-relaxed">Form has no elements<br/>Start by adding one</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              {questions.map((q, i) => (
                <SortableQuestionRow key={q.id} question={q} index={i} />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Element Picker Overlay - Improved UI */}
        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white z-20 flex flex-col"
            >
              <div className="px-8 py-5 border-b border-[var(--color-rule)] flex items-center justify-between shrink-0">
                <span className="label-caps !text-[var(--color-ink)]">Select Element</span>
                <button onClick={() => setShowPicker(false)} className="p-2 hover:bg-[var(--color-canvas)] transition-colors rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                  {QUESTION_TYPES.map(({ type, label, Icon }, i) => (
                    <motion.button
                      key={type}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleAddQuestion(type)}
                      className="flex items-center gap-4 p-4 hover:bg-[var(--color-canvas)]/50 transition-all group text-left rounded-xl border border-transparent hover:border-[var(--color-rule)]"
                    >
                      <div className="w-10 h-10 flex items-center justify-center border border-[var(--color-rule)] bg-white group-hover:border-[var(--color-ink)] transition-colors shrink-0 rounded-lg shadow-sm">
                        <Icon className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-ink)] font-medium">{label}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Meta */}
      <div className="px-8 py-5 border-t border-[var(--color-rule)] bg-[var(--color-canvas)]/10">
        <div className="flex items-center justify-between opacity-30">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] font-bold">Studio v1.0.4</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7px] uppercase">Stable</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
