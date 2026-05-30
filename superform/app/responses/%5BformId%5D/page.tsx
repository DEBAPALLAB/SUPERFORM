'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { THEME_STYLES, CONTINUE_BTN_STYLES } from '@/components/shared/DesignTokens';
import { cn, generateId } from '@/lib/utils';
import { 
  ChevronLeft, Search, Filter, ArrowUpRight, 
  CheckCircle, XCircle, Star, Inbox, Download, 
  BarChart3, LayoutList, Share2, MoreHorizontal,
  ArrowRight, X, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'STREAM' | 'SIGNAL' | 'EXPORT';
type ResponseStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected';

export default function ResponseRoom({ params }: { params: { formId: string } }) {
  const [view, setView] = useState<ViewMode>('STREAM');
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResponseStatus[]>(['new', 'reviewed', 'shortlisted']);

  const loadData = useCallback(async () => {
    const { data: f } = await supabase.from('forms').select('*').eq('id', params.formId).single();
    const { data: qs } = await supabase.from('questions').select('*').eq('form_id', params.formId).order('order');
    const { data: rs } = await supabase.from('responses').select('*, answers(*)').eq('form_id', params.formId).order('started_at', { ascending: false });
    const { data: intel } = await supabase.from('form_intelligence').select('*').eq('form_id', params.formId).single();
    
    setForm(f);
    setQuestions(qs || []);
    setResponses(rs || []);
    setIntelligence(intel);
    setLoading(false);
  }, [params.formId]);

  useEffect(() => {
    loadData();
    
    // Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `form_id=eq.${params.formId}` }, (payload) => {
        // Fetch full record with answers
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.formId, loadData]);

  // Keyboard Nav: J/K to navigate
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (view !== 'STREAM') return;
      const idx = responses.findIndex(r => r.id === selectedResponseId);
      if (e.key === 'j') {
        const next = responses[idx + 1] || responses[0];
        if (next) setSelectedResponseId(next.id);
      }
      if (e.key === 'k') {
        const prev = responses[idx - 1] || responses[responses.length - 1];
        if (prev) setSelectedResponseId(prev.id);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [view, responses, selectedResponseId]);

  const updateStatus = async (id: string, status: ResponseStatus) => {
    await supabase.from('responses').update({ status }).eq('id', id);
    setResponses(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const computeIntelligence = async () => {
    setLoading(true);
    await fetch(`/api/intelligence/${params.formId}`);
    await loadData();
  };

  if (loading && !form) return <div className="h-screen bg-[var(--color-paper)] flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">Hydrating Response Room...</div>;

  const filteredResponses = responses.filter(r => {
    const matchesStatus = statusFilter.includes(r.status as ResponseStatus);
    const matchesSearch = !search || JSON.stringify(r.answers).toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-[var(--color-paper)] overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-[var(--color-rule)] flex items-center justify-between px-6 bg-white z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="label-caps hover:text-[var(--color-ink)] flex items-center gap-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="h-4 w-px bg-[var(--color-rule)]" />
          <h1 className="font-display text-xl tracking-wider truncate max-w-[200px]">{form?.title}</h1>
          <span className="label-caps !text-[var(--color-muted)] text-[9px] border border-[var(--color-rule)] px-2 py-0.5">ROOM</span>
        </div>

        {/* View Switcher */}
        <div className="flex bg-[var(--color-canvas)] p-1 rounded-sm border border-[var(--color-rule)]">
          {(['STREAM', 'SIGNAL', 'EXPORT'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={cn(
                "px-5 py-1.5 font-mono text-[9px] tracking-widest transition-all rounded-sm",
                view === m ? "bg-white shadow-sm text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
           <span className="font-mono text-[10px] text-[var(--color-muted)]">{responses.length} TOTAL</span>
           <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {view === 'STREAM' && (
          <>
            {/* Filter Rail */}
            <aside className="w-[240px] border-r border-[var(--color-rule)] bg-[var(--color-canvas)]/10 p-6 space-y-8 flex flex-col overflow-y-auto">
              <div className="space-y-4">
                <label className="label-caps">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
                  <input 
                    placeholder="Search responses..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-[var(--color-rule)] pl-9 pr-4 py-2 font-mono text-[11px] outline-none focus:border-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="label-caps">Status</label>
                <div className="flex flex-col gap-2">
                  {(['new', 'shortlisted', 'rejected', 'reviewed'] as ResponseStatus[]).map(s => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 border font-mono text-[10px] uppercase tracking-wider transition-all",
                        statusFilter.includes(s) ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "bg-white text-[var(--color-muted)] border-[var(--color-rule)] hover:border-[var(--color-muted)]"
                      )}
                    >
                      {s}
                      <span className="opacity-40">{responses.filter(r => r.status === s).length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Response Stream */}
            <div className="flex-1 overflow-y-auto bg-[var(--color-canvas)]/30 p-8">
              {filteredResponses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center">
                   <Inbox className="w-12 h-12 mb-4" />
                   <p className="label-caps !text-lg">No responses match your filters</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {filteredResponses.map(r => (
                    <ResponseCard 
                      key={r.id} 
                      response={r} 
                      questions={questions} 
                      isSelected={selectedResponseId === r.id}
                      onClick={() => setSelectedResponseId(r.id)}
                      onStatusChange={(s) => updateStatus(r.id, s)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Response Drawer */}
            <AnimatePresence>
              {selectedResponseId && (
                <ResponseDrawer 
                  response={responses.find(r => r.id === selectedResponseId)}
                  questions={questions}
                  onClose={() => setSelectedResponseId(null)}
                  onStatusChange={(s) => updateStatus(selectedResponseId, s)}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {view === 'SIGNAL' && (
          <SignalView 
            intelligence={intelligence} 
            questions={questions} 
            responses={responses} 
            onRefresh={computeIntelligence}
          />
        )}

        {view === 'EXPORT' && (
          <div className="flex-1 flex flex-col items-center justify-center p-20 max-w-2xl mx-auto space-y-12">
            <div className="text-center space-y-4">
               <h2 className="font-display text-5xl">EXPORT DATA</h2>
               <p className="font-editorial text-xl italic text-[var(--color-muted)]">Take your signal wherever you need it.</p>
            </div>
            
            <div className="w-full grid grid-cols-1 gap-4">
               {[
                 { label: 'Download full CSV', sub: 'All questions, all responses', icon: Download },
                 { label: 'Export Shortlisted Only', sub: 'Filtered CSV of winners', icon: Star },
                 { label: 'Copy Share Link', sub: 'The live form URL', icon: Share2 },
                 { label: 'Connect to Google Sheets', sub: 'Real-time data sync', icon: ArrowUpRight, disabled: true }
               ].map(opt => (
                 <button key={opt.label} disabled={opt.disabled} className="group flex items-center justify-between p-6 bg-white border border-[var(--color-rule)] hover:border-[var(--color-ink)] transition-all text-left">
                   <div className="flex items-center gap-6">
                     <div className="w-10 h-10 flex items-center justify-center border border-[var(--color-rule)] group-hover:border-[var(--color-ink)] transition-colors">
                        <opt.icon className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-ink)]">{opt.label}</p>
                       <p className="font-mono text-[9px] text-[var(--color-muted)]">{opt.sub}</p>
                     </div>
                   </div>
                   <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                 </button>
               ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ResponseCard({ response, questions, isSelected, onClick, onStatusChange }: any) {
  const [expanded, setExpanded] = useState(false);
  const primaryAnswers = response.answers.slice(0, 3);
  const extraCount = response.answers.length - 3;

  const getStatusColor = (s: string) => {
    if (s === 'shortlisted') return 'bg-[var(--color-ink)] text-white';
    if (s === 'rejected') return 'bg-gray-100 text-gray-400 line-through';
    return 'bg-[var(--color-rule)] text-[var(--color-ink)]';
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group bg-white border p-8 transition-all cursor-pointer relative",
        isSelected ? "border-[var(--color-ink)] shadow-2xl scale-[1.01]" : "border-[var(--color-rule)] hover:border-[var(--color-muted)] shadow-sm"
      )}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            {response.answers.find((a: any) => a.question_id === questions.find((q: any) => q.type === 'email')?.id)?.value || `Respondent #${response.id.slice(-4)}`}
          </p>
          <p className="font-mono text-[9px] text-[var(--color-muted)]">
            {new Date(response.started_at).toLocaleDateString()} · {new Date(response.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--color-muted)]">
             <Clock className="w-3 h-3" />
             {Math.round((new Date(response.completed_at || 0).getTime() - new Date(response.started_at).getTime()) / 1000)}s
          </div>
          <span className={cn("px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest", getStatusColor(response.status))}>
            {response.status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {(expanded ? response.answers : primaryAnswers).map((a: any) => {
          const q = questions.find((qu: any) => qu.id === a.question_id);
          return (
            <div key={a.id} className="space-y-1.5">
               <p className="font-mono text-[9px] text-[var(--color-muted)] uppercase tracking-wider">{q?.title || 'Unknown'}</p>
               <p className="font-editorial text-lg text-[var(--color-ink)] leading-snug">{a.value}</p>
            </div>
          );
        })}
      </div>

      {extraCount > 0 && !expanded && (
        <button 
          onClick={e => { e.stopPropagation(); setExpanded(true); }}
          className="mt-6 font-mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          + {extraCount} more answers
        </button>
      )}

      {/* Floating Actions */}
      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
         <button onClick={e => { e.stopPropagation(); onStatusChange('shortlisted'); }} className="p-2 bg-white border border-[var(--color-rule)] hover:border-[var(--color-ink)] transition-colors"><Star className="w-3.5 h-3.5" /></button>
         <button onClick={e => { e.stopPropagation(); onStatusChange('rejected'); }} className="p-2 bg-white border border-[var(--color-rule)] hover:border-[var(--color-error)] transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function ResponseDrawer({ response, questions, onClose, onStatusChange }: any) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-[500px] bg-white border-l border-[var(--color-rule)] shadow-2xl z-[60] flex flex-col"
    >
      <div className="h-14 border-b border-[var(--color-rule)] flex items-center justify-between px-6 shrink-0">
        <span className="label-caps">Detailed Insight</span>
        <button onClick={onClose} className="p-2 hover:bg-[var(--color-canvas)]"><X className="w-4 h-4" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-10 space-y-12">
        <div className="flex flex-wrap gap-2">
           {(['new', 'shortlisted', 'reviewed', 'rejected'] as ResponseStatus[]).map(s => (
             <button 
               key={s}
               onClick={() => onStatusChange(s)}
               className={cn(
                 "px-4 py-2 border font-mono text-[9px] uppercase tracking-widest transition-all",
                 response.status === s ? "bg-[var(--color-ink)] text-white" : "hover:bg-[var(--color-canvas)]"
               )}
             >
               {s}
             </button>
           ))}
        </div>

        <div className="space-y-10">
          {questions.map((q: any) => {
            const a = response.answers.find((ans: any) => ans.question_id === q.id);
            return (
              <div key={q.id} className="space-y-3">
                 <p className="label-caps !text-[var(--color-muted)]">{q.title}</p>
                 <div className="p-6 bg-[var(--color-canvas)]/30 border border-[var(--color-rule)]">
                    <p className="font-editorial text-xl leading-relaxed italic text-[var(--color-ink)]">
                      {a?.value || 'No response provided.'}
                    </p>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function SignalView({ intelligence, questions, responses, onRefresh }: any) {
  if (!intelligence && responses.length < 10) {
    const progress = (responses.length / 10) * 100;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center max-w-xl mx-auto space-y-8">
        <BarChart3 className="w-16 h-16 opacity-10" />
        <div className="space-y-2">
           <h3 className="font-display text-4xl">COLLECTING DATA...</h3>
           <p className="font-editorial text-lg italic text-[var(--color-muted)]">Signal Intelligence activates once 10 responses are collected.</p>
        </div>
        <div className="w-full h-1 bg-[var(--color-rule)] relative overflow-hidden">
           <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="absolute inset-y-0 left-0 bg-[var(--color-ink)]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">{responses.length} / 10 RESPONSES</p>
      </div>
    );
  }

  const intel = intelligence || {};

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-canvas)]/20 p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
           <div>
             <h2 className="font-display text-6xl tracking-tight">SIGNAL INTELLIGENCE</h2>
             <p className="font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mt-2">
               Last updated {new Date(intel.computed_at).toLocaleTimeString()} · v2.1.0
             </p>
           </div>
           <button onClick={onRefresh} className="btn-primary !px-6">REFRESH SIGNAL</button>
        </div>

        <div className="grid grid-cols-2 gap-8">
           {/* Card 1: DROP-OFF */}
           <div className="bg-white border border-[var(--color-rule)] p-10 space-y-8 col-span-2">
              <label className="label-caps">WHERE PEOPLE LEAVE</label>
              <div className="space-y-6">
                 {(intel.drop_off_by_question || []).map((q: any) => (
                   <div key={q.question_id} className="space-y-2">
                      <div className="flex justify-between font-mono text-[10px] uppercase">
                         <span className="truncate max-w-[400px]">{q.title}</span>
                         <span>{Math.round(q.percentage)}% Answered</span>
                      </div>
                      <div className="h-3 bg-[var(--color-canvas)] w-full relative">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${q.percentage}%` }} 
                           className={cn(
                             "absolute inset-y-0 left-0",
                             q.percentage > 80 ? "bg-[var(--color-ink)]" : q.percentage > 60 ? "bg-[var(--color-muted)]" : "bg-[var(--color-error)]"
                           )} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Card 2: COMPLETION */}
           <div className="bg-white border border-[var(--color-rule)] p-10 flex flex-col justify-center items-center text-center space-y-4">
              <label className="label-caps">COMPLETION RATE</label>
              <span className="font-display text-8xl text-[var(--color-ink)]">{Math.round(intel.completion_rate)}%</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", intel.completion_rate > 70 ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]")} />
                <span className="font-mono text-[9px] uppercase tracking-widest">
                  {intel.completion_rate > 70 ? 'HEALTHY PERFORMANCE' : 'NEEDS ATTENTION'}
                </span>
              </div>
           </div>

           {/* Card 3: TIME */}
           <div className="bg-white border border-[var(--color-rule)] p-10 flex flex-col justify-center items-center text-center space-y-4">
              <label className="label-caps">AVG. COMPLETION TIME</label>
              <span className="font-display text-8xl text-[var(--color-ink)]">
                {Math.floor(intel.avg_completion_seconds / 60)}m {intel.avg_completion_seconds % 60}s
              </span>
              <p className="font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest italic">
                Slightly above estimated time.
              </p>
           </div>

           {/* Card 6: AI SUMMARY */}
           <div className="bg-white border border-[var(--color-rule)] p-10 col-span-2 space-y-8">
              <label className="label-caps">PATTERN BRIEF (AI)</label>
              <p className="font-editorial text-2xl italic leading-relaxed text-[var(--color-ink)] max-w-3xl">
                "{intel.ai_summary || 'Analyzing patterns in your responses...'}"
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
