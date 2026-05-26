"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Only used for signup visually here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError("");
    
    try {
      const fn = mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
        
      const { error: err } = await fn;
      if (err) {
        setError(err.message);
        return;
      }
      
      // Navigate to dashboard on success
      router.push("/dashboard");
    } catch (e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) setError(error.message);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-6 relative">
      {/* Clean Go Back / Close Button */}
      <button 
        onClick={() => router.push("/")}
        className="absolute top-8 right-8 md:top-12 md:right-12 w-10 h-10 border border-ink/10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:border-ink/20 hover:bg-[#FAF8F4]/80 transition-all active:scale-90"
        aria-label="Go back to home"
      >
        <X className="w-4 h-4" />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.85 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <div className="font-display text-lg tracking-wide flex items-center gap-4 mb-12">
          <svg className="w-6 h-6 rounded-[6px] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="registerSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="30%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#registerSfGrad)" letterSpacing="-0.03em">SF</text>
          </svg>
          <span className="font-bold tracking-[0.04em]">Superform</span>
        </div>

        <h1 className="font-serif italic text-3xl lg:text-4xl text-center mb-4 leading-tight">
          {mode === "signup" ? (
            <>Your form is ready.<br />Create a free account to save it.</>
          ) : (
            <>Welcome back.<br />Log in to your forms.</>
          )}
        </h1>
        
        <p className="font-mono text-xs text-muted tracking-widest uppercase mb-12 text-center">
          {mode === "signup" ? "No credit card required." : "Secure login."}
        </p>

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleGoogle}
            className="w-full border border-ink/15 bg-white text-ink p-4 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest hover:border-ink hover:bg-[#FAF8F4]/50 active:scale-[0.99] transition-all"
          >
            {/* SVG for Google G */}
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] bg-border flex-1" />
            <span className="font-mono text-[10px] uppercase text-muted tracking-widest">or email</span>
            <div className="h-[1px] bg-border flex-1" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name" 
                className="w-full bg-transparent border-b-2 border-ink/15 py-3 outline-none font-sans text-sm placeholder:text-ink/40 focus:border-ink transition-all"
              />
            )}
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address" 
              className="w-full bg-transparent border-b-2 border-ink/15 py-3 outline-none font-sans text-sm placeholder:text-ink/40 focus:border-ink transition-all"
            />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full bg-transparent border-b-2 border-ink/15 py-3 outline-none font-sans text-sm placeholder:text-ink/40 focus:border-ink transition-all"
            />
            
            {error && <p className="font-mono text-[10px] text-red-500">{error}</p>}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-canvas py-4 mt-4 font-mono text-xs uppercase tracking-widest text-center hover:bg-ink/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          <div className="border-t border-border pt-6 mt-4 flex justify-center">
            <button 
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

export default function Register() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
