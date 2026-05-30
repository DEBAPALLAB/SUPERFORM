'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateSlug, generateId } from '@/lib/utils';
import { LayoutGrid, BarChart2, Settings, ExternalLink, Edit2, BarChart, Plus, X, LogOut, User, Shield, Bell, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Form, ArtDirectionKey } from '@/types';

const CARD_THEMES: Record<ArtDirectionKey, { bg: string; titleColor: string; metaColor: string }> = {
  minimal:   { bg: '#FFFFFF', titleColor: '#111111', metaColor: '#999791' },
  editorial: { bg: '#FAF8F4', titleColor: '#2C2416', metaColor: '#8C7B5E' },
  glass:     { bg: 'linear-gradient(135deg, rgba(200,200,255,0.3), rgba(255,200,200,0.2))', titleColor: '#2A2A2A', metaColor: '#666' },
  brutalist: { bg: '#000000', titleColor: '#FFFFFF', metaColor: '#555555' },
  cinematic: { bg: '#0D0D0D', titleColor: '#E8DCC8', metaColor: '#7A6F5E' },
};

function FormCard({ form, onDelete }: { form: Form & { art_direction?: ArtDirectionKey }; onDelete: (id: string) => void }) {
  const router = useRouter();
  const direction: ArtDirectionKey = form.art_direction || 'minimal';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      onClick={() => router.push(`/builder/${form.id}`)}
      className="group bg-white border border-[var(--color-rule)] p-8 transition-all duration-500 hover:shadow-[var(--shadow-soft)] hover:border-[var(--color-muted)] relative overflow-hidden flex flex-col cursor-pointer"
      style={{ width: '340px', minHeight: '220px', borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex justify-between items-start mb-6">
        <span className="label-caps !text-[9px] px-2 py-1 bg-[var(--color-canvas)] rounded-md">
          {direction} · {form.status || 'DRAFT'}
        </span>
        <button 
          onClick={e => { e.stopPropagation(); onDelete(form.id); }} 
          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <h3 className="font-display text-3xl tracking-tight mb-auto leading-[1.2] text-[var(--color-ink)]">
        {form.title}
      </h3>

      <div className="flex gap-10 mt-10 border-t border-[var(--color-rule)] pt-6">
        <div>
          <p className="label-caps !text-[8px] mb-1.5 opacity-60">Questions</p>
          <p className="font-mono text-[13px] font-semibold">{(form as any).question_count || 0}</p>
        </div>
        <div>
          <p className="label-caps !text-[8px] mb-1.5 opacity-60">Responses</p>
          <p className="font-mono text-[13px] font-semibold">{(form as any).response_count || 0}</p>
        </div>
      </div>

      {/* Hover Overlay */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-white/40 flex flex-col items-center justify-center gap-3 z-10 backdrop-blur-md"
        >
          <button 
            onClick={e => { e.stopPropagation(); router.push(`/builder/${form.id}`); }}
            className="font-mono text-[10px] uppercase tracking-[0.2em] bg-[var(--color-ink)] text-white px-8 py-3 rounded-full hover:shadow-xl hover:scale-105 transition-all"
          >
            Open Studio
          </button>
          <button 
            onClick={e => { e.stopPropagation(); window.location.href = `/responses/${form.id}`; }}
            className="font-mono text-[10px] uppercase tracking-[0.2em] border-2 border-[var(--color-ink)] text-[var(--color-ink)] px-8 py-2.5 rounded-full hover:bg-[var(--color-canvas)] transition-all font-bold"
          >
            Responses
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function IntentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (formId: string) => void }) {
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const quickStarts = ['WAITLIST', 'JOB APPLICATION', 'EVENT SIGNUP', 'FEEDBACK'];

  const [strategyNotes, setStrategyNotes] = useState<string | null>(null);

  const submit = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setStrategyNotes(null);

    try {
      const res = await fetch('/api/generate/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: text }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // AI Response V2 Schema
      const form = data.form;
      if (!form.questions) throw new Error('AI failed to build questions.');

      // Ephemeral strategy notes
      setStrategyNotes(form.strategy_notes);

      const formId = generateId();
      const slug = generateSlug(form.title);

      const { data: { user } } = await supabase.auth.getUser();

      try {
        const { data: dbForm, error: fErr } = await supabase
          .from('forms')
          .insert({ 
            id: formId,
            title: form.title, 
            slug, 
            user_id: user?.id || null,
            status: 'draft'
          })
          .select()
          .single();

        if (fErr) throw fErr;

        const questionsToInsert = form.questions.map((q: any, i: number) => ({
          form_id: formId,
          type: q.type,
          title: q.title,
          description: q.description || '',
          required: !!q.required,
          order: i,
          placeholder: q.placeholder || '',
          options: Array.isArray(q.options) 
            ? q.options.map((o: any) => typeof o === 'string' ? { id: generateId(), label: o } : o) 
            : [],
        }));

        await supabase.from('questions').insert(questionsToInsert);
        await supabase.from('form_styles').insert({ 
          form_id: formId, 
          art_direction: form.art_direction || 'minimal'
        });
      } catch (dbErr: any) {
        console.error('Persistence failed:', dbErr);
      }

      // If we have strategy notes, stay for 5s then redirect with notes param
      if (form.strategy_notes) {
        setTimeout(() => {
          const params = new URLSearchParams();
          params.set('notes', form.strategy_notes);
          router.push(`/builder/${formId}?${params.toString()}`);
        }, 5000);
      } else {
        onCreate(formId);
      }

    } catch (err) {
      console.error('V2 Flow failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white p-12 relative overflow-hidden shadow-[var(--shadow-float)]"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-[var(--color-canvas)] rounded-full transition-all">
          <X className="w-5 h-5 text-[var(--color-muted)]" />
        </button>

        {loading ? (
          <div className="text-center space-y-10 py-10">
            {strategyNotes ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-left p-8 bg-[var(--color-canvas)] border-l-4 border-[var(--color-accent)] animate-slide-in rounded-r-xl"
              >
                <p className="label-caps !text-[var(--color-muted)] mb-3">Strategy Insight</p>
                <p className="font-mono text-[11px] leading-relaxed text-[var(--color-ink)]">
                  {strategyNotes}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <span className="font-mono text-[9px] text-[var(--color-muted)] uppercase tracking-widest">
                    Crafting form schema...
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="w-48 h-1 bg-[var(--color-rule)] mx-auto overflow-hidden relative rounded-full">
                  <div className="absolute inset-y-0 left-0 w-full bg-[var(--color-ink)]" style={{ animation: 'slide-rule 1.2s ease-in-out infinite' }} />
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-muted)]">Researching Intent...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6">
            <p className="label-caps mb-4">Signal Intent Engine</p>
            <input
              value={intent}
              onChange={e => setIntent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit(intent)}
              placeholder="What are we building today?"
              autoFocus
              className="w-full bg-transparent outline-none text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/40"
              style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px, 4vw, 48px)', fontStyle: 'italic', borderBottom: '2px solid var(--color-rule)', paddingBottom: '24px', lineHeight: 1.2 }}
            />
            <div className="flex gap-2.5 mt-10 flex-wrap">
              {quickStarts.map(q => (
                <button key={q} onClick={() => submit(q)}
                  className="font-mono text-[9px] uppercase tracking-widest border border-[var(--color-rule)] px-5 py-2.5 rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<(Form & { art_direction?: ArtDirectionKey })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntent, setShowIntent] = useState(false);
  const [activeNav, setActiveNav] = useState<'forms' | 'responses' | 'settings'>('forms');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  useEffect(() => {
    async function load() {
      try {
        const { data: formsData, error } = await supabase
          .from('forms')
          .select(`*, form_styles(art_direction)`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading dashboard forms:', error);
          setLoading(false);
          return;
        }

        setForms((formsData || []).map((f: any) => ({
          ...f,
          art_direction: f.form_styles?.[0]?.art_direction || 'minimal',
          question_count: 0,
          response_count: 0,
        })));
      } catch (err) {
        console.error('Unexpected dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const createBlankForm = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const slug = generateSlug('Untitled Form');
    const { data: form } = await supabase.from('forms').insert({ title: 'Untitled Form', slug, user_id: user?.id || 'anon', settings: {} }).select().single();
    if (form) router.push(`/builder/${form.id}`);
  };

  const deleteForm = async (id: string) => {
    await supabase.from('forms').delete().eq('id', id);
    setForms(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex">
      {/* Sidebar icon rail */}
      <div className="w-[72px] border-r border-[var(--color-rule)] flex flex-col items-center py-8 gap-4 sticky top-0 h-screen shrink-0 bg-white">
        <Link href="/" className="w-10 h-10 bg-[var(--color-ink)] flex items-center justify-center mb-8 rounded-xl shadow-lg">
          <span className="font-display text-white text-sm">S</span>
        </Link>
        {[
          { key: 'forms', Icon: LayoutGrid, tip: 'Forms' },
          { key: 'responses', Icon: BarChart2, tip: 'Responses' },
          { key: 'settings', Icon: Settings, tip: 'Settings' },
        ].map(({ key, Icon, tip }) => (
          <button
            key={key}
            onClick={() => setActiveNav(key as typeof activeNav)}
            className={cn(
              "group relative w-12 h-12 flex items-center justify-center transition-all duration-300 rounded-xl",
              activeNav === key ? "bg-[var(--color-canvas)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:bg-[var(--color-canvas)]/50"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="absolute left-16 bg-[var(--color-ink)] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono tracking-widest z-50">
              {tip}
            </span>
          </button>
        ))}

        <div className="mt-auto flex flex-col gap-4">
          <button
            onClick={handleSignOut}
            className="group relative w-12 h-12 flex items-center justify-center transition-all duration-300 rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-16 bg-[var(--color-error)] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono tracking-widest z-50">
              LOGOUT
            </span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Nav */}
        <nav className="h-14 border-b border-[var(--color-rule)] flex items-center justify-between px-6 sticky top-0 bg-[var(--color-paper)] z-10">
          <h1 className="font-display text-2xl tracking-wider">DASHBOARD</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowIntent(true)} 
              className="font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 border-2 border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-all font-bold"
            >
              AI GENERATE
            </button>
            <button onClick={createBlankForm}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors flex items-center gap-2">
              <Plus className="w-3 h-3" /> NEW FORM
            </button>
            
            {/* Supabase Status Indicator */}
            <div 
              className={cn(
                "w-3 h-3 rounded-full border border-white/20",
                process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"
              )} 
              title={process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ? "Supabase Not Connected" : "Supabase Connected"}
            />
          </div>
        </nav>

        {/* Configuration Warning */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && (
          <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] p-4 border-b border-[var(--color-error)]/20 font-mono text-[11px] flex justify-between items-center">
            <span>⚠ SUPABASE KEYS ARE MISSING. PERSISTENCE IS DISABLED. PLEASE UPDATE .ENV.LOCAL AND RESTART TERMINAL.</span>
            <Link href="/auth" className="underline">GO TO AUTH →</Link>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64"
              >
                <div className="w-32 h-0.5 bg-[var(--color-rule)] overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-[var(--color-ink)] w-full" style={{ animation: 'slide-rule 1s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
              </motion.div>
            ) : activeNav === 'settings' ? (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="font-display text-5xl tracking-wider mb-2">ACCOUNT SETTINGS</h2>
                    <p className="label-caps opacity-40">Manage your profile and preferences</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Card */}
                  <div className="bg-white p-8 border border-[var(--color-rule)] rounded-[24px] shadow-[var(--shadow-soft)] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="label-caps !text-[var(--color-ink)]">Personal Profile</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="label-caps block mb-1.5 ml-1">Email Address</label>
                        <div className="w-full font-mono text-[12px] p-4 bg-[var(--color-canvas)]/50 rounded-xl text-[var(--color-ink)] border border-[var(--color-rule)]">
                          {user?.email || 'Loading...'}
                        </div>
                      </div>
                      <div>
                        <label className="label-caps block mb-1.5 ml-1">Account ID</label>
                        <div className="w-full font-mono text-[10px] p-4 bg-[var(--color-canvas)]/30 rounded-xl text-[var(--color-muted)] break-all">
                          {user?.id || 'Not logged in'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Card */}
                  <div className="bg-white p-8 border border-[var(--color-rule)] rounded-[24px] shadow-[var(--shadow-soft)] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="label-caps !text-[var(--color-ink)]">Security & Access</span>
                    </div>
                    <div className="space-y-4">
                      <button className="w-full text-left p-4 hover:bg-[var(--color-canvas)]/50 rounded-xl transition-all border border-transparent hover:border-[var(--color-rule)] group">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-ink)] mb-1">Update Password</p>
                        <p className="font-editorial text-[13px] italic text-[var(--color-muted)]">Secure your account with a new passkey</p>
                      </button>
                      <button className="w-full text-left p-4 hover:bg-[var(--color-canvas)]/50 rounded-xl transition-all border border-transparent hover:border-[var(--color-rule)] group">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-ink)] mb-1">Two-Factor Auth</p>
                        <p className="font-editorial text-[13px] italic text-[var(--color-muted)]">Add an extra layer of protection</p>
                      </button>
                    </div>
                  </div>

                  {/* Billing/Usage */}
                  <div className="bg-white p-8 border border-[var(--color-rule)] rounded-[24px] shadow-[var(--shadow-soft)] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="label-caps !text-[var(--color-ink)]">Plan & Usage</span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-[var(--color-ink)] text-white rounded-xl">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1 opacity-60">Current Plan</p>
                        <p className="font-display text-2xl tracking-wide">FOUNDER PRO</p>
                      </div>
                      <div className="flex justify-between items-end p-4 border border-[var(--color-rule)] rounded-xl">
                        <div>
                          <p className="label-caps !text-[8px] mb-1">Generation Credits</p>
                          <p className="font-mono text-[14px]">842 / 1000</p>
                        </div>
                        <div className="w-24 h-1 bg-[var(--color-canvas)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-accent)] w-[84%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-white p-8 border border-[var(--color-rule)] rounded-[24px] shadow-[var(--shadow-soft)] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="label-caps !text-[var(--color-ink)]">Notifications</span>
                    </div>
                    <div className="space-y-3">
                      {['Email Reports', 'New Response Alerts', 'Weekly Digest'].map(pref => (
                        <div key={pref} className="flex items-center justify-between p-3 hover:bg-[var(--color-canvas)]/30 rounded-lg transition-colors">
                          <span className="font-editorial text-sm italic">{pref}</span>
                          <div className="w-8 h-4 bg-[var(--color-success)] rounded-full relative">
                            <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeNav === 'responses' ? (
              <motion.div 
                key="responses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-5xl mx-auto"
              >
                <div className="flex items-center justify-between mb-12">
                  <h2 className="font-display text-5xl tracking-wider">ALL RESPONSES</h2>
                  <p className="label-caps opacity-40">Recent activity across all forms</p>
                </div>
                
                <div className="border border-[var(--color-rule)] bg-white divide-y divide-[var(--color-rule)]">
                   {forms.length === 0 ? (
                     <div className="p-20 text-center label-caps opacity-30">No activity yet</div>
                   ) : (
                     <div className="p-10 text-center space-y-4">
                       <p className="font-editorial text-2xl italic">Select a form to view detailed results.</p>
                       <div className="flex flex-wrap justify-center gap-4">
                          {forms.map(f => (
                            <Link key={f.id} href={`/responses/${f.id}`} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-[var(--color-rule)] hover:border-[var(--color-ink)] transition-colors">
                              {f.title} →
                            </Link>
                          ))}
                       </div>
                     </div>
                   )}
                </div>
              </motion.div>
            ) : forms.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center h-[60vh] text-center gap-6"
              >
                <h2 className="font-display text-7xl tracking-wider text-[var(--color-ink)]">NO FORMS YET.</h2>
                <p className="font-editorial text-xl italic text-[var(--color-muted)]">Start with an intent, not a blank page.</p>
                <button onClick={() => setShowIntent(true)}
                  className="font-mono text-[11px] uppercase tracking-widest px-8 py-4 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors mt-4">
                  WHAT ARE YOU BUILDING?
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="forms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">{forms.length} FORM{forms.length !== 1 ? 'S' : ''}</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  {forms.map((form, i) => (
                    <motion.div
                      key={form.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <FormCard form={form} onDelete={deleteForm} />
                    </motion.div>
                  ))}
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: forms.length * 0.05, duration: 0.5 }}
                    onClick={createBlankForm}
                    style={{ width: '280px', height: '180px', border: '1px dashed var(--color-rule)', flexShrink: 0 }}
                    className="flex flex-col items-center justify-center gap-3 hover:border-[var(--color-muted)] hover:bg-[var(--color-canvas)] transition-all rounded-[var(--radius-md)]"
                  >
                    <Plus className="w-6 h-6 text-[var(--color-muted)]" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)]">New Form</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showIntent && (
        <IntentModal
          onClose={() => setShowIntent(false)}
          onCreate={(id) => { setShowIntent(false); router.push(`/builder/${id}`); }}
        />
      )}
    </div>
  );
}
