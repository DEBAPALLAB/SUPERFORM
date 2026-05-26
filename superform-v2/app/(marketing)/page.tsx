"use client";

import Link from "next/link";
import TransitionLink from "@/components/TransitionLink";
import { ArrowRight, Sparkles, Layout, LineChart, Layers, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/components/TransitionProvider";

type Aesthetic = "Minimal" | "Editorial" | "Brutalist" | "Cinematic" | "Glass";
type Transition = "Slide" | "Fade" | "Zoom" | "Flip";

export default function Home() {
  const router = useRouter();
  const { navigateTo } = usePageTransition();
  const [activeAesthetic, setActiveAesthetic] = useState<Aesthetic>("Editorial");
  const [activeTransition, setActiveTransition] = useState<Transition>("Slide");
  const [transitionTick, setTransitionTick] = useState(0);

  // Immersive Hero States
  const [heroIntent, setHeroIntent] = useState("");
  const [heroAesthetic, setHeroAesthetic] = useState<Aesthetic>("Editorial");
  const [rotatingWordIdx, setRotatingWordIdx] = useState(0);
  const rotatingWords = ["EXPERIENCE", "COGNITION", "CONVERSATION", "IDENTITY"];

  const [mockOpinion, setMockOpinion] = useState("");
  const [showDemoSuccess, setShowDemoSuccess] = useState(false);

  useEffect(() => {
    setMockOpinion("");
    setShowDemoSuccess(false);
  }, [heroAesthetic]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingWordIdx((prev) => (prev + 1) % rotatingWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroIntent.trim()) return;
    localStorage.setItem("superform_intent", heroIntent);
    navigateTo("/register");
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDemoSuccess(true);
  };

  const triggerTransitionDemo = () => {
    setTransitionTick((prev) => prev + 1);
  };

  const getTransitionProps = () => {
    switch (activeTransition) {
      case "Slide":
        return {
          initial: { opacity: 0, y: 35 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -25 },
          transition: { type: "spring", stiffness: 320, damping: 26 }
        };
      case "Fade":
        return {
          initial: { opacity: 0, scale: 0.98, filter: "blur(5px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 1.02, filter: "blur(5px)" },
          transition: { duration: 0.4, ease: "easeInOut" }
        };
      case "Zoom":
        return {
          initial: { opacity: 0, scale: 0.75 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.15 },
          transition: { type: "spring", stiffness: 380, damping: 22 }
        };
      case "Flip":
        return {
          initial: { opacity: 0, rotateX: 25, y: 20 },
          animate: { opacity: 1, rotateX: 0, y: 0 },
          exit: { opacity: 0, rotateX: -25, y: -20 },
          transition: { type: "spring", stiffness: 280, damping: 20 }
        };
    }
  };

  const currentTransitionProps = getTransitionProps();

  return (
    <main className="flex-grow flex flex-col bg-[#FAF8F4] text-[#0D0D0D]">
      {/* 1. IMMERSIVE TWO-COLUMN HERO */}
      <section className="border-b border-[#E5E5E5] px-6 lg:px-16 py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#FAF8F4] to-[#FAF8F4]/40 flex items-center justify-center">
        {/* Soft Ambient Light (Upper Center) */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* Left Column - Headline & AI Intake */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="font-mono text-[9px] text-[#888888] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0D0D0D]" /> FORMS, EVOLVED.
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl xl:text-[84px] leading-[0.95] tracking-tight mb-8 uppercase flex flex-col">
              <span>YOUR FORM.</span>
              <span className="flex items-center gap-4 flex-wrap">
                THEIR
                <AnimatePresence mode="wait">
                  <motion.span
                    key={rotatingWordIdx}
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -24, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="text-amber-600 font-serif italic tracking-normal lowercase first-letter:uppercase inline-block"
                  >
                    {rotatingWords[rotatingWordIdx].toLowerCase()}.
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            
            <p className="font-serif italic text-lg sm:text-xl text-[#888888] max-w-xl leading-relaxed mb-10">
              &quot;Build forms so beautiful, people ask what you used.&quot;
            </p>

            {/* Embedded AI Intake Input Form */}
            <form onSubmit={handleHeroSubmit} className="w-full max-w-lg mb-8">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">Describe your form to begin</span>
                <div className="flex items-center border-2 border-[#0D0D0D] bg-white rounded-xl overflow-hidden shadow-[4px_4px_0px_#0d0d0d] focus-within:shadow-[6px_6px_0px_#0d0d0d] focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 transition-all p-1.5 pl-4">
                  <input
                    type="text"
                    required
                    value={heroIntent}
                    onChange={(e) => setHeroIntent(e.target.value)}
                    placeholder="A beautiful registration form for my Nagpur startup hackathon..."
                    className="bg-transparent outline-none border-none text-sm font-sans w-full text-[#0d0d0d] placeholder:text-[#888888]/40 pr-2"
                  />
                  <button
                    type="submit"
                    className="bg-[#0D0D0D] text-[#FAF8F4] font-mono text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    Generate <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3.5 text-left font-mono text-[9px] text-[#888888] uppercase tracking-widest pl-2">
                Already have an account?{" "}
                <Link href="/register?mode=login" className="text-[#0D0D0D] font-bold hover:underline">
                  Log In →
                </Link>
              </div>
            </form>

            {/* Micro Metadata */}
            <div className="flex flex-wrap gap-6 text-[9px] font-mono text-[#888888] uppercase tracking-[0.2em]">
              <span>No Credit Card</span>
              <span>·</span>
              <span>Free Forever</span>
              <span>·</span>
              <span>No Branding Tax</span>
            </div>
          </div>

          {/* Right Column - Floating Live Mockup and Theme Swapper */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[440px]">
            {/* Morph Style Swapper Tabs */}
            <div className="flex bg-[#F5F3F0] p-1 rounded-full border border-[#E5E5E5] mb-6 relative z-20 shrink-0 w-full max-w-lg md:max-w-xl justify-between shadow-sm">
              {(["Minimal", "Editorial", "Brutalist", "Cinematic", "Glass"] as Aesthetic[]).map((aes) => (
                <button
                  key={aes}
                  onClick={() => setHeroAesthetic(aes)}
                  className={clsx(
                    "px-3 py-1.5 text-[9px] uppercase font-mono tracking-widest rounded-full transition-all shrink-0 cursor-pointer",
                    heroAesthetic === aes 
                      ? "bg-[#0D0D0D] text-[#FAF8F4] font-bold shadow-sm" 
                      : "text-[#888888] hover:text-[#0D0D0D]"
                  )}
                >
                  {aes.substring(0, 4)}
                </button>
              ))}
            </div>

            {/* Immersive Preview Container */}
            <div className="w-full max-w-lg md:max-w-xl relative flex items-center justify-center z-10 min-h-[380px]">
              <div className={clsx(
                "w-full relative transition-colors duration-700 rounded-3xl border border-[#E5E5E5]/20 shadow-2xl flex flex-col justify-between p-8 md:p-10 overflow-hidden",
                heroAesthetic === "Cinematic" ? "bg-[#0D0D0D]" : 
                heroAesthetic === "Brutalist" ? "bg-black" :
                heroAesthetic === "Editorial" ? "bg-[#FAF8F4]" :
                heroAesthetic === "Glass" ? "bg-white/40 backdrop-blur-xl border-white/40 shadow-xl" :
                "bg-white"
              )}>
                {/* Grain Overlays */}
                {(heroAesthetic === "Cinematic" || heroAesthetic === "Brutalist") && (
                  <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" 
                    style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
                )}

                {/* Glass Blur overlays */}
                {heroAesthetic === "Glass" && (
                  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[80px]" />
                  </div>
                )}

                {/* Editorial lines */}
                {heroAesthetic === "Editorial" && (
                  <div className="absolute inset-4 border border-[#0D0D0D]/5 pointer-events-none z-0" />
                )}

                {/* Content Inside Morph Frame */}
                {showDemoSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={clsx(
                      "w-full flex flex-col items-center justify-center text-center py-10 z-10",
                      heroAesthetic === "Minimal" && "font-sans text-[#0D0D0D]",
                      heroAesthetic === "Editorial" && "font-serif text-[#0D0D0D]",
                      heroAesthetic === "Brutalist" && "font-mono text-white",
                      heroAesthetic === "Cinematic" && "font-serif text-white",
                      heroAesthetic === "Glass" && "font-serif text-[#0D0D0D]"
                    )}
                  >
                    <h3 className={clsx(
                      "leading-tight mb-4 transition-all duration-500 font-serif",
                      heroAesthetic === "Minimal" && "font-sans font-bold text-2xl tracking-tight",
                      heroAesthetic === "Editorial" && "italic text-3xl",
                      heroAesthetic === "Brutalist" && "font-sans font-black uppercase tracking-tighter text-3xl",
                      heroAesthetic === "Cinematic" && "italic text-4xl tracking-wide",
                      heroAesthetic === "Glass" && "italic text-3xl"
                    )}>
                      {heroAesthetic === "Brutalist" ? "DATA REGISTERED!" : "Thank you."}
                    </h3>
                    <p className={clsx(
                      "text-xs opacity-60 leading-relaxed font-sans max-w-sm mb-8",
                      heroAesthetic === "Brutalist" && "font-mono uppercase tracking-widest text-white/70"
                    )}>
                      {heroAesthetic === "Cinematic" 
                        ? "Your submission has been captured. We appreciate your mind."
                        : heroAesthetic === "Brutalist"
                        ? "YOUR OPINION WAS LOGGED INTO THE BLOCK."
                        : "Experience how instant visual personality completely shifts the form's tone."}
                    </p>
                    <button 
                      onClick={() => setShowDemoSuccess(false)}
                      className={clsx(
                        "px-6 py-3.5 text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95",
                        heroAesthetic === "Minimal" && "bg-[#0D0D0D] text-white rounded-md",
                        heroAesthetic === "Editorial" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-full",
                        heroAesthetic === "Brutalist" && "bg-white text-black font-black border-2 border-black",
                        heroAesthetic === "Cinematic" && "bg-white text-black rounded-xl",
                        heroAesthetic === "Glass" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-xl"
                      )}
                    >
                      Try Another Type
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className={clsx(
                    "w-full flex flex-col h-full justify-between z-10 transition-all duration-700",
                    heroAesthetic === "Minimal" && "font-sans text-left text-[#0D0D0D]",
                    heroAesthetic === "Editorial" && "font-serif text-[#0D0D0D] text-left",
                    heroAesthetic === "Brutalist" && "font-mono text-white text-left",
                    heroAesthetic === "Cinematic" && "font-serif text-white text-left",
                    heroAesthetic === "Glass" && "font-serif text-[#0D0D0D] text-left"
                  )}>
                    <div>
                      <span className="font-mono text-[9px] opacity-40 block mb-6 uppercase tracking-widest">
                        {heroAesthetic.toUpperCase()}_SIGNATURE
                      </span>
                      
                      <h3 className={clsx(
                        "leading-tight mb-4 transition-all duration-500",
                        heroAesthetic === "Minimal" && "font-bold text-2xl tracking-tight",
                        heroAesthetic === "Editorial" && "italic text-3xl",
                        heroAesthetic === "Brutalist" && "font-black uppercase tracking-tighter text-3xl",
                        heroAesthetic === "Cinematic" && "italic text-4xl tracking-wide",
                        heroAesthetic === "Glass" && "italic text-3xl"
                      )}>
                        Form follows feeling.
                      </h3>
                      
                      <p className="text-xs opacity-60 leading-relaxed mb-8 font-sans">
                        Experience how corner radii, borders, typography weights, and grain overlays switch seamlessly.
                      </p>
                    </div>

                    {/* Mock Input Field */}
                    <div className={clsx(
                      "pb-1 mb-8 border-b transition-all",
                      heroAesthetic === "Minimal" && "border-[#E5E5E5]",
                      heroAesthetic === "Editorial" && "border-[#0D0D0D]",
                      heroAesthetic === "Brutalist" && "border-white border-b-[5px]",
                      heroAesthetic === "Cinematic" && "border-white/20 focus-within:border-white/50",
                      heroAesthetic === "Glass" && "border-[#0D0D0D]/20"
                    )}>
                      <input 
                        type="text"
                        required
                        value={mockOpinion}
                        onChange={(e) => setMockOpinion(e.target.value)}
                        placeholder="Your opinion here..."
                        className={clsx(
                          "w-full bg-transparent border-none outline-none text-sm placeholder:opacity-30 pb-2 transition-all",
                          heroAesthetic === "Minimal" && "text-left placeholder:text-[#0D0D0D]/50 text-[#0D0D0D]",
                          heroAesthetic === "Editorial" && "text-left placeholder:text-[#0D0D0D]/50 text-[#0D0D0D]",
                          heroAesthetic === "Brutalist" && "text-left placeholder:text-white/40 text-white font-bold uppercase italic",
                          heroAesthetic === "Cinematic" && "text-left placeholder:text-white/40 text-white tracking-widest",
                          heroAesthetic === "Glass" && "text-left placeholder:text-[#0D0D0D]/40 text-[#0D0D0D]"
                        )}
                      />
                    </div>

                    <button type="submit" className={clsx(
                      "w-full py-3.5 text-[9px] font-mono uppercase tracking-widest transition-all shadow-md active:scale-[0.99] cursor-pointer",
                      heroAesthetic === "Minimal" && "bg-[#0D0D0D] text-white rounded-md",
                      heroAesthetic === "Editorial" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-full",
                      heroAesthetic === "Brutalist" && "bg-white text-black font-black border-2 border-black",
                      heroAesthetic === "Cinematic" && "bg-white text-black rounded-xl",
                      heroAesthetic === "Glass" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-xl"
                    )}>
                      SUBMIT RESPONSE ↵
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CONTINUOUS SCROLL PROOF STRIP */}
      <section className="h-[56px] border-y border-white/5 overflow-hidden flex items-center bg-gradient-to-r from-[#0D0D0D] via-[#1F140C] to-[#0D0D0D] shrink-0 select-none group relative">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] text-[9px] font-mono uppercase tracking-[0.25em] text-[#FAF8F4]/80 items-center group-hover:[animation-play-state:paused] transition-all">
          <span className="mx-6">500+ Forms Built <span className="text-[#F59E0B] font-bold">This Week</span></span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>
          <span className="mx-6">Trusted By <span className="text-[#F59E0B] font-bold">Designers & Creatives</span></span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>
          <span className="mx-6"><span className="text-[#F59E0B] font-bold">Zero</span> Typeform Tax or forced logos</span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>

          <span className="mx-6">500+ Forms Built <span className="text-[#F59E0B] font-bold">This Week</span></span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>
          <span className="mx-6">Trusted By <span className="text-[#F59E0B] font-bold">Designers & Creatives</span></span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>
          <span className="mx-6"><span className="text-[#F59E0B] font-bold">Zero</span> Typeform Tax or forced logos</span>
          <svg className="w-3.5 h-3.5 text-[#F59E0B] inline-block mx-4 shrink-0 opacity-80 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.2 8.8L22 12.12L15.2 15.2L12 22L8.8 15.2L2 12L8.8 8.8Z"/>
          </svg>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* 3. AESTHETIC SANDBOX SECTION */}
      <section id="features" className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#E5E5E5]">
        {/* CONTROLS */}
        <div className="p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col justify-center bg-white">
          <span className="font-mono text-[10px] text-[#888888] tracking-widest uppercase mb-4">01 / BRAND VISUALS</span>
          <h2 className="font-display text-5xl lg:text-7xl leading-none mb-6">THE ART DIRECTIONS</h2>
          <p className="font-serif italic text-lg text-[#888888] mb-10 max-w-md">
            Superform offers five custom visual signatures. Click through the styles to see standard text, inputs, buttons, and layouts morph on the fly.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            {(["Minimal", "Editorial", "Brutalist", "Cinematic", "Glass"] as Aesthetic[]).map((aes) => (
              <button
                key={aes}
                onClick={() => setActiveAesthetic(aes)}
                className={clsx(
                  "w-full text-left p-4 rounded-xl border font-mono text-xs uppercase tracking-widest flex items-center justify-between transition-all group",
                  activeAesthetic === aes 
                    ? "bg-[#0D0D0D] border-[#0D0D0D] text-[#FAF8F4] shadow-lg translate-x-2"
                    : "bg-[#FAF8F4] border-[#E5E5E5] text-[#0D0D0D] hover:border-[#0D0D0D]/30 hover:translate-x-1"
                )}
              >
                <span>{aes}</span>
                <span className="opacity-50">
                  {aes === "Minimal" && "Quiet & Airy"}
                  {aes === "Editorial" && "Dramatic Serif"}
                  {aes === "Brutalist" && "Raw Monospace"}
                  {aes === "Cinematic" && "Wide Luxury"}
                  {aes === "Glass" && "Blur & Sheen"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* INTERACTIVE MOCK CONTAINER */}
        <div className={clsx(
          "p-8 lg:p-16 flex items-center justify-center relative overflow-hidden min-h-[500px] transition-colors duration-700",
          activeAesthetic === "Cinematic" ? "bg-[#0D0D0D]" : 
          activeAesthetic === "Brutalist" ? "bg-black" :
          activeAesthetic === "Editorial" ? "bg-[#FAF8F4]" :
          "bg-[#F5F3F0]"
        )}>
          {/* Film Grain for Cinematic/Brutalist */}
          {(activeAesthetic === "Cinematic" || activeAesthetic === "Brutalist") && (
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" 
              style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
          )}

          {/* Glass Gradients */}
          {activeAesthetic === "Glass" && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>
          )}

          {/* Editorial Lines */}
          {activeAesthetic === "Editorial" && (
            <div className="absolute inset-0 border border-[#0D0D0D]/5 m-4 pointer-events-none z-0" />
          )}

          <div className={clsx(
            "w-full max-w-md z-10 transition-all duration-700",
            activeAesthetic === "Minimal" && "font-sans text-center",
            activeAesthetic === "Editorial" && "font-serif text-[#0D0D0D]",
            activeAesthetic === "Brutalist" && "font-mono text-white",
            activeAesthetic === "Cinematic" && "font-serif text-white",
            activeAesthetic === "Glass" && "font-serif text-[#0D0D0D]"
          )}>
            <div className={clsx(
              "p-8 lg:p-12 relative transition-all duration-700 border",
              activeAesthetic === "Minimal" && "bg-white border-[#E5E5E5] rounded-lg shadow-sm",
              activeAesthetic === "Editorial" && "bg-[#FAF8F4] border-[#0D0D0D]/10 rounded-2xl shadow-xl",
              activeAesthetic === "Brutalist" && "bg-black border-white border-[4px] rounded-none",
              activeAesthetic === "Cinematic" && "bg-[#0D0D0D] border-white/10 rounded-3xl shadow-2xl",
              activeAesthetic === "Glass" && "bg-white/40 backdrop-blur-xl border-white/40 rounded-2xl shadow-2xl"
            )}>
              <span className="font-mono text-[10px] opacity-40 block mb-6">01 → INTENT</span>
              
              <h3 className={clsx(
                "leading-tight mb-8 transition-all duration-500",
                activeAesthetic === "Minimal" && "font-bold text-2xl tracking-tight text-[#0D0D0D]",
                activeAesthetic === "Editorial" && "italic text-3xl text-[#0D0D0D]",
                activeAesthetic === "Brutalist" && "font-black uppercase tracking-tighter text-3xl",
                activeAesthetic === "Cinematic" && "italic text-4xl tracking-wide",
                activeAesthetic === "Glass" && "italic text-3xl text-[#0D0D0D]"
              )}>
                Configure your vision.
              </h3>

              <div className={clsx(
                "pb-2 mb-8 border-b transition-colors",
                activeAesthetic === "Minimal" && "border-[#E5E5E5]",
                activeAesthetic === "Editorial" && "border-[#0D0D0D]",
                activeAesthetic === "Brutalist" && "border-white border-b-[6px]",
                activeAesthetic === "Cinematic" && "border-white/20 focus-within:border-white/50",
                activeAesthetic === "Glass" && "border-[#0D0D0D]"
              )}>
                <input 
                  type="text" 
                  disabled
                  value="Interactive aesthetic preview..." 
                  className="w-full bg-transparent outline-none text-sm opacity-60 font-sans cursor-not-allowed"
                />
              </div>

              <button className={clsx(
                "w-full py-4 text-[10px] font-mono uppercase tracking-widest transition-all",
                activeAesthetic === "Minimal" && "bg-[#0D0D0D] text-white rounded-md",
                activeAesthetic === "Editorial" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-full shadow-md",
                activeAesthetic === "Brutalist" && "bg-white text-black font-black",
                activeAesthetic === "Cinematic" && "bg-white text-black rounded-xl",
                activeAesthetic === "Glass" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-xl"
              )}>
                CONTINUE →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOTION ANIMATIONS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#E5E5E5]">
        {/* INTERACTIVE MOTION SIMULATOR */}
        <div className="p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex items-center justify-center min-h-[400px] bg-white relative">
          <button 
            onClick={triggerTransitionDemo}
            className="absolute top-6 right-6 p-2 bg-[#F5F3F0] rounded-full hover:bg-[#E5E5E5] transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider shadow-sm border border-[#E5E5E5]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> RUN TRANSITION
          </button>

          <div className="w-full max-w-md bg-[#FAF8F4] border border-[#E5E5E5] rounded-2xl shadow-xl overflow-hidden aspect-[16/10] flex flex-col justify-center p-8 relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`trans-${activeTransition}-${transitionTick}`}
                {...currentTransitionProps}
                className="w-full"
              >
                <span className="font-mono text-[10px] text-[#888888] block mb-4">TRANSITION_STYLE_{activeTransition.toUpperCase()}</span>
                <h4 className="font-serif italic text-2xl text-[#0D0D0D] mb-4">
                  How does it feel to transition?
                </h4>
                <p className="font-sans text-xs text-[#888888] leading-relaxed mb-6">
                  Every slide, fade, and zoom uses high-fidelity custom physics coordinates to mimic physical weight and spatial depth perfectly.
                </p>
                <div className="h-[2px] w-full bg-[#E5E5E5]"><div className="h-full w-2/3 bg-[#0D0D0D] transition-all" /></div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <span className="font-mono text-[10px] text-[#888888] tracking-widest uppercase mb-4">02 / SPRING KINETICS</span>
          <h2 className="font-display text-5xl lg:text-7xl leading-none mb-6">CINEMATIC SWEEPS</h2>
          <p className="font-serif italic text-lg text-[#888888] mb-10 max-w-md">
            Superform structures custom spring ratios. Click a kinetic equation style below to trigger and evaluate spatial transitions in the preview.
          </p>

          <div className="flex bg-[#F5F3F0] p-1.5 rounded-xl border border-[#E5E5E5] max-w-md">
            {(["Slide", "Fade", "Zoom", "Flip"] as Transition[]).map((trans) => (
              <button
                key={trans}
                onClick={() => { setActiveTransition(trans); triggerTransitionDemo(); }}
                className={clsx(
                  "flex-1 py-3 text-[10px] uppercase font-mono tracking-widest rounded-lg transition-all",
                  activeTransition === trans ? "bg-white shadow-sm text-[#0D0D0D] font-bold border border-[#E5E5E5]" : "text-[#888888] hover:text-[#0D0D0D]"
                )}
              >
                {trans}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 3-COLUMN CORE CAPABILITIES */}
      <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E5E5] border-b border-[#E5E5E5] bg-white">
        <div className="p-8 lg:p-16 flex flex-col gap-6 group hover:bg-[#FAF8F4]/40 transition-all duration-500 cursor-pointer">
          <div className="w-12 h-12 bg-[#FAF8F4] rounded-xl border border-[#E5E5E5] flex items-center justify-center shadow-sm group-hover:bg-[#F59E0B]/10 group-hover:border-[#F59E0B]/30 group-hover:scale-105 transition-all duration-300">
            <Layout className="w-6 h-6 text-[#0D0D0D] group-hover:text-[#F59E0B] transition-colors duration-300" />
          </div>
          <h3 className="font-serif italic text-2xl text-[#0D0D0D] group-hover:translate-x-1 transition-transform duration-300">Visual Logic Studio</h3>
          <p className="font-sans text-sm text-[#888888] leading-relaxed">
            Create branched path questionnaires visually. Specify conditional skips and custom redirection endpoints governed by respondent answers effortlessly.
          </p>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#888888] group-hover:text-[#0D0D0D] transition-colors flex items-center gap-1.5">
            Learn More <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="p-8 lg:p-16 flex flex-col gap-6 group hover:bg-[#FAF8F4]/40 transition-all duration-500 cursor-pointer">
          <div className="w-12 h-12 bg-[#FAF8F4] rounded-xl border border-[#E5E5E5] flex items-center justify-center shadow-sm group-hover:bg-[#F59E0B]/10 group-hover:border-[#F59E0B]/30 group-hover:scale-105 transition-all duration-300">
            <LineChart className="w-6 h-6 text-[#0D0D0D] group-hover:text-[#F59E0B] transition-colors duration-300" />
          </div>
          <h3 className="font-serif italic text-2xl text-[#0D0D0D] group-hover:translate-x-1 transition-transform duration-300">Analytical Response Room</h3>
          <p className="font-sans text-sm text-[#888888] leading-relaxed">
            Monitor response streams in real time. Track exact drop-off points, partial answers, and completion rates to optimize your copy.
          </p>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#888888] group-hover:text-[#0D0D0D] transition-colors flex items-center gap-1.5">
            Learn More <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="p-8 lg:p-16 flex flex-col gap-6 group hover:bg-[#FAF8F4]/40 transition-all duration-500 cursor-pointer">
          <div className="w-12 h-12 bg-[#FAF8F4] rounded-xl border border-[#E5E5E5] flex items-center justify-center shadow-sm group-hover:bg-[#F59E0B]/10 group-hover:border-[#F59E0B]/30 group-hover:scale-105 transition-all duration-300">
            <Layers className="w-6 h-6 text-[#0D0D0D] group-hover:text-[#F59E0B] transition-colors duration-300" />
          </div>
          <h3 className="font-serif italic text-2xl text-[#0D0D0D] group-hover:translate-x-1 transition-transform duration-300">Advanced Canvas Options</h3>
          <p className="font-sans text-sm text-[#888888] leading-relaxed">
            Configure film grain overlays, responsive layout alignments, custom typographic scales (SM to XL), and corner radii presets seamlessly.
          </p>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#888888] group-hover:text-[#0D0D0D] transition-colors flex items-center gap-1.5">
            Learn More <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* 6. SHOWCASE TEASER */}
      <section className="bg-[#0D0D0D] text-[#FAF8F4] py-24 flex flex-col gap-16 overflow-hidden relative">
        {/* Soft Warm Backdrop Light */}
        <div className="absolute top-0 right-[-10%] w-[60%] h-[100%] bg-amber-500/[0.02] rounded-full blur-[130px] pointer-events-none" />

        <h2 className="font-display text-5xl lg:text-7xl text-[#E8DCC8] text-center px-4">
          FORMS THAT MAKE AN IMPRESSION
        </h2>
        
        <div className="flex gap-8 px-6 lg:px-16 overflow-x-auto pb-8 snap-x no-scrollbar max-w-7xl mx-auto w-full">
          {/* Showcase exhibition highlights */}
          {[
            { name: "Lucid Tech Waitlist", style: "Cinematic Mode" },
            { name: "Editorial Studio Circular", style: "Editorial Serif" },
            { name: "Brutalist Developer Grid", style: "Raw Monospace" },
            { name: "Liquid Sheen Application", style: "Glass Sheen" }
          ].map((item, idx) => (
            <div key={idx} className="min-w-[300px] lg:min-w-[380px] h-[460px] bg-[#141414] rounded-2xl flex-shrink-0 snap-center border border-white/5 flex flex-col justify-between p-8 hover:border-white/10 transition-all">
              <div className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">EXHIBITION_PIECE_{idx+1}</div>
              <div className="text-center font-serif italic text-2xl text-[#E8DCC8]">
                {item.name}
              </div>
              <div className="mt-auto">
                <span className="font-mono text-[10px] text-white/40 block mb-4 uppercase tracking-widest">{item.style}</span>
                <TransitionLink href="/showcase" className="w-full text-center border border-white/10 hover:border-white/20 hover:bg-white/5 py-4 text-[10px] font-mono uppercase tracking-widest text-[#FAF8F4] transition-all flex items-center justify-center gap-2 rounded-xl">
                  Try live form preview →
                </TransitionLink>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <TransitionLink href="/showcase" className="text-[#FAF8F4] border border-white/10 hover:border-white/20 px-8 py-5 text-xs font-mono tracking-widest uppercase hover:bg-[#FAF8F4] hover:text-[#0D0D0D] transition-all flex items-center gap-4 rounded-xl shadow-lg">
            Explore Full Exhibition <ArrowRight className="w-4 h-4" />
          </TransitionLink>
        </div>
      </section>

      {/* 7. PRICING TEASER */}
      <section className="py-24 px-6 lg:px-16 flex flex-col items-center border-t border-[#E5E5E5]">
        <h2 className="font-display text-5xl lg:text-7xl tracking-wide mb-16 text-center uppercase">HONEST PLANS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl items-stretch">
          <div className="p-8 border border-[#E5E5E5] bg-white flex flex-col justify-between h-[380px] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#888888] uppercase">FREE PLAN</div>
              <div className="font-display text-5xl mt-4">₹0<span className="text-xs font-mono text-[#888888] uppercase ml-1">/mo</span></div>
              <ul className="flex flex-col gap-3 font-mono text-[10px] uppercase text-[#888888] mt-8 tracking-wider">
                <li>· 100 Responses / mo</li>
                <li>· Minimal & Brutalist</li>
                <li>· Standard Analytics</li>
              </ul>
            </div>
            <button onClick={() => router.push("?start=true")} className="w-full py-4 bg-[#FAF8F4] hover:bg-[#FAF8F4]/80 border border-[#E5E5E5] rounded-xl font-mono text-[10px] uppercase tracking-widest text-[#0D0D0D] transition-colors">Start Free</button>
          </div>
          
          <div className="p-8 border border-[#0D0D0D] bg-[#0D0D0D] text-[#FAF8F4] flex flex-col justify-between h-[410px] rounded-2xl shadow-2xl relative scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF8F4] text-[#0D0D0D] font-mono text-[9px] px-3.5 py-1 tracking-widest rounded-full uppercase border border-[#E5E5E5] font-bold">
              POPULAR
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#E8DCC8] uppercase">CREATOR TRIAL</div>
              <div className="font-display text-5xl mt-4 text-[#E8DCC8]">₹499<span className="text-xs font-mono text-white/40 uppercase ml-1">/mo</span></div>
              <ul className="flex flex-col gap-3 font-mono text-[10px] uppercase text-white/50 mt-8 tracking-wider">
                <li>· 5,000 Responses / mo</li>
                <li>· All 5 Art Directions</li>
                <li>· Drop-off mapping Funnels</li>
                <li>· custom kinetic curves</li>
              </ul>
            </div>
            <button onClick={() => router.push("?start=true")} className="w-full py-4 bg-white hover:bg-white/95 text-black rounded-xl font-mono text-[10px] uppercase tracking-widest transition-colors font-bold shadow-lg">Start Creator trial</button>
          </div>

          <div className="p-8 border border-[#E5E5E5] bg-white flex flex-col justify-between h-[380px] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#888888] uppercase">STUDIO PASS</div>
              <div className="font-display text-5xl mt-4">₹1,499<span className="text-xs font-mono text-[#888888] uppercase ml-1">/mo</span></div>
              <ul className="flex flex-col gap-3 font-mono text-[10px] uppercase text-[#888888] mt-8 tracking-wider">
                <li>· Unlimited Responses</li>
                <li>· Custom Fonts & CSS</li>
                <li>· complete White-Labeling</li>
              </ul>
            </div>
            <button onClick={() => router.push("?start=true")} className="w-full py-4 bg-[#FAF8F4] hover:bg-[#FAF8F4]/80 border border-[#E5E5E5] rounded-xl font-mono text-[10px] uppercase tracking-widest text-[#0D0D0D] transition-colors">Start Studio</button>
          </div>
        </div>
        <TransitionLink href="/pricing" className="mt-14 text-xs font-mono uppercase tracking-widest text-[#0D0D0D] hover:underline flex items-center gap-1.5">
          View full comparison matrix <ArrowRight className="w-3.5 h-3.5" />
        </TransitionLink>
      </section>
    </main>
  );
}
