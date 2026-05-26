"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ArrowRight, X, Sparkles, Star, CheckSquare } from "lucide-react";

type Aesthetic = "Minimal" | "Editorial" | "Brutalist" | "Cinematic" | "Glass";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  aesthetic: Aesthetic;
  surface: "Flat" | "Card" | "Glass" | "Frame";
  typography: "SM" | "MD" | "LG" | "XL";
  radius: "None" | "SM" | "MD" | "Full";
  description: string;
  questions: { label: string; type: "short" | "rating" | "multiple"; options?: string[] }[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "ex-1",
    title: "LUCID TECH waitlist",
    subtitle: "Luxury AI Studio Access Form",
    aesthetic: "Cinematic",
    surface: "Card",
    typography: "LG",
    radius: "MD",
    description: "Pitch black backdrop, soft warm amber outlines, serif tracking, and slow spring zooms.",
    questions: [
      { label: "What is your venture's name?", type: "short" },
      { label: "Which stack are you building on?", type: "multiple", options: ["NextJS + Tailwind", "React Native", "Rust Core", "Other"] },
      { label: "Rate the cinematic aesthetic feel", type: "rating" }
    ]
  },
  {
    id: "ex-2",
    title: "Editorial Design Feedback",
    subtitle: "High-Fashion Publisher Survey",
    aesthetic: "Editorial",
    surface: "Glass",
    typography: "MD",
    radius: "SM",
    description: "Cormorant Garamond italic headings, thin ink boundaries, off-white grain, and fluid fade transitions.",
    questions: [
      { label: "Who is your primary inspiration?", type: "short" },
      { label: "Preferred typography format?", type: "multiple", options: ["Serif Roman", "Grotesque Gothic", "Monospace Tech"] },
      { label: "Rate this editorial design survey", type: "rating" }
    ]
  },
  {
    id: "ex-3",
    title: "Brutalist Developer Survey",
    subtitle: "Open Source Tooling Audit",
    aesthetic: "Brutalist",
    surface: "Frame",
    typography: "XL",
    radius: "None",
    description: "Heavy 0px borders, black and white extreme contrast, rigid layouts, and instant slides.",
    questions: [
      { label: "What is your main terminal shell?", type: "short" },
      { label: "Preferred text editor standard?", type: "multiple", options: ["Neovim / Vim", "VS Code", "Emacs", "Helix"] },
      { label: "Rate this brutalist survey scale", type: "rating" }
    ]
  },
  {
    id: "ex-4",
    title: "Minimalist Newsletter Sign-up",
    subtitle: "Design Weekly Circular Gate",
    aesthetic: "Minimal",
    surface: "Flat",
    typography: "SM",
    radius: "Full",
    description: "Pure white, generous airy centered layout, subtle gray borders, and fast smooth spring curves.",
    questions: [
      { label: "Where should we send design letters?", type: "short" },
      { label: "Select subscription frequency preference", type: "multiple", options: ["Weekly circular", "Monthly digest", "Announcements only"] },
      { label: "Rate this minimal registration step", type: "rating" }
    ]
  },
  {
    id: "ex-5",
    title: "Liquid Sheen Application",
    subtitle: "Venture Capital Intent Intake",
    aesthetic: "Glass",
    surface: "Glass",
    typography: "MD",
    radius: "MD",
    description: "High-blur glassmorphism, dynamic glowing ambient backdrops, warm shadows, and luxury fade spring.",
    questions: [
      { label: "Describe your breakthrough innovation", type: "short" },
      { label: "What is your current funding round?", type: "multiple", options: ["Bootstrap / Pre-Seed", "Seed / Venture Backed", "Series A+", "N/A"] },
      { label: "Rate this glassmorphic application UI", type: "rating" }
    ]
  }
];

