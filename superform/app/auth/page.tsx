'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const fn = mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const { error: err } = await fn;
      if (err) { setError(err.message); return; }
      router.push('/dashboard');
    } catch (e) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-transparent border-b border-[var(--color-rule)] outline-none font-mono text-[14px] py-3 focus:border-[var(--color-ink)] transition-colors placeholder:text-[var(--color-muted)] placeholder:italic";

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <header className="h-14 border-b border-[var(--color-rule)] flex items-center px-8">
        <Link href="/" className="font-display text-2xl tracking-wider">SUPERFORM</Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h1 className="font-display text-5xl tracking-wider mb-2">
                  {mode === 'login' ? 'WELCOME BACK.' : 'CREATE ACCOUNT.'}
                </h1>
                <p className="font-editorial text-lg italic text-[var(--color-muted)]">
                  {mode === 'login' ? 'Sign in to your forms.' : 'Start building for free.'}
                </p>
              </div>

              <div className="space-y-6 mt-10">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] block mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={inputStyle} />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-muted)] block mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="••••••••" className={inputStyle} />
                </div>

                {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submit} 
                  disabled={loading}
                  className="w-full font-mono text-[11px] uppercase tracking-widest py-4 bg-[var(--color-ink)] text-white hover:bg-[#333] transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
                </motion.button>
              </div>

              <div className="border-t border-[var(--color-rule)] pt-6 mt-10">
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
                  {mode === 'login' ? "Don't have an account? SIGN UP" : 'Already have an account? LOG IN'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
