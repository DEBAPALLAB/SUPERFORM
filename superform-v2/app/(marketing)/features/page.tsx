"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Layout, LineChart, Layers, ShieldCheck, Zap, Heart } from "lucide-react";
import clsx from "clsx";

type Aesthetic = "Minimal" | "Editorial" | "Brutalist" | "Cinematic" | "Glass";
type Transition = "Slide" | "Fade" | "Zoom" | "Flip";

export default function FeaturesPage() {
  const [activeAesthetic, setActiveAesthetic] = useState<Aesthetic>("Editorial");
  const [activeTransition, setActiveTransition] = useState<Transition>("Slide");
  const [transitionTick, setTransitionTick] = useState(0);

  const triggerTransitionDemo = () => {
    setTransitionTick((prev) => prev + 1);
  };

  const getTransitionProps = () => {
    const dur = 0.65;
    switch (activeTransition) {
      case "Slide":
        return {
          initial: { opacity: 0, y: 48, x: 0 },
          animate: { opacity: 1, y: 0, x: 0 },
          exit: { opacity: 0, y: -28, x: -12, scale: 0.97 },
          transition: {
            y: { type: "spring", stiffness: 320, damping: 28, mass: 0.8 },
            opacity: { duration: dur * 0.5, ease: "easeOut" }
          }
        };
      case "Fade":
        return {
          initial: { opacity: 0, scale: 0.97, filter: "blur(8px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 1.03, filter: "blur(6px)" },
          transition: { duration: dur * 0.7, ease: "easeInOut" }
        };
      case "Zoom":
        return {
          initial: { opacity: 0, scale: 0.78, filter: "blur(10px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 1.15, filter: "blur(6px)" },
          transition: { scale: { type: "spring", stiffness: 380, damping: 24 } }
        };
      case "Flip":
        return {
          initial: { opacity: 0, rotateX: 22, y: 30, scale: 0.95 },
          animate: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
          exit: { opacity: 0, rotateX: -18, y: -20, scale: 0.96 },
          transition: { rotateX: { type: "spring", stiffness: 260, damping: 22 } }
        };
    }
  };

  const currentTransitionProps = getTransitionProps();

  return (
    <main className="flex-grow flex flex-col bg-[#FAF8F4] text-[#0D0D0D] font-sans">
      {/* 1. HERO HEADER */}
      <section className="border-b border-[#E5E5E5] px-6 lg:px-16 py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#FAF8F4] to-[#FAF8F4]/20 flex flex-col items-center text-center">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-[#0d0d0d]/[0.01] rounded-full blur-[140px]" />
          <div className="absolute bottom-[-35%] right-[-20%] w-[60%] h-[60%] bg-amber-500/[0.01] rounded-full blur-[140px]" />
        </div>

        <div className="max-w-4xl relative z-10 flex flex-col items-center">
          <span className="font-mono text-[9px] text-[#888888] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0D0D0D]" /> Premium Features Overview
          </span>
          <h1 className="font-display text-5xl lg:text-[80px] leading-[0.95] tracking-tight mb-8 uppercase max-w-3xl">
            Where Form Meets Physics
          </h1>
          <p className="font-serif italic text-xl lg:text-2xl text-[#888888] max-w-2xl leading-relaxed">
            Every transition, border-radius, and font layout in Superform V2 is custom-engineered for maximum cognitive conversion.
          </p>
        </div>
      </section>

      {/* 2. THE ART DIRECTIONS SANDBOX */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#E5E5E5] bg-white">
        {/* Sandbox Explainer */}
        <div className="p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col justify-center bg-white z-10">
          <span className="font-mono text-[9px] text-[#888888] tracking-widest uppercase mb-4">01 / BRAND VISUALS</span>
          <h2 className="font-display text-4xl lg:text-6xl leading-none mb-6">THE ART DIRECTIONS</h2>
          <p className="font-serif italic text-lg text-[#888888] mb-8 max-w-md">
            Superform offers five distinct aesthetic signatures. Choose a signature to preview how input layouts, border sweeps, and grain parameters adapt instantly.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            {(["Minimal", "Editorial", "Brutalist", "Cinematic", "Glass"] as Aesthetic[]).map((aes) => (
              <button
                key={aes}
                onClick={() => setActiveAesthetic(aes)}
                className={clsx(
                  "w-full text-left p-4 rounded-xl border font-mono text-[10px] uppercase tracking-widest flex items-center justify-between transition-all group cursor-pointer",
                  activeAesthetic === aes 
                    ? "bg-[#0D0D0D] border-[#0D0D0D] text-[#FAF8F4] shadow-lg translate-x-2"
                    : "bg-[#FAF8F4] border-[#E5E5E5] text-[#0D0D0D] hover:border-[#0D0D0D]/30 hover:translate-x-1"
                )}
              >
                <span>{aes}</span>
                <span className="opacity-50 text-[9px]">
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

        {/* Live Morphing Mock Frame */}
        <div className={clsx(
          "p-8 lg:p-16 flex items-center justify-center relative overflow-hidden min-h-[500px] transition-colors duration-700",
          activeAesthetic === "Cinematic" ? "bg-[#0D0D0D]" : 
          activeAesthetic === "Brutalist" ? "bg-black" :
          activeAesthetic === "Editorial" ? "bg-[#FAF8F4]" :
          "bg-[#FAF8F4]/50"
        )}>
          {/* Grain Overlays */}
          {(activeAesthetic === "Cinematic" || activeAesthetic === "Brutalist") && (
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" 
              style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
          )}

          {/* Glass Blur overlays */}
          {activeAesthetic === "Glass" && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[80px]" />
            </div>
          )}

          {/* Editorial lines */}
          {activeAesthetic === "Editorial" && (
            <div className="absolute inset-6 border border-[#0D0D0D]/5 pointer-events-none z-0" />
          )}

          {/* Content Inside Morph Frame */}
          <div className={clsx(
            "w-full max-w-md z-10 transition-all duration-700",
            activeAesthetic === "Minimal" && "font-sans text-center text-[#0D0D0D]",
            activeAesthetic === "Editorial" && "font-serif text-[#0D0D0D] text-left",
            activeAesthetic === "Brutalist" && "font-mono text-white text-left",
            activeAesthetic === "Cinematic" && "font-serif text-white text-left",
            activeAesthetic === "Glass" && "font-serif text-[#0D0D0D] text-left"
          )}>
            <div className={clsx(
              "p-8 lg:p-12 border relative transition-all duration-700",
              activeAesthetic === "Minimal" && "bg-white border-[#E5E5E5] rounded-lg shadow-sm",
              activeAesthetic === "Editorial" && "bg-[#FAF8F4] border-[#0D0D0D]/10 rounded-2xl shadow-xl",
              activeAesthetic === "Brutalist" && "bg-black border-white border-[4px] rounded-none",
              activeAesthetic === "Cinematic" && "bg-[#0D0D0D] border-white/10 rounded-3xl shadow-2xl",
              activeAesthetic === "Glass" && "bg-white/40 backdrop-blur-xl border-white/40 rounded-2xl shadow-2xl"
            )}>
              <span className="font-mono text-[9px] opacity-40 block mb-6 uppercase tracking-widest">
                {activeAesthetic.toUpperCase()}_SIGNATURE
              </span>
              
              <h3 className={clsx(
                "leading-tight mb-4 transition-all duration-500",
                activeAesthetic === "Minimal" && "font-bold text-2xl tracking-tight",
                activeAesthetic === "Editorial" && "italic text-3xl",
                activeAesthetic === "Brutalist" && "font-black uppercase tracking-tighter text-3xl",
                activeAesthetic === "Cinematic" && "italic text-4xl tracking-wide",
                activeAesthetic === "Glass" && "italic text-3xl"
              )}>
                Configure your vision.
              </h3>
              
              <p className="text-xs opacity-60 leading-relaxed mb-6 font-sans">
                Experience how corner radii, borders, typography weights, and grain overlays switch seamlessly.
              </p>

              {/* Mock Input Field */}
              <div className={clsx(
                "pb-2 mb-6 border-b transition-all",
                activeAesthetic === "Minimal" && "border-[#E5E5E5]",
                activeAesthetic === "Editorial" && "border-[#0D0D0D]",
                activeAesthetic === "Brutalist" && "border-white border-b-[5px]",
                activeAesthetic === "Cinematic" && "border-white/20",
                activeAesthetic === "Glass" && "border-[#0D0D0D]/20"
              )}>
                <div className="text-xs opacity-40 font-sans">Your opinion here...</div>
              </div>

              <button className={clsx(
                "w-full py-3.5 text-[9px] font-mono uppercase tracking-widest transition-all shadow-md",
                activeAesthetic === "Minimal" && "bg-[#0D0D0D] text-white rounded-md",
                activeAesthetic === "Editorial" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-full",
                activeAesthetic === "Brutalist" && "bg-white text-black font-black border-2 border-black",
                activeAesthetic === "Cinematic" && "bg-white text-black rounded-xl",
                activeAesthetic === "Glass" && "bg-[#0D0D0D] text-[#FAF8F4] rounded-xl"
              )}>
                SUBMIT RESPONSE ↵
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPRING KINETICS TRANSITION FOLD */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#E5E5E5]">
        {/* Interactive Play Box */}
        <div className="p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex items-center justify-center min-h-[420px] bg-white relative">
          <button 
            onClick={triggerTransitionDemo}
            className="absolute top-6 right-6 p-2 bg-[#F5F3F0] rounded-full hover:bg-[#E5E5E5] transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider shadow-sm border border-[#E5E5E5] cursor-pointer"
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
                <span className="font-mono text-[9px] text-[#888888] block mb-4">PHYSICS_CURVE_{activeTransition.toUpperCase()}</span>
                <h4 className="font-serif italic text-2xl text-[#0D0D0D] mb-4">
                  How does it feel to sweep?
                </h4>
                <p className="font-sans text-xs text-[#888888] leading-relaxed mb-6">
                  Every slide, fade, and zoom uses customizable spring math coordinates to mimic weight and depth.
                </p>
                <div className="h-[2px] w-full bg-[#E5E5E5]"><div className="h-full w-2/3 bg-[#0D0D0D] transition-all duration-500" /></div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Physics Explainer */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white">
          <span className="font-mono text-[9px] text-[#888888] tracking-widest uppercase mb-4">02 / SPRING KINETICS</span>
          <h2 className="font-display text-4xl lg:text-6xl leading-none mb-6">CINEMATIC SWEEPS</h2>
          <p className="font-serif italic text-lg text-[#888888] mb-8 max-w-md">
            Superform structures custom spring physics ratios. Click a kinetic equation style below to trigger and evaluate spatial transitions in the preview.
          </p>

          <div className="flex bg-[#F5F3F0] p-1.5 rounded-xl border border-[#E5E5E5] max-w-md shadow-sm">
            {(["Slide", "Fade", "Zoom", "Flip"] as Transition[]).map((trans) => (
              <button
                key={trans}
                onClick={() => { setActiveTransition(trans); triggerTransitionDemo(); }}
                className={clsx(
                  "flex-1 py-3 text-[9px] uppercase font-mono tracking-widest rounded-lg transition-all cursor-pointer",
                  activeTransition === trans ? "bg-white shadow-sm text-[#0D0D0D] font-bold border border-[#E5E5E5]" : "text-[#888888] hover:text-[#0D0D0D]"
                )}
              >
                {trans}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID & COMPARISONS */}
      <section className="py-24 px-6 lg:px-16 border-b border-[#E5E5E5] bg-white flex flex-col items-center">
        <span className="font-mono text-[9px] text-[#888888] tracking-[0.2em] uppercase mb-6">FULL FEATURE MATRIX</span>
        <h2 className="font-display text-4xl lg:text-6xl tracking-wide mb-16 text-center uppercase">CORE CAPABILITIES</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {[
            { icon: Layout, title: "Visual Logic Studio", desc: "Create branched path questionnaires visually. Specify conditional skips and custom redirection endpoints governed by responses." },
            { icon: LineChart, title: "Response Analytics Room", desc: "Monitor response streams in real time. Track exact drop-off points, partial answers, and completion rates to optimize copy." },
            { icon: Layers, title: "Advanced Canvas Options", desc: "Configure film grain overlays, responsive alignments, custom typographic scales (SM to XL), and corner radii." },
            { icon: ShieldCheck, title: "Row-Level Security (RLS)", desc: "Creator records remain isolated and secure. Respondents have write-only insert streams to ensure zero data leakage." },
            { icon: Zap, title: "Keystroke Hotkeys", desc: "Full keyboard overrides. Press 'Enter' to advance options, A-D letters for choices, and Y/N for binary questions." },
            { icon: Heart, title: "Complete White-Labeling", desc: "Remove all 'Built with Superform' branding to deploy sleek, customized, premium visual surveys on your own domains." }
          ].map((item, idx) => (
            <div key={idx} className="p-8 border border-[#E5E5E5] hover:border-ink/20 hover:shadow-md transition-all rounded-2xl flex flex-col gap-5 bg-[#FAF8F4]/30">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center shadow-sm shrink-0">
                <item.icon className="w-5 h-5 text-ink" />
              </div>
              <h3 className="font-serif italic text-xl text-[#0D0D0D]">{item.title}</h3>
              <p className="font-sans text-xs text-[#888888] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