export default function ShowcasePage() {
  const [activeItem, setActiveItem] = useState<ShowcaseItem | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpenExperience = (item: ShowcaseItem) => {
    setActiveItem(item);
    setCurrentQIndex(0);
    setAnswers({});
    setIsSubmitted(false);
  };

  const handleNext = () => {
    if (!activeItem) return;
    if (currentQIndex < activeItem.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const activeQ = activeItem?.questions[currentQIndex];

  return (
    <main className="flex-grow flex flex-col bg-[#FAF8F4] text-[#0D0D0D]">
      {/* HEADER HERO */}
      <section className="border-b border-[#E5E5E5] px-6 py-20 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-12 bottom-0 w-px bg-[#0D0D0D]/5 hidden md:block" />
        <div className="absolute top-0 right-12 bottom-0 w-px bg-[#0D0D0D]/5 hidden md:block" />

        <div className="max-w-3xl relative z-10">
          <div className="font-mono text-xs text-[#888888] tracking-[0.25em] uppercase mb-6 flex justify-center items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#0D0D0D]" /> THE DESIGN EXHIBITION
          </div>
          <h1 className="font-display text-6xl lg:text-9xl leading-[0.9] tracking-tight mb-8">
            DESIGNED ON<br />SUPERFORM.
          </h1>
          <p className="font-serif italic text-xl lg:text-2xl text-[#888888] max-w-xl mx-auto leading-relaxed">
            Witness how high-growth startups, premium designers, and modern builders customize Superform to match their signature styles perfectly.
          </p>
        </div>
      </section>

      {/* GALLERY GRID */}
      <section className="p-6 lg:p-16 border-b border-[#E5E5E5]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SHOWCASE_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow group h-[520px] justify-between p-6"
            >
              <div className="flex flex-col gap-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">AESTHETIC_{item.aesthetic.toUpperCase()}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-3xl tracking-wide text-[#0D0D0D] leading-none uppercase">{item.title}</h3>
                  <span className="font-serif italic text-sm text-[#888888]">{item.subtitle}</span>
                </div>
                <div className="h-[140px] bg-[#F5F3F0] rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
                  {/* Subtle Background Art according to theme */}
                  {item.aesthetic === "Cinematic" && <div className="absolute inset-0 bg-[#0D0D0D] border border-white/10 flex items-center justify-center font-serif text-[10px] tracking-widest text-white/40">CINEMATIC PREVIEW</div>}
                  {item.aesthetic === "Editorial" && <div className="absolute inset-0 bg-[#FAF8F4] border border-[#0D0D0D]/10 flex items-center justify-center font-serif italic text-sm text-[#0D0D0D]/50">Editorial Layout</div>}
                  {item.aesthetic === "Brutalist" && <div className="absolute inset-0 bg-black border-2 border-white flex items-center justify-center font-mono text-[11px] text-white">BRUTALIST_CARD</div>}
                  {item.aesthetic === "Minimal" && <div className="absolute inset-0 bg-white border border-[#E5E5E5] flex items-center justify-center font-sans text-xs tracking-widest text-muted">MINIMAL</div>}
                  {item.aesthetic === "Glass" && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      <div className="bg-white/40 backdrop-blur-md border border-white/50 w-24 h-12 rounded flex items-center justify-center text-[10px] font-mono text-ink/40">Glass Box</div>
                    </div>
                  )}
                </div>
                <p className="font-sans text-xs text-[#888888] leading-relaxed mt-2">{item.description}</p>
              </div>

              <button 
                onClick={() => handleOpenExperience(item)}
                className="w-full text-center bg-[#0D0D0D] text-[#FAF8F4] hover:bg-[#0D0D0D]/90 py-3.5 text-[10px] font-mono uppercase tracking-widest transition-colors mt-6 rounded-xl flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                Try Live Experience <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE EXPERIENCE OVERLAY */}
      <AnimatePresence>
        {activeItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            {/* Morphing Preview Frame */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={clsx(
                "w-full max-w-2xl relative shadow-2xl transition-all duration-700 ease-in-out aspect-[16/10] overflow-hidden flex flex-col justify-between p-12 lg:p-16 border origin-center",
                activeItem.aesthetic === "Minimal" && "bg-white border-[#E5E5E5] text-[#0D0D0D] font-sans rounded-xl",
                activeItem.aesthetic === "Editorial" && "bg-[#FAF8F4] border-[#0D0D0D]/10 text-[#0D0D0D] font-serif rounded-2xl",
                activeItem.aesthetic === "Brutalist" && "bg-black border-white border-[4px] text-white font-mono rounded-none",
                activeItem.aesthetic === "Cinematic" && "bg-[#0D0D0D] border-white/10 text-white font-serif rounded-[32px]",
                activeItem.aesthetic === "Glass" && "bg-white/40 backdrop-blur-3xl border-white/40 text-[#0D0D0D] font-serif rounded-2xl"
              )}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveItem(null)}
                className={clsx(
                  "absolute top-6 right-6 transition-opacity z-[200]",
                  (activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "text-white" : "text-black"
                )}
              >
                <X className="w-6 h-6 hover:opacity-70" />
              </button>

              {/* Decorative elements according to theme */}
              {activeItem.aesthetic === "Glass" && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                  <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px]" />
                </div>
              )}
              {activeItem.aesthetic === "Cinematic" && (
                <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
              )}
              {activeItem.aesthetic === "Editorial" && (
                <div className="absolute inset-0 border border-[#0D0D0D]/5 m-4 pointer-events-none z-0" />
              )}

              {/* Form Fill Flow */}
              <div className="w-full relative z-10 flex-grow flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div 
                      key="thank-you" 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center py-10"
                    >
                      <h4 className={clsx(
                        "leading-tight mb-4",
                        activeItem.aesthetic === "Minimal" && "font-bold text-3xl text-[#0D0D0D] font-sans",
                        activeItem.aesthetic === "Editorial" && "italic text-4xl text-[#0D0D0D]",
                        activeItem.aesthetic === "Brutalist" && "font-black uppercase tracking-tighter text-4xl",
                        activeItem.aesthetic === "Cinematic" && "italic text-5xl tracking-wide",
                        activeItem.aesthetic === "Glass" && "italic text-4xl text-[#0D0D0D]"
                      )}>
                        Thank you.
                      </h4>
                      <p className="font-sans text-xs opacity-60">Mock submission processed inside showcase demo.</p>
                    </motion.div>
                  ) : activeQ ? (
                    <motion.div
                      key={currentQIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="w-full"
                    >
                      <span className="font-mono text-[10px] opacity-40 block mb-6">
                        {String(currentQIndex + 1).padStart(2, "0")} → QUESTION
                      </span>
                      
                      <h3 className={clsx(
                        "leading-tight mb-8 transition-all duration-500",
                        activeItem.aesthetic === "Minimal" && "font-bold text-2xl tracking-tight text-[#0D0D0D] font-sans",
                        activeItem.aesthetic === "Editorial" && "italic text-3xl text-[#0D0D0D]",
                        activeItem.aesthetic === "Brutalist" && "font-black uppercase tracking-tighter text-3xl",
                        activeItem.aesthetic === "Cinematic" && "italic text-4xl tracking-wide",
                        activeItem.aesthetic === "Glass" && "italic text-3xl text-[#0D0D0D]"
                      )}>
                        {activeQ.label}
                      </h3>

                      {activeQ.type === "short" && (
                        <div className={clsx(
                          "pb-2 mb-8 border-b transition-colors",
                          activeItem.aesthetic === "Minimal" && "border-[#E5E5E5]",
                          activeItem.aesthetic === "Editorial" && "border-[#0D0D0D]",
                          activeItem.aesthetic === "Brutalist" && "border-white border-b-[6px]",
                          activeItem.aesthetic === "Cinematic" && "border-white/20 focus-within:border-white/50",
                          activeItem.aesthetic === "Glass" && "border-[#0D0D0D]"
                        )}>
                          <input 
                            type="text" 
                            autoFocus
                            value={answers[currentQIndex] || ""}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQIndex]: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            placeholder="Type here..." 
                            className="w-full bg-transparent outline-none text-lg font-sans"
                          />
                        </div>
                      )}

                      {activeQ.type === "multiple" && (
                        <div className="flex flex-col gap-3 mb-8">
                          {activeQ.options?.map((opt, oIdx) => {
                            const isSel = answers[currentQIndex] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => setAnswers(prev => ({ ...prev, [currentQIndex]: opt }))}
                                className={clsx(
                                  "w-full text-left p-3.5 border transition-all font-sans text-xs uppercase tracking-widest flex items-center justify-between rounded-lg",
                                  isSel
                                    ? ((activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "bg-white text-black border-white translate-x-1" : "bg-black text-[#FAF8F4] border-black translate-x-1")
                                    : ((activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "border-white/20 hover:border-white/40 hover:translate-x-1" : "border-[#E5E5E5] hover:border-black/30 hover:translate-x-1")
                                )}
                              >
                                <span>{opt}</span>
                                <div className={clsx(
                                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                                  isSel ? "border-transparent bg-current" : "border-current"
                                )}>
                                  {isSel && <div className={clsx("w-1 h-1 rounded-full", (activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "bg-white" : "bg-black")} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {activeQ.type === "rating" && (
                        <div className="flex gap-3 mb-8 flex-wrap">
                          {Array.from({ length: 5 }, (_, i) => i + 1).map((val) => {
                            const isSel = answers[currentQIndex] === String(val);
                            return (
                              <button
                                key={val}
                                onClick={() => setAnswers(prev => ({ ...prev, [currentQIndex]: String(val) }))}
                                className={clsx(
                                  "w-10 h-10 border transition-all flex items-center justify-center font-mono text-xs rounded-full",
                                  isSel
                                    ? ((activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "bg-white text-black border-white scale-110 shadow-lg" : "bg-black text-[#FAF8F4] border-black scale-110 shadow-md")
                                    : ((activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "border-white/20 text-white hover:border-white/50" : "border-[#E5E5E5] text-[#0D0D0D] hover:border-black")
                                )}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleNext}
                          className={clsx(
                            "px-6 py-3 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5",
                            (activeItem.aesthetic === "Brutalist" || activeItem.aesthetic === "Cinematic") ? "bg-white text-black" : "bg-[#0D0D0D] text-[#FAF8F4]",
                            activeItem.aesthetic === "Minimal" && "rounded-md",
                            activeItem.aesthetic === "Editorial" && "rounded-full shadow-md",
                            activeItem.aesthetic === "Brutalist" && "rounded-none",
                            activeItem.aesthetic === "Cinematic" && "rounded-xl",
                            activeItem.aesthetic === "Glass" && "rounded-xl"
                          )}
                        >
                          {currentQIndex === activeItem.questions.length - 1 ? "Submit" : "Continue"} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">Press Enter ↵</span>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Mock Status Bar */}
              {!isSubmitted && (
                <div className="h-[2px] w-full bg-current/10 shrink-0 relative z-10 mt-6">
                  <div 
                    className="h-full bg-current transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / (activeItem?.questions.length || 1)) * 100}%` }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
