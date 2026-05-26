"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Play, Share, Type, AlignLeft, CheckSquare, ToggleLeft, Star, Mail, Phone, Plus, ArrowRight, Search, X, Trash2, ChevronUp, ChevronDown, Copy, Check, ExternalLink, Globe, Link2 } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "BUILD" | "DESIGN" | "PREVIEW";
type Aesthetic = "Minimal" | "Editorial" | "Glass" | "Brutalist" | "Cinematic";

interface Question {
  id: number;
  type: string;
  label: string;
  placeholder: string;
  description: string;
  required: boolean;
  maxChars: number;
  buttonText: string;
  options?: string[];
  maxRating?: number;
}

export default function Builder() {
  const [mode, setMode] = useState<Mode>("BUILD");
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [aesthetic, setAesthetic] = useState<Aesthetic>("Editorial");
  const [hoveredAesthetic, setHoveredAesthetic] = useState<Aesthetic | null>(null);
  const [surface, setSurface] = useState("Flat");
  const [typography, setTypography] = useState("MD");
  const [radius, setRadius] = useState("SM");
  const [alignment, setAlignment] = useState("Left");
  const [grain, setGrain] = useState(false);
  const [motionIntensity, setMotionIntensity] = useState("Standard");
  const [transitionStyle, setTransitionStyle] = useState("Slide");
  const [progressStyle, setProgressStyle] = useState("Bar");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: "short", label: "What is your name?", placeholder: "Jane Doe", description: "", required: true, maxChars: 100, buttonText: "Continue" },
    { id: 2, type: "email", label: "Email address?", placeholder: "jane@example.com", description: "", required: true, maxChars: 100, buttonText: "Continue" },
    { id: 3, type: "long", label: "What are you building?", placeholder: "Type your answer here...", description: "Tell us about your vision", required: false, maxChars: 500, buttonText: "Submit" },
  ]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { formId } = useParams();

  // New publishing and metadata states
  const [title, setTitle] = useState("Untitled Form");
  const [status, setStatus] = useState("draft");
  const [slug, setSlug] = useState("");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // HTML Webpage Embed Tab configs
  const [activeShareTab, setActiveShareTab] = useState<"LINK" | "EMBED">("LINK");
  const [embedHeight, setEmbedHeight] = useState(600);
  const [embedRadius, setEmbedRadius] = useState("16");
  const [embedTransparent, setEmbedTransparent] = useState(true);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [authorName, setAuthorName] = useState("");

  // Initial Load
  useEffect(() => {
    async function fetchFormAndUser() {
      if (!formId) return;
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.status) setStatus(data.status);
        if (data.slug) setSlug(data.slug);
        if (data.questions) setQuestions(data.questions);
        if (data.aesthetic) setAesthetic(data.aesthetic);
        if (data.surface) setSurface(data.surface);
        if (data.typography) setTypography(data.typography);
        if (data.radius) setRadius(data.radius);
        if (data.grain !== undefined) setGrain(data.grain);
        if (data.motion_intensity) setMotionIntensity(data.motion_intensity);
        if (data.transition_style) setTransitionStyle(data.transition_style);
        if (data.progress_style) setProgressStyle(data.progress_style);
      }

      // Fetch user to get author_name
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
          setAuthorName(name);
        }
      } catch (e) {
        console.error("Failed to load user in builder:", e);
      }

      setHasLoaded(true);
    }
    fetchFormAndUser();
  }, [formId]);

  const isInitialMount = useRef(true);

  // Auto-save
  useEffect(() => {
    if (!hasLoaded || !formId) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setIsSaving(true);
      
      // Inject author_name into first question's settings
      let updatedQuestions = [...questions] as any[];
      if (updatedQuestions.length > 0 && authorName) {
        const firstQ = updatedQuestions[0];
        const currentSettings = firstQ.settings || {};
        updatedQuestions[0] = {
          ...firstQ,
          settings: {
            ...currentSettings,
            author_name: authorName
          }
        };
      }

      const { error } = await supabase
        .from('forms')
        .update({
          title,
          questions: updatedQuestions,
          aesthetic,
          surface,
          typography,
          radius,
          grain,
          motion_intensity: motionIntensity,
          transition_style: transitionStyle,
          progress_style: progressStyle
        })
        .eq('id', formId);
      
      if (error) {
        console.error("Auto-save failed:", error);
      }
      
      // Delay to show 'Saved' state
      setTimeout(() => setIsSaving(false), 800);
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, questions, aesthetic, surface, typography, radius, grain, motionIntensity, transitionStyle, progressStyle, formId, hasLoaded, authorName]);

  const currentAesthetic = hoveredAesthetic || aesthetic;
  const currentQ = questions.find(q => q.id === activeQuestion) || questions[0];
  const isDarkTheme = (currentAesthetic === "Brutalist" || currentAesthetic === "Cinematic") && (surface === "Flat" || surface === "Frame");

  const handlePublish = async () => {
    if (!formId) return;
    setIsSaving(true);
    
    // Generate clean slug from title if empty
    let currentSlug = slug;
    if (!currentSlug) {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const randomHash = Math.random().toString(36).substring(2, 7);
      currentSlug = `${cleanTitle || "form"}-${randomHash}`;
      setSlug(currentSlug);
    }
    
    const { error } = await supabase
      .from('forms')
      .update({
        status: 'published',
        slug: currentSlug
      })
      .eq('id', formId);
      
    if (error) {
      console.error("Publish failed:", error);
      alert("Failed to publish form: " + error.message);
    } else {
      setStatus('published');
      setIsPublishModalOpen(true);
    }
    setIsSaving(false);
  };

  const handleUpdateSlug = async (newSlug: string) => {
    if (!formId || !newSlug) return;
    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "");
    if (!cleanSlug) return;
    
    setSlug(cleanSlug);
    setIsSaving(true);
    const { error } = await supabase
      .from('forms')
      .update({ slug: cleanSlug })
      .eq('id', formId);
      
    if (error) {
      console.error("Slug update failed:", error);
      alert("This custom URL slug is already taken or failed to update.");
    }
    setIsSaving(false);
  };

  // Motion — each style has a distinct personality
  const dur = motionIntensity === "None" ? 0 : motionIntensity === "High" ? 1 : 0.65;

  const getMotionProps = () => {
    if (motionIntensity === "None") return {
      initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 }
    };

    // SLIDE — cinematic upward reveal, exits left like turning a page
    if (transitionStyle === "Slide") return {
      initial: { opacity: 0, y: motionIntensity === "High" ? 80 : 48, x: 0 },
      animate: { opacity: 1, y: 0, x: 0 },
      exit: { opacity: 0, y: motionIntensity === "High" ? -48 : -28, x: -12, scale: 0.97 },
      transition: {
        y: { type: "spring", stiffness: 320, damping: 28, mass: 0.8 },
        opacity: { duration: dur * 0.5, ease: "easeOut" },
        x: { duration: dur * 0.4, ease: [0.4, 0, 1, 1] as const },
        scale: { duration: dur * 0.35 }
      }
    };

    // FADE — slow dissolve with subtle scale breath, luxurious
    if (transitionStyle === "Fade") return {
      initial: { opacity: 0, scale: 0.97, filter: "blur(8px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 1.03, filter: "blur(6px)" },
      transition: {
        duration: dur * 0.7,
        ease: [0.4, 0, 0.2, 1] as const,
        scale: { duration: dur * 0.8, ease: [0.4, 0, 0.2, 1] as const },
        filter: { duration: dur * 0.5 }
      }
    };

    // ZOOM — punchy snap-in from far, exits with urgency
    if (transitionStyle === "Zoom") return {
      initial: { opacity: 0, scale: motionIntensity === "High" ? 0.6 : 0.78, filter: "blur(12px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: motionIntensity === "High" ? 1.3 : 1.15, filter: "blur(8px)" },
      transition: {
        scale: { type: "spring", stiffness: motionIntensity === "High" ? 500 : 380, damping: 24, mass: 0.7 },
        opacity: { duration: dur * 0.4, ease: "easeOut" },
        filter: { duration: dur * 0.45 }
      }
    };

    // FLIP — physical card, enters from bottom-tilt, exits top-tilt
    if (transitionStyle === "Flip") return {
      initial: { opacity: 0, rotateX: motionIntensity === "High" ? 40 : 22, y: 30, scale: 0.95 },
      animate: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
      exit: { opacity: 0, rotateX: motionIntensity === "High" ? -32 : -18, y: -20, scale: 0.96 },
      transition: {
        rotateX: { type: "spring", stiffness: 260, damping: 22, mass: 1.1 },
        y: { type: "spring", stiffness: 300, damping: 26 },
        scale: { duration: dur * 0.4 },
        opacity: { duration: dur * 0.4, ease: "easeOut" }
      }
    };

    return {
      initial: { opacity: 0, y: 32 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 },
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
    };
  };

  const motionProps = getMotionProps();

  const updateQuestion = (id: number, updates: Partial<Question>) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const nextQuestion = () => {
    const currentIndex = questions.findIndex(q => q.id === activeQuestion);
    if (currentIndex < questions.length - 1) {
      setActiveQuestion(questions[currentIndex + 1].id);
    } else {
      setActiveQuestion(questions[0].id); // Loop for demo
    }
  };

  const prevQuestion = () => {
    const currentIndex = questions.findIndex(q => q.id === activeQuestion);
    if (currentIndex > 0) {
      setActiveQuestion(questions[currentIndex - 1].id);
    } else {
      setActiveQuestion(questions[questions.length - 1].id); // Loop back
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      nextQuestion();
    }
  };

  const addQuestion = (type: string, label: string) => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion = {
      id: newId,
      type,
      label,
      placeholder: "Type here...",
      description: "",
      required: false,
      maxChars: 100,
      buttonText: type === "rating" || type === "yesno" || type === "multiple" ? "Continue" : "Next"
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newId);
    setIsCommandPaletteOpen(false);
    setPaletteSearch("");
  };

  const moveQuestion = (id: number, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const deleteQuestion = (id: number) => {
    if (questions.length <= 1) return; 
    const newQuestions = questions.filter(q => q.id !== id);
    setQuestions(newQuestions);
    if (activeQuestion === id) {
      setActiveQuestion(newQuestions[0].id);
    }
  };

  const blockTypes = [
    { section: "Text", items: [
      { id: "short", label: "Short Text", icon: Type },
      { id: "long", label: "Long Text", icon: AlignLeft },
    ]},
    { section: "Choice", items: [
      { id: "multiple", label: "Multiple Choice", icon: CheckSquare },
      { id: "yesno", label: "Yes / No", icon: ToggleLeft },
      { id: "rating", label: "Rating", icon: Star },
    ]},
    { section: "Contact", items: [
      { id: "email", label: "Email", icon: Mail },
      { id: "phone", label: "Phone Number", icon: Phone },
    ]}
  ];

  return (
    <div className="h-screen flex flex-col bg-canvas text-ink overflow-hidden">
      {/* TOP NAV - 48px */}
      <header className="h-[54px] border-b border-border bg-[#FCFAF7] flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="group shrink-0">
            <svg className="w-7 h-7 rounded-[7px] group-hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="builderSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="30%" stopColor="#FAF8F4" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#builderSfGrad)" letterSpacing="-0.03em">SF</text>
            </svg>
          </Link>
          <div className="h-5 w-px bg-border/80" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-serif text-sm bg-white/50 border border-[#0D0D0D]/10 hover:border-[#0D0D0D]/20 focus:border-ink/40 focus:bg-white focus:shadow-md px-3 py-1.5 rounded-xl outline-none transition-all duration-300 max-w-[220px] font-medium"
            title="Rename form"
            placeholder="Untitled Form"
          />
        </div>

        <div className="flex bg-[#F5F3F0] p-1 rounded-full border border-border">
          {(["BUILD", "DESIGN", "PREVIEW"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                "px-4 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all",
                mode === m ? "bg-ink text-canvas shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className={clsx(
            "font-mono text-[9px] uppercase tracking-widest transition-colors",
            isSaving ? "text-blue-500 animate-pulse" : "text-muted"
          )}>
            {isSaving ? "Saving..." : "Saved"}
          </span>
          <button 
            onClick={() => setMode("PREVIEW")}
            className="text-xs font-mono uppercase tracking-widest text-muted hover:text-ink transition-colors flex items-center gap-2"
          >
            <Play className="w-3 h-3" /> Preview
          </button>
          <button 
            onClick={handlePublish}
            className="bg-ink text-canvas px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center gap-2"
          >
            {status === "published" ? "Published" : "Publish"}
            <div className={clsx(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              status === "published" ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" : "bg-canvas"
            )} />
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL - Changes based on mode */}
        {mode === "BUILD" && (
          <aside className="w-[320px] border-r border-border flex flex-col bg-[#FAF8F5] shrink-0 premium-scrollbar overflow-hidden z-10 h-full">
            <div className="flex-1 overflow-y-auto p-5 border-b border-border/80" data-lenis-prevent>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-5">Question Blocks</div>
              <div className="flex flex-col gap-2">
                {questions.map((q, idx) => {
                  const QIcon = q.type === 'long' ? AlignLeft : 
                                q.type === 'multiple' ? CheckSquare : 
                                q.type === 'yesno' ? ToggleLeft : 
                                q.type === 'rating' ? Star : 
                                q.type === 'email' ? Mail : 
                                q.type === 'phone' ? Phone : Type;
                  return (
                    <div key={q.id} className="group relative">
                      <button 
                        onClick={() => setActiveQuestion(q.id)}
                        className={clsx(
                          "w-full text-left px-3.5 py-3 rounded-2xl text-xs flex items-center gap-3 font-sans transition-all duration-300 relative border",
                          activeQuestion === q.id 
                            ? "bg-white text-ink shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] border-[#0D0D0D]/15 translate-x-1 font-bold" 
                            : "text-muted hover:text-ink hover:bg-white/60 bg-transparent border-transparent hover:translate-x-1"
                        )}
                      >
                        {/* Active vertical accent bar */}
                        <div className={clsx(
                          "w-1 h-5 rounded-full transition-all duration-300 shrink-0",
                          activeQuestion === q.id ? "bg-ink scale-y-100" : "bg-transparent scale-y-0"
                        )} />
                        
                        {/* Block Type Icon Container */}
                        <div className={clsx(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                          activeQuestion === q.id ? "bg-ink/5 text-ink" : "bg-[#F3EFEA] text-muted group-hover:text-ink"
                        )}>
                          <QIcon className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="flex flex-col flex-grow min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] opacity-40 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="truncate flex-1 text-[11px] tracking-wide">{q.label || "Untitled Block"}</span>
                            {q.required && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Required" />}
                          </div>
                        </div>
                      </button>
                      
                      {/* Action Overlay */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-border/80 scale-90 group-hover:scale-100">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveQuestion(q.id, 'up'); }}
                          disabled={idx === 0}
                          className="p-1.5 hover:bg-black/5 rounded-lg text-muted hover:text-ink disabled:opacity-20 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveQuestion(q.id, 'down'); }}
                          disabled={idx === questions.length - 1}
                          className="p-1.5 hover:bg-black/5 rounded-lg text-muted hover:text-ink disabled:opacity-20 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-border/85 mx-0.5" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-muted hover:text-red-500 transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="w-full text-left px-4 py-3 mt-3 rounded-2xl text-xs flex items-center gap-2 font-sans text-muted hover:text-ink hover:bg-white bg-transparent border border-dashed border-[#0D0D0D]/15 hover:border-[#0D0D0D]/35 hover:shadow-sm transition-all duration-300"
                >
                  <Plus className="w-4 h-4 shrink-0 opacity-60" />
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Add Question Block</span>
                </button>
              </div>
            </div>
            
            <div className="p-5 mt-auto bg-[#F5F2EC] border-t border-border/60">
              <button 
                onClick={() => setMode("PREVIEW")}
                className="w-full py-3 bg-ink hover:bg-ink/90 text-canvas rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-canvas text-canvas" />
                Preview Live Form
              </button>
            </div>
          </aside>
        )}

        {mode === "DESIGN" && (
          <aside className="w-[320px] border-r border-border flex flex-col bg-[#FAF8F5] shrink-0 premium-scrollbar overflow-hidden z-10 h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-6" data-lenis-prevent>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-4">Art Direction</div>
                <div className="flex flex-col gap-2">
                  {(["Minimal", "Editorial", "Glass", "Brutalist", "Cinematic"] as Aesthetic[]).map((a) => (
                    <button 
                      key={a}
                      onMouseEnter={() => setHoveredAesthetic(a)}
                      onMouseLeave={() => setHoveredAesthetic(null)}
                      onClick={() => setAesthetic(a)}
                      className={clsx(
                        "text-left p-3.5 rounded-2xl border text-xs transition-all duration-300 flex flex-col gap-1 relative overflow-hidden",
                        aesthetic === a 
                          ? "bg-white text-ink border-[#0D0D0D]/15 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)]" 
                          : "bg-white/60 border-transparent text-ink hover:border-[#0D0D0D]/10 hover:bg-white hover:shadow-sm"
                      )}
                    >
                      {/* Active indicator bar */}
                      {aesthetic === a && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink rounded-r" />
                      )}
                      <span className="font-bold text-xs pl-1.5">{a}</span>
                      <span className={clsx(
                        "text-[9px] font-mono uppercase tracking-widest pl-1.5",
                        aesthetic === a ? "text-ink/60" : "text-muted/80"
                      )}>
                        {a === "Minimal" && "Quiet, Centered, Airy"}
                        {a === "Editorial" && "Clean but Dramatic"}
                        {a === "Glass" && "Blur, Depth, Sheen"}
                        {a === "Brutalist" && "Hard edges, Raw"}
                        {a === "Cinematic" && "Wide, Luxurious"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 space-y-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-2">Refine System</div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Surface</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["Flat", "Card", "Glass", "Frame"].map(s => (
                      <button key={s} onClick={() => setSurface(s)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        surface === s ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Typography</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["SM", "MD", "LG", "XL"].map(t => (
                      <button key={t} onClick={() => setTypography(t)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        typography === t ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Radius</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["None", "SM", "MD", "Full"].map(r => (
                      <button key={r} onClick={() => setRadius(r)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        radius === r ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{r}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Alignment</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["Left", "Center"].map(a => (
                      <button key={a} onClick={() => setAlignment(a)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        alignment === a ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 space-y-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-2">Advanced Effects</div>
                
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-sans text-ink font-medium">Film Grain</span>
                  <button 
                    onClick={() => setGrain(!grain)}
                    className={clsx(
                      "w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none",
                      grain ? "bg-ink" : "bg-[#EAE6DF]"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                      grain ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </label>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Transition Style</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["Slide", "Fade", "Zoom", "Flip"].map(s => (
                      <button key={s} onClick={() => setTransitionStyle(s)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        transitionStyle === s ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Motion Intensity</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["None", "Standard", "High"].map(m => (
                      <button key={m} onClick={() => setMotionIntensity(m)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        motionIntensity === m ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{m}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Progress Style</label>
                  <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                    {["None", "Bar", "Dots", "Fraction"].map(p => (
                      <button key={p} onClick={() => setProgressStyle(p)} className={clsx(
                        "flex-1 py-1.5 text-[9px] uppercase font-mono tracking-wider rounded-lg transition-all",
                        progressStyle === p ? "bg-white shadow-sm text-ink border border-border/40 font-bold" : "text-muted hover:text-ink"
                      )}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 mt-auto bg-[#F5F2EC] border-t border-border/60">
              <button 
                onClick={() => setMode("PREVIEW")}
                className="w-full py-3 bg-ink hover:bg-ink/90 text-canvas rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-canvas text-canvas" />
                Preview Live Form
              </button>
            </div>
          </aside>
        )}

        {/* CENTER CANVAS - Fluid (Shared by BUILD and DESIGN) */}
        {(mode === "BUILD" || mode === "DESIGN") && (
          <section className={clsx(
            "flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 pb-20",
            currentAesthetic === "Brutalist" ? "bg-black text-white" :
            currentAesthetic === "Cinematic" ? "bg-[#0D0D0D] text-white" :
            currentAesthetic === "Editorial" ? "bg-[#FAF8F4] text-ink" :
            "bg-[#F5F3F0] text-ink"
          )}>
            {hoveredAesthetic && mode === "DESIGN" && (
              <div className="absolute top-4 left-4 z-20 font-mono text-[9px] uppercase tracking-widest text-muted/50 bg-black/5 px-2 py-1 rounded">
                Previewing {hoveredAesthetic}
              </div>
            )}

            <div className={clsx(
              "flex-1 flex justify-center z-10 relative overflow-y-auto premium-scrollbar transition-all duration-500",
              previewDevice === "mobile" ? "items-start p-6" : "items-center p-12 lg:p-24"
            )}>
              {/* FILM GRAIN OVERLAY */}
              {grain && (
                <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay" 
                  style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
              )}

              <AnimatePresence mode="wait">
              <motion.div 
                key={`q-${activeQuestion}`}
                {...motionProps}
                style={{ perspective: 1400, transformStyle: "preserve-3d" }}
                className={clsx(
                "w-[92%] sm:w-full z-10 transition-all duration-500 mx-auto",
                previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl",
                currentAesthetic === "Minimal" ? "font-sans" : "font-serif",
                surface === "Card" ? (previewDevice === "mobile" ? "bg-white p-6 rounded-2xl shadow-xl border border-border/10 text-ink" : "bg-white p-12 lg:p-16 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-border/10 text-ink") : "",
                surface === "Glass" ? (previewDevice === "mobile" ? "bg-white/40 backdrop-blur-3xl p-6 rounded-2xl border border-white/40 shadow-xl text-ink" : "bg-white/40 backdrop-blur-3xl p-12 lg:p-16 rounded-2xl border border-white/40 shadow-2xl text-ink") : "",
                surface === "Frame" ? clsx(
                  "border-2",
                  previewDevice === "mobile" ? "p-6" : "p-12 lg:p-16",
                  currentAesthetic === "Brutalist"
                    ? (isDarkTheme ? "border-white text-white" : "border-ink text-ink")
                    : (isDarkTheme ? "border-white/20 text-white" : "border-ink/20 text-ink")
                ) : "",
                radius === "None" ? "rounded-none" : radius === "SM" ? "rounded-lg" : radius === "MD" ? "rounded-2xl" : radius === "Full" ? "rounded-3xl" : ""
              )}>
                <div className="w-full">
                  <div className={clsx(
                    "font-mono text-sm mb-8 transition-colors duration-300",
                    isDarkTheme ? "text-white/50" : "text-muted"
                  )}>{String(currentQ.id).padStart(2, '0')} →</div>
                  
                  <h2 className={clsx(
                    "leading-tight transition-all duration-500",
                    isDarkTheme ? "text-white" : "text-ink",
                    currentQ.description ? "mb-4" : "mb-12",
                    alignment === "Center" ? "text-center" : "text-left",
                    currentAesthetic === "Minimal" && "font-sans font-bold tracking-tight",
                    currentAesthetic === "Editorial" && "font-serif italic",
                    currentAesthetic === "Glass" && "font-serif italic",
                    currentAesthetic === "Brutalist" && "font-sans font-black uppercase tracking-tighter leading-[0.9]",
                    currentAesthetic === "Cinematic" && "font-serif tracking-[0.05em]",
                    !["Minimal", "Editorial", "Glass", "Brutalist", "Cinematic"].includes(currentAesthetic) && "font-serif italic",
                    typography === "SM" ? "text-2xl" : typography === "MD" ? "text-4xl" : typography === "LG" ? "text-5xl" : "text-6xl"
                  )}>
                    {currentAesthetic === "Cinematic" ? currentQ.label.split('').map((char, i) => (
                      <span 
                        key={i} 
                        className={clsx(
                          "inline-block hover:text-blue-400 transition-colors duration-500",
                          char === ' ' ? "whitespace-pre" : ""
                        )}
                      >
                        {char}
                      </span>
                    )) : currentQ.label}
                  </h2>
                  
                  {currentQ.description && (
                    <p className={clsx(
                      "font-sans transition-colors duration-500",
                      alignment === "Center" ? "text-center" : "text-left",
                      currentAesthetic === "Minimal" ? "opacity-40" : "",
                      currentAesthetic === "Cinematic" ? "tracking-widest uppercase text-[10px] opacity-50" : "",
                      previewDevice === "mobile" ? "text-[10px] mb-6" : "text-sm mb-8",
                      isDarkTheme ? "text-white/60" : "text-ink/60"
                    )}>{currentQ.description}</p>
                  )}
                  
                  {currentQ.type === "short" || currentQ.type === "email" || currentQ.type === "phone" ? (
                    <div className={clsx(
                      "pb-4 transition-all duration-300",
                      currentAesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                      isDarkTheme ? (
                        currentAesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                      ) : (
                        currentAesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                      )
                    )}>
                      <input 
                        type={currentQ.type === "email" ? "email" : currentQ.type === "phone" ? "tel" : "text"}
                        autoFocus
                        key={currentQ.id}
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        placeholder={currentQ.placeholder}
                        className={clsx(
                          "w-full bg-transparent outline-none font-sans text-xl placeholder:opacity-50 transition-all",
                          currentAesthetic === "Cinematic" ? "text-left tracking-[0.2em] uppercase text-sm" : "",
                          currentAesthetic === "Brutalist" ? "font-black italic uppercase" : "",
                          currentAesthetic === "Minimal" ? "text-left" : ""
                        )}
                      />
                    </div>
                  ) : currentQ.type === "long" ? (
                    <div className={clsx(
                      "pb-4 transition-all duration-300",
                      currentAesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                      isDarkTheme ? (
                        currentAesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                      ) : (
                        currentAesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                      )
                    )}>
                      <textarea 
                        autoFocus
                        key={currentQ.id}
                        rows={3}
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                        placeholder={currentQ.placeholder}
                        className="w-full bg-transparent outline-none font-sans text-xl placeholder:opacity-50 resize-none"
                      />
                    </div>
                  ) : currentQ.type === "rating" ? (
                    <div className="flex flex-wrap gap-4">
                      {Array.from({ length: currentQ.maxRating || 5 }, (_, i) => i + 1).map((num) => (
                        <button 
                          key={num}
                          onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: String(num) }))}
                          className={clsx(
                            "w-12 h-12 rounded-full border transition-all flex items-center justify-center font-mono text-sm",
                            answers[currentQ.id] === String(num) 
                              ? (isDarkTheme ? "bg-white text-black border-white scale-110 shadow-xl" : "bg-ink text-canvas border-ink scale-110 shadow-md")
                              : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-border text-ink hover:border-ink")
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  ) : currentQ.type === "yesno" ? (
                    <div className="flex gap-4">
                      {["Yes", "No"].map((opt) => (
                        <button 
                          key={opt}
                          onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                          className={clsx(
                            "px-10 py-5 rounded-2xl border transition-all font-sans text-lg font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5",
                            answers[currentQ.id] === opt 
                              ? (isDarkTheme ? "bg-white text-black border-white shadow-xl scale-105" : "bg-ink text-canvas border-ink") 
                              : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-border text-ink hover:border-ink")
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : currentQ.type === "multiple" ? (
                    <div className={clsx(
                      "w-full",
                      (currentQ.options || []).length > 4 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"
                    )}>
                      {(currentQ.options || ["Option 1", "Option 2", "Option 3"]).map((opt: string, idx: number) => {
                        const active = (answers[currentQ.id] || "").split(", ").map((s: string) => s.trim()).includes(opt);
                        return (
                          <button 
                            key={`${opt}-${idx}`}
                            onClick={() => {
                              if (currentQ.allowMultiple) {
                                const currentVal = answers[currentQ.id] || "";
                                const selectedList = currentVal ? currentVal.split(", ").map((s: string) => s.trim()).filter(Boolean) : [];
                                let newList;
                                if (selectedList.includes(opt)) {
                                  newList = selectedList.filter((s: string) => s !== opt);
                                } else {
                                  newList = [...selectedList, opt];
                                }
                                setAnswers(prev => ({ ...prev, [currentQ.id]: newList.join(", ") }));
                              } else {
                                setAnswers(prev => ({ ...prev, [currentQ.id]: opt }));
                              }
                            }}
                            className={clsx(
                              "w-full text-left px-6 rounded-xl border transition-all font-sans flex items-center justify-between group",
                              ((currentQ.options?.length || 0) > 5) ? "py-3 text-xs" : "py-4 text-sm",
                              active 
                                ? (isDarkTheme ? "bg-white text-black border-white translate-x-2 shadow-xl" : "bg-ink text-canvas border-ink translate-x-2") 
                                : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50 hover:translate-x-2" : "bg-white border-border text-ink hover:border-ink hover:translate-x-2")
                            )}
                          >
                            <span>{opt}</span>
                            <div className={clsx(
                              "w-4 h-4 flex items-center justify-center transition-colors shrink-0",
                              currentQ.allowMultiple ? "rounded-md border" : "rounded-full border",
                              active ? "bg-canvas border-canvas" : "border-border group-hover:border-ink"
                            )}>
                              {active && (
                                currentQ.allowMultiple 
                                  ? <Check className="w-2.5 h-2.5 text-ink" />
                                  : <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  
                  <div className="mt-8 flex items-center gap-4">
                    <button 
                      onClick={nextQuestion}
                      className={clsx(
                        "px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-colors",
                        isDarkTheme ? "bg-white text-black hover:bg-white/90" : "bg-ink text-canvas hover:bg-ink/90",
                        radius === "SM" ? "rounded-sm" : radius === "MD" ? "rounded-md" : radius === "Full" ? "rounded-full" : "rounded-none"
                      )}>
                      {currentQ.buttonText ? currentQ.buttonText : (currentQ.id === questions.length ? "Submit" : "Continue")} <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Press Enter ↵</span>
                  </div>
                </div>
              </motion.div>
              </AnimatePresence>
            </div>

            {/* DECORATIVE OVERLAYS BASED ON AESTHETIC */}
            <AnimatePresence mode="wait">
              {currentAesthetic === "Editorial" && (
                <motion.div 
                  key="editorial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-0"
                >
                  <div className="absolute inset-8 border border-ink/5" />
                  <div className="absolute top-0 left-12 bottom-0 w-px bg-ink/5" />
                  <div className="absolute top-0 right-12 bottom-0 w-px bg-ink/5" />
                </motion.div>
              )}
              {currentAesthetic === "Glass" && (
                <motion.div 
                  key="glass"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                >
                  <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
                </motion.div>
              )}
              {currentAesthetic === "Brutalist" && (
                <motion.div 
                  key="brutalist"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0 pointer-events-none z-0"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-white" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-white" />
                  <div className="absolute bottom-0 right-0 w-full h-1 bg-white" />
                  <div className="absolute bottom-0 right-0 w-1 h-full bg-white" />
                  <div className="absolute top-12 left-12 px-3 py-1 bg-white text-black font-mono text-[10px] uppercase tracking-widest">AESTHETIC_V2_BRTL</div>
                </motion.div>
              )}
              {currentAesthetic === "Cinematic" && (
                <motion.div 
                  key="cinematic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between"
                >
                  <div className="h-[10vh] bg-black z-20" />
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent" />
                  </div>
                  <div className="h-[10vh] bg-black z-20" />
                </motion.div>
              )}
              {currentAesthetic === "Minimal" && (
                <motion.div 
                  key="minimal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center"
                >
                  <div className="w-[80vw] h-[80vh] border border-ink/[0.03] rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* QUESTION SCRUBBER (Only in BUILD mode) */}
            {mode === "BUILD" && (
              <div className="h-[80px] bg-canvas border-t border-border flex items-center justify-between px-6 absolute bottom-0 w-full z-20">
                <button onClick={prevQuestion} className="text-muted hover:text-ink flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-colors">
                  <ArrowRight className="w-3 h-3 rotate-180" /> Prev
                </button>
                
                <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
                  {questions.map((q, idx) => (
                    <button 
                      key={q.id}
                      onClick={() => setActiveQuestion(q.id)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full font-mono text-[10px] transition-all border whitespace-nowrap",
                        activeQuestion === q.id ? "bg-ink text-canvas border-ink px-5 shadow-lg" : "bg-transparent text-muted border-border hover:border-ink hover:text-ink"
                      )}
                    >
                      {String(idx + 1).padStart(2, '0')} {q.label.length > 8 ? q.label.substring(0, 8) + "..." : q.label}
                    </button>
                  ))}
                </div>

                <button onClick={nextQuestion} className="text-muted hover:text-ink flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-colors">
                  Next <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* RIGHT PANEL - Only in BUILD mode */}
        {mode === "BUILD" && (
          <aside className="w-[290px] border-l border-border bg-[#FAF8F5] shrink-0 p-5 overflow-y-auto overflow-x-hidden premium-scrollbar z-10" data-lenis-prevent>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-6 border-b border-border/80 pb-4">Question Settings</div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 group">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted group-focus-within:text-ink transition-colors font-bold">Question Title</label>
                  <textarea 
                    className="w-full border border-[#0D0D0D]/10 bg-white/60 p-3 rounded-2xl font-sans text-xs resize-none focus:border-ink/40 focus:bg-white focus:shadow-md outline-none transition-all duration-300" 
                    rows={2}
                    value={currentQ.label || ""}
                    onChange={(e) => updateQuestion(currentQ.id, { label: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 group">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted group-focus-within:text-ink transition-colors font-bold">Description / Hint</label>
                  <input 
                    type="text"
                    className="w-full border border-[#0D0D0D]/10 bg-white/60 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:border-ink/40 focus:bg-white focus:shadow-md outline-none transition-all duration-300" 
                    placeholder="Optional"
                    value={currentQ.description || ""}
                    onChange={(e) => updateQuestion(currentQ.id, { description: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 group">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted group-focus-within:text-ink transition-colors font-bold">Placeholder</label>
                  <input 
                    type="text"
                    className="w-full border border-[#0D0D0D]/10 bg-white/60 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:border-ink/40 focus:bg-white focus:shadow-md outline-none transition-all duration-300" 
                    value={currentQ.placeholder || ""}
                    onChange={(e) => updateQuestion(currentQ.id, { placeholder: e.target.value })}
                  />
                </div>

                {currentQ.type === "multiple" && (
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-ink font-bold">Options</label>
                    <div className="flex flex-col gap-2 bg-transparent">
                      {(currentQ.options || ["Option 1", "Option 2", "Option 3"]).map((opt: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center group/opt">
                          <input 
                            type="text"
                            value={opt || ""}
                            onChange={(e) => {
                              const newOpts = [...(currentQ.options || ["Option 1", "Option 2", "Option 3"])];
                              newOpts[idx] = e.target.value;
                              updateQuestion(currentQ.id, { options: newOpts });
                            }}
                            className="flex-1 min-w-0 bg-white/60 border border-[#0D0D0D]/10 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-ink/40 focus:bg-white focus:shadow-sm hover:border-[#0D0D0D]/20 transition-all duration-300"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = (currentQ.options || ["Option 1", "Option 2", "Option 3"]).filter((_: string, i: number) => i !== idx);
                              updateQuestion(currentQ.id, { options: newOpts });
                            }}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all shrink-0 opacity-0 group-hover/opt:opacity-100 focus:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newOpts = [...(currentQ.options || ["Option 1", "Option 2", "Option 3"]), `Option ${(currentQ.options || ["Option 1", "Option 2", "Option 3"]).length + 1}`];
                          updateQuestion(currentQ.id, { options: newOpts });
                        }}
                        className="w-full py-2.5 mt-2 border border-dashed border-[#0D0D0D]/15 rounded-xl text-[9px] uppercase tracking-widest text-muted hover:text-ink hover:border-ink/35 hover:bg-white transition-all flex justify-center items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>
                  </div>
                )}

                {currentQ.type === "rating" && (
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-muted font-bold">Max Rating</label>
                    <div className="flex bg-[#F3EFEA] p-1 rounded-xl border border-[#0D0D0D]/5">
                      {[5, 10].map(val => (
                        <button 
                          key={val} 
                          onClick={() => updateQuestion(currentQ.id, { maxRating: val })} 
                          className={clsx(
                            "flex-1 py-2 text-[10px] font-mono rounded-lg transition-all",
                            (currentQ.maxRating || 5) === val ? "bg-white shadow-sm text-ink border border-border/50 font-bold" : "text-muted hover:text-ink"
                          )}
                        >
                          {val} Stars
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-5 border-t border-border/60 flex flex-col gap-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-1">Behavior</div>
                  
                  {currentQ.type === "multiple" && (
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-sans text-ink font-medium">Allow Multi-Select</span>
                      <button 
                        onClick={() => updateQuestion(currentQ.id, { allowMultiple: !currentQ.allowMultiple })}
                        className={clsx(
                          "w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none",
                          currentQ.allowMultiple ? "bg-ink" : "bg-[#EAE6DF]"
                        )}
                      >
                        <div className={clsx(
                          "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                          currentQ.allowMultiple ? "translate-x-4" : "translate-x-0"
                        )} />
                      </button>
                    </label>
                  )}

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-sans text-ink font-medium">Required Field</span>
                    <button 
                      onClick={() => updateQuestion(currentQ.id, { required: !currentQ.required })}
                      className={clsx(
                        "w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none",
                        currentQ.required ? "bg-ink" : "bg-[#EAE6DF]"
                      )}
                    >
                      <div className={clsx(
                        "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                        currentQ.required ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                  </label>

                  <div className="flex flex-col gap-2 group">
                    <label className="text-[9px] font-mono text-muted uppercase font-bold tracking-widest group-focus-within:text-ink transition-colors">Max Characters</label>
                    <input 
                      type="number"
                      className="w-full border border-[#0D0D0D]/10 bg-white/60 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:border-ink/40 focus:bg-white focus:shadow-md outline-none transition-all duration-300" 
                      value={currentQ.maxChars || ""}
                      onChange={(e) => updateQuestion(currentQ.id, { maxChars: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex flex-col gap-2 group">
                    <label className="text-[9px] font-mono text-muted uppercase font-bold tracking-widest group-focus-within:text-ink transition-colors">Button Text</label>
                    <input 
                      type="text"
                      className="w-full border border-[#0D0D0D]/10 bg-white/60 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:border-ink/40 focus:bg-white focus:shadow-md outline-none transition-all duration-300" 
                      value={currentQ.buttonText || ""}
                      onChange={(e) => updateQuestion(currentQ.id, { buttonText: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-border/60">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/65 font-bold mb-3">Advanced</div>
                  <button className="w-full text-left px-4 py-3 bg-[#F5F2EC] hover:bg-[#EFECE5] rounded-2xl text-xs text-muted hover:text-ink transition-all duration-300 flex items-center justify-between border border-transparent hover:border-[#0D0D0D]/5 shadow-sm hover:shadow active:scale-[0.99]">
                    <span className="font-medium text-xs">Add Logic / Branching</span>
                    <Plus className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                </div>
              </div>
          </aside>
        )}

        {/* PREVIEW MODE */}
        {mode === "PREVIEW" && (
          <div className="flex-1 flex flex-col bg-[#E5E5E5] relative overflow-hidden">
            <div className="h-12 border-b border-border bg-white flex items-center justify-between px-6 shadow-sm z-10">
              <button onClick={() => setMode("BUILD")} className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink flex items-center gap-2">
                ← Back to Editor
              </button>
              <div className="flex bg-[#F5F3F0] p-1 rounded-md border border-border">
                <button 
                  onClick={() => setPreviewDevice("desktop")}
                  className={clsx(
                    "px-4 py-1 text-[10px] uppercase font-mono tracking-widest transition-all",
                    previewDevice === "desktop" ? "bg-white shadow-sm rounded-sm text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  Desktop
                </button>
                <button 
                  onClick={() => setPreviewDevice("mobile")}
                  className={clsx(
                    "px-4 py-1 text-[10px] uppercase font-mono tracking-widest transition-all",
                    previewDevice === "mobile" ? "bg-white shadow-sm rounded-sm text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  Mobile
                </button>
              </div>
              <div className="w-24" /> {/* Spacer */}
            </div>
            
            <div className="flex-1 overflow-auto p-4 lg:p-8 flex justify-center items-center">
              <div className={clsx(
                "bg-white shadow-2xl overflow-hidden flex flex-col relative border border-border/20 transition-all duration-500 ease-in-out origin-center",
                previewDevice === "desktop" ? "w-full max-w-6xl h-[82vh] min-h-[640px] max-h-[780px] rounded-[28px]" : "w-[380px] h-[780px] rounded-[50px] border-[14px] border-[#0D0D0D] relative shadow-2xl flex flex-col overflow-hidden"
              )}>
                {/* Macbook Header - Only for desktop */}
                {previewDevice === "desktop" && (
                  <div className="h-9 bg-[#F6F6F6] border-b border-border/50 flex items-center px-4 gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white border border-border/50 rounded-md px-16 py-1 text-[10px] font-mono text-muted shadow-sm flex items-center gap-2 max-w-md truncate">
                        <span className="opacity-50">http://localhost:3000/f/</span>{slug || 'waitlist'}
                      </div>
                    </div>
                    <div className="w-[52px]" /> {/* Spacer for centering */}
                  </div>
                )}

                {/* iPhone Notch - Only for mobile */}
                {previewDevice === "mobile" && (
                  <div className="h-12 w-full flex items-center justify-center shrink-0">
                    <div className="w-24 h-6 bg-black rounded-b-2xl" />
                  </div>
                )}

                {/* Progress Indicators */}
                {progressStyle === "Bar" && (
                  <div className="h-[3px] w-full bg-border shrink-0">
                    <div className="h-full bg-ink transition-all duration-500" style={{ width: `${(activeQuestion / questions.length) * 100}%` }} />
                  </div>
                )}
                {progressStyle === "Fraction" && (
                  <div className={clsx(
                    "absolute top-16 right-12 font-mono text-[10px] uppercase tracking-widest z-20",
                    isDarkTheme ? "text-white/50" : "text-muted"
                  )}>
                    {activeQuestion} / {questions.length}
                  </div>
                )}
                {progressStyle === "Dots" && (
                  <div className="absolute top-16 right-12 flex gap-1 z-20">
                    {questions.map((q, idx) => (
                      <div key={q.id} className={clsx(
                        "w-1 h-1 rounded-full transition-all duration-300",
                        activeQuestion === q.id ? (isDarkTheme ? "bg-white scale-125" : "bg-ink scale-125") : (isDarkTheme ? "bg-white/20" : "bg-border")
                      )} />
                    ))}
                  </div>
                )}
                
                 {/* Preview Canvas */}
                <div className={clsx(
                  "flex-1 flex flex-col items-center transition-colors duration-500 relative overflow-y-auto premium-scrollbar",
                  previewDevice === "mobile" ? "p-6" : "p-12",
                  currentAesthetic === "Brutalist" ? "bg-black text-white" :
                  currentAesthetic === "Cinematic" ? "bg-[#0D0D0D] text-white" :
                  currentAesthetic === "Editorial" ? "bg-[#FAF8F4] text-ink" :
                  "bg-white text-ink"
                )}>
                  {/* Dynamic Header Overlay */}
                  <header className={clsx(
                    "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pointer-events-none select-none",
                    previewDevice === "mobile" ? "pt-4 pb-2" : "h-16",
                    currentAesthetic === "Cinematic" ? "h-[12vh]" : ""
                  )}>
                    {/* Left: Brand & Title */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <svg className="w-5.5 h-5.5 rounded-[5px] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="prevSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="30%" stopColor="#FAF8F4" />
                            <stop offset="100%" stopColor="#F59E0B" />
                          </linearGradient>
                        </defs>
                        <rect width="32" height="32" rx="5" fill={isDarkTheme ? "#FAF8F4" : "#0D0D0D"}/>
                        <text 
                          x="50%" 
                          y="55%" 
                          dominantBaseline="middle" 
                          textAnchor="middle" 
                          fontFamily="system-ui, -apple-system, sans-serif" 
                          fontWeight="900" 
                          fontSize="12" 
                          fill={isDarkTheme ? "#0D0D0D" : "url(#prevSfGrad)"} 
                          letterSpacing="-0.03em"
                        >
                          SF
                        </text>
                      </svg>
                      <div className="flex flex-col">
                        <span className={clsx(
                          "font-mono text-[7px] tracking-[0.15em] uppercase opacity-40 font-bold leading-none mb-0.5",
                          currentAesthetic === "Brutalist" && "opacity-100 font-black italic uppercase text-white"
                        )}>
                          {authorName || "Superform"}
                        </span>
                        <h1 className={clsx(
                          "text-[9px] font-mono uppercase tracking-wider font-bold truncate max-w-[100px] sm:max-w-xs leading-none",
                          currentAesthetic === "Editorial" && "font-serif italic capitalize normal-case text-xs tracking-normal text-current",
                          currentAesthetic === "Cinematic" && "tracking-[0.05em] font-serif text-xs italic text-white/90",
                          currentAesthetic === "Brutalist" && "font-mono font-black italic text-xs text-white",
                          currentAesthetic === "Glass" && "font-serif text-xs"
                        )}>
                          {title}
                        </h1>
                      </div>
                    </div>
                  </header>

                  {/* FILM GRAIN OVERLAY */}
                  {grain && (
                    <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.05] mix-blend-overlay" 
                      style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
                  )}

                  {/* Decorative preview borders */}
                  <AnimatePresence mode="wait">
                    {currentAesthetic === "Editorial" && (
                      <motion.div key="ed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute inset-8 border border-ink/5" />
                        <div className="absolute top-0 left-12 bottom-0 w-px bg-ink/5" />
                        <div className="absolute top-0 right-12 bottom-0 w-px bg-ink/5" />
                      </motion.div>
                    )}
                    {currentAesthetic === "Glass" && (
                      <motion.div key="gl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                      </motion.div>
                    )}
                    {currentAesthetic === "Brutalist" && (
                      <motion.div key="br" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-white" />
                        <div className="absolute bottom-0 right-0 w-full h-1 bg-white" />
                        <div className="absolute bottom-0 right-0 w-1 h-full bg-white" />
                      </motion.div>
                    )}
                    {currentAesthetic === "Cinematic" && (
                      <motion.div key="ci" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between">
                        <div className="h-[12vh] bg-black/90 backdrop-blur-md z-20 border-b border-white/5" />
                        <div className="h-[12vh] bg-black/90 backdrop-blur-md z-20 border-t border-white/5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className={clsx(
                    "min-h-full flex flex-col justify-center w-full relative z-10",
                    previewDevice === "mobile" ? "py-4" : "py-12"
                  )}>
                    <div className={clsx(
                      "w-[92%] sm:w-full max-w-2xl mx-auto transition-all duration-500 relative z-10",
                      (currentQ.type === 'multiple' && (currentQ.options?.length || 0) > 5) ? "scale-[0.85] lg:scale-90 origin-center" : "",
                      surface === "Card" ? (previewDevice === "mobile" ? "bg-white p-6 rounded-2xl shadow-xl border border-border/10 text-ink" : "bg-white p-12 rounded-xl shadow-xl border border-border/10 text-ink") : "",
                      surface === "Glass" ? (previewDevice === "mobile" ? "bg-white/40 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-xl text-ink" : "bg-white/40 backdrop-blur-xl p-12 rounded-xl border border-white/40 shadow-xl text-ink") : "",
                      surface === "Frame" ? clsx(
                        "border-2",
                        previewDevice === "mobile" ? "p-6" : "p-12",
                        currentAesthetic === "Brutalist"
                          ? (isDarkTheme ? "border-white text-white" : "border-ink text-ink")
                          : (isDarkTheme ? "border-white/20 text-white" : "border-ink/20 text-ink")
                      ) : "",
                      radius === "None" ? "rounded-none" : radius === "SM" ? "rounded-md" : radius === "MD" ? "rounded-xl" : radius === "Full" ? "rounded-3xl" : ""
                    )}>
                    <AnimatePresence mode="wait">
                    <motion.div 
                      key={`pq-${activeQuestion}`}
                      {...motionProps}
                      style={{ perspective: 1400, transformStyle: "preserve-3d" }}
                      className="w-full"
                    >
                      <div className={clsx(
                        "font-mono text-sm mb-8",
                        isDarkTheme ? "text-white/50" : "text-muted"
                      )}>{String(currentQ.id).padStart(2, '0')} →</div>
                      <h2 className={clsx(
                        "leading-tight transition-all duration-500",
                        isDarkTheme ? "text-white" : "text-ink",
                        currentQ.description ? "mb-4" : "mb-12",
                        alignment === "Center" ? "text-center" : "text-left",
                        currentAesthetic === "Minimal" && "font-sans font-bold tracking-tight",
                        currentAesthetic === "Editorial" && "font-serif italic",
                        currentAesthetic === "Glass" && "font-serif italic",
                        currentAesthetic === "Brutalist" && "font-sans font-black uppercase tracking-tighter leading-[0.9]",
                        currentAesthetic === "Cinematic" && "font-serif tracking-[0.05em]",
                        !["Minimal", "Editorial", "Glass", "Brutalist", "Cinematic"].includes(currentAesthetic) && "font-serif italic",
                        typography === "SM" ? "text-2xl" : typography === "MD" ? "text-4xl" : typography === "LG" ? "text-5xl" : "text-6xl"
                      )}>{currentQ.label}</h2>
                      
                      {currentQ.description && (
                        <p className={clsx(
                          "font-sans transition-colors duration-500",
                          alignment === "Center" ? "text-center" : "text-left",
                          previewDevice === "mobile" ? "text-xs mb-6" : "text-sm mb-8",
                          isDarkTheme ? "text-white/60" : "text-ink/60"
                        )}>{currentQ.description}</p>
                      )}

                      {currentQ.type === "short" || currentQ.type === "email" || currentQ.type === "phone" ? (
                        <div className={clsx(
                          "pb-4 transition-all duration-300",
                          currentAesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                          isDarkTheme ? (
                            currentAesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                          ) : (
                            currentAesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                          )
                        )}>
                          <input 
                            type={currentQ.type === "email" ? "email" : currentQ.type === "phone" ? "tel" : "text"}
                            autoFocus
                            key={`preview-${currentQ.id}`}
                            value={answers[currentQ.id] || ""}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            placeholder={currentQ.placeholder}
                            className="w-full bg-transparent outline-none font-sans text-xl placeholder:opacity-50"
                          />
                        </div>
                      ) : currentQ.type === "long" ? (
                        <div className={clsx(
                          "pb-4 transition-all duration-300",
                          currentAesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                          isDarkTheme ? (
                            currentAesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                          ) : (
                            currentAesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                          )
                        )}>
                          <textarea 
                            autoFocus
                            key={`preview-${currentQ.id}`}
                            rows={3}
                            value={answers[currentQ.id] || ""}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                            placeholder={currentQ.placeholder}
                            className="w-full bg-transparent outline-none font-sans text-xl placeholder:opacity-50 resize-none"
                          />
                        </div>
                      ) : currentQ.type === "rating" ? (
                        <div className="flex flex-wrap gap-4">
                          {Array.from({ length: currentQ.maxRating || 5 }, (_, i) => i + 1).map((num) => (
                            <button 
                              key={num}
                              onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: String(num) }))}
                              className={clsx(
                                "w-12 h-12 rounded-full border transition-all flex items-center justify-center font-mono text-sm",
                                answers[currentQ.id] === String(num) 
                                  ? (isDarkTheme ? "bg-white text-black border-white scale-110 shadow-xl" : "bg-ink text-canvas border-ink scale-110 shadow-md")
                                  : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-border text-ink hover:border-ink")
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      ) : currentQ.type === "yesno" ? (
                        <div className="flex gap-4">
                          {["Yes", "No"].map((opt) => (
                            <button 
                              key={opt}
                              onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                              className={clsx(
                                "px-10 py-5 rounded-2xl border transition-all font-sans text-lg font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5",
                                answers[currentQ.id] === opt 
                                  ? (isDarkTheme ? "bg-white text-black border-white shadow-xl scale-105" : "bg-ink text-canvas border-ink") 
                                  : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-border text-ink hover:border-ink")
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : currentQ.type === "multiple" ? (
                        <div className={clsx(
                          "w-full",
                          (currentQ.options || []).length > 4 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"
                        )}>
                           {(currentQ.options || ["Option 1", "Option 2", "Option 3"]).map((opt: string, idx: number) => {
                             const active = (answers[currentQ.id] || "").split(", ").map((s: string) => s.trim()).includes(opt);
                             return (
                               <button 
                                 key={`${opt}-${idx}`}
                                 onClick={() => {
                                   if (currentQ.allowMultiple) {
                                     const currentVal = answers[currentQ.id] || "";
                                     const selectedList = currentVal ? currentVal.split(", ").map((s: string) => s.trim()).filter(Boolean) : [];
                                     let newList;
                                     if (selectedList.includes(opt)) {
                                       newList = selectedList.filter((s: string) => s !== opt);
                                     } else {
                                       newList = [...selectedList, opt];
                                     }
                                     setAnswers(prev => ({ ...prev, [currentQ.id]: newList.join(", ") }));
                                   } else {
                                     setAnswers(prev => ({ ...prev, [currentQ.id]: opt }));
                                   }
                                 }}
                                 className={clsx(
                                   "w-full text-left px-6 rounded-xl border transition-all font-sans flex items-center justify-between group",
                                   ((currentQ.options?.length || 0) > 5) ? "py-3 text-xs" : "py-4 text-sm",
                                   active 
                                     ? (isDarkTheme ? "bg-white text-black border-white translate-x-2 shadow-xl" : "bg-ink text-canvas border-ink translate-x-2") 
                                     : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50 hover:translate-x-2" : "bg-white border-border text-ink hover:border-ink hover:translate-x-2")
                                 )}
                               >
                                 <span>{opt}</span>
                                 <div className={clsx(
                                   "w-4 h-4 flex items-center justify-center transition-colors shrink-0",
                                   currentQ.allowMultiple ? "rounded-md border" : "rounded-full border",
                                   active ? "bg-canvas border-canvas" : "border-border group-hover:border-ink"
                                 )}>
                                   {active && (
                                     currentQ.allowMultiple 
                                       ? <Check className="w-2.5 h-2.5 text-ink" />
                                       : <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                                   )}
                                 </div>
                               </button>
                             );
                           })}
                        </div>
                      ) : null}
                      
                      <div className="mt-8 flex items-center gap-3">
                        {questions.findIndex(q => q.id === activeQuestion) > 0 && (
                          <button
                            onClick={prevQuestion}
                            className={clsx(
                              "px-5 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 border transition-all active:scale-[0.98]",
                              isDarkTheme 
                                ? "border-white/20 text-white hover:bg-white/5" 
                                : "border-ink/15 text-ink hover:bg-ink/5 hover:border-ink/30",
                              radius === "SM" ? "rounded-sm" : radius === "MD" ? "rounded-md" : radius === "Full" ? "rounded-full" : "rounded-none"
                            )}
                          >
                            ← Back
                          </button>
                        )}
                        <button onClick={nextQuestion} className={clsx(
                          "px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2",
                          (isDarkTheme) ? "bg-white text-black" : "bg-ink text-canvas",
                          radius === "SM" ? "rounded-sm" : radius === "MD" ? "rounded-md" : radius === "Full" ? "rounded-full" : "rounded-none"
                        )}>
                          {currentQ.buttonText ? currentQ.buttonText : (currentQ.id === questions.length ? "Submit" : "Continue")} <ArrowRight className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Press Enter &crarr;</span>
                      </div>
                    </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                  
                  <div className={clsx(
                    "absolute bottom-6 right-6 font-mono text-[10px] z-20 transition-colors",
                    isDarkTheme ? "text-white/30" : "text-muted/40"
                  )}>
                    Built with Superform
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMAND PALETTE OVERLAY */}
        <AnimatePresence>
          {isCommandPaletteOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center px-4 py-3 border-b border-border/50 gap-3">
                  <Search className="w-4 h-4 text-muted" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Search blocks..." 
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none font-sans text-sm placeholder:text-muted/50"
                  />
                  <button 
                    onClick={() => setIsCommandPaletteOpen(false)}
                    className="p-1 hover:bg-black/5 rounded-md text-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {blockTypes.map((section) => {
                    const filteredItems = section.items.filter(item => 
                      item.label.toLowerCase().includes(paletteSearch.toLowerCase())
                    );
                    
                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={section.section} className="mb-4 last:mb-0">
                        <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted/50">
                          {section.section}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {filteredItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => addQuestion(item.id, `New ${item.label}`)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F3F0] rounded-lg text-sm text-left transition-colors group"
                            >
                              <div className="w-8 h-8 rounded border border-border bg-white flex items-center justify-center shadow-sm group-hover:border-ink/20 transition-colors">
                                <item.icon className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-ink">{item.label}</span>
                                <span className="text-[10px] text-muted">Add a {item.label.toLowerCase()} field</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="px-4 py-2 border-t border-border/50 bg-[#F9F9F9] flex justify-between items-center shrink-0">
                  <span className="text-[10px] text-muted font-mono uppercase tracking-widest">Use ↑↓ to navigate</span>
                  <span className="text-[10px] text-muted font-mono uppercase tracking-widest">Enter to select</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PUBLISH SHARE MODAL */}
        <AnimatePresence>
          {isPublishModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="w-full max-w-lg bg-white border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 relative flex flex-col gap-6 text-ink"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="absolute top-6 right-6 text-muted hover:text-ink transition-colors p-1.5 hover:bg-[#F5F3F0] rounded-full"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Status Indicator Banner */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Your form is live & ready
                  </span>
                </div>

                {/* Form Title & Description */}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Active Form</span>
                  <h3 className="font-serif text-2xl font-medium tracking-tight truncate">
                    {title}
                  </h3>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-[#F5F3F0] p-1 rounded-xl border border-border">
                  <button 
                    onClick={() => setActiveShareTab("LINK")} 
                    className={clsx(
                      "flex-1 py-2 text-[9px] uppercase font-mono tracking-widest rounded-lg transition-all", 
                      activeShareTab === "LINK" 
                        ? "bg-white text-ink border border-border/50 shadow-sm font-bold" 
                        : "text-muted hover:text-ink"
                    )}
                  >
                    Share Link
                  </button>
                  <button 
                    onClick={() => setActiveShareTab("EMBED")} 
                    className={clsx(
                      "flex-1 py-2 text-[9px] uppercase font-mono tracking-widest rounded-lg transition-all", 
                      activeShareTab === "EMBED" 
                        ? "bg-white text-ink border border-border/50 shadow-sm font-bold" 
                        : "text-muted hover:text-ink"
                    )}
                  >
                    Embed in Website
                  </button>
                </div>

                {activeShareTab === "LINK" ? (
                  <>
                    {/* Shareable Link Box */}
                    <div className="flex flex-col gap-2 animate-fadeIn">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-muted">Share link</label>
                      <div className="flex items-center border border-border rounded-xl overflow-hidden bg-[#F9F9F9] focus-within:border-ink/20 transition-all p-1.5 pl-3">
                        <Globe className="w-3.5 h-3.5 text-muted shrink-0 mr-2" />
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/f/${slug}` : `http://localhost:3000/f/${slug}`}
                          className="bg-transparent outline-none border-none text-xs font-mono w-full select-all text-ink truncate pr-2"
                        />
                        <button
                          onClick={() => {
                            const url = typeof window !== "undefined" ? `${window.location.origin}/f/${slug}` : `http://localhost:3000/f/${slug}`;
                            navigator.clipboard.writeText(url);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className={clsx(
                            "px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all shrink-0",
                            copied ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-ink text-canvas hover:bg-ink/95"
                          )}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Customize Slug Section */}
                    <div className="flex flex-col gap-2 border-t border-border/50 pt-5 animate-fadeIn">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-muted">Customize URL Slug</label>
                      <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:border-ink/20 transition-all p-1.5 pl-3">
                        <span className="text-xs font-mono text-muted pr-1">/f/</span>
                        <input
                          type="text"
                          defaultValue={slug}
                          onBlur={(e) => handleUpdateSlug(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdateSlug((e.target as HTMLInputElement).value)}
                          className="bg-transparent outline-none border-none text-xs font-mono w-full text-ink font-semibold"
                          placeholder="custom-slug"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-5 animate-fadeIn">
                    {/* Embed Settings Customizer */}
                    <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-muted">Iframe Height</span>
                        <div className="flex items-center border border-border rounded-lg px-3 py-1 bg-[#F9F9F9]">
                          <input 
                            type="number" 
                            value={embedHeight}
                            onChange={(e) => setEmbedHeight(Math.max(200, parseInt(e.target.value) || 600))}
                            className="bg-transparent outline-none border-none text-xs font-mono w-full text-ink font-bold"
                          />
                          <span className="text-[10px] font-mono text-muted ml-1">px</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-muted">Border Corners</span>
                        <div className="flex bg-[#F5F3F0] p-0.5 rounded-lg border border-border">
                          {["0", "12", "24"].map((r) => (
                            <button 
                              key={r}
                              onClick={() => setEmbedRadius(r)}
                              className={clsx(
                                "flex-1 py-1 text-[8px] font-mono rounded-md transition-all",
                                embedRadius === r ? "bg-white text-ink shadow-sm font-bold" : "text-muted"
                              )}
                            >
                              {r === "0" ? "None" : `${r}px`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#0D0D0D] font-bold">Transparent Canvas</span>
                        <span className="text-[8px] font-mono text-muted uppercase tracking-wider mt-0.5">Let host website background show through</span>
                      </div>
                      <button 
                        onClick={() => setEmbedTransparent(!embedTransparent)}
                        className={clsx(
                          "w-8 h-4 rounded-full transition-colors flex items-center px-0.5",
                          embedTransparent ? "bg-ink" : "bg-border"
                        )}
                      >
                        <div className={clsx(
                          "w-3 h-3 bg-white rounded-full transition-transform",
                          embedTransparent ? "translate-x-4" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    {/* Copier Code Box */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-muted">Copy Embed HTML Code</label>
                      <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-[#FAF8F4] p-3 gap-3">
                        <pre className="text-[9px] font-mono text-ink/70 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[120px] premium-scrollbar select-all">
                          {`<!-- Superform Embed -->
<iframe 
  src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/f/${slug}${embedTransparent ? "?transparent=true" : ""}" 
  style="width: 100%; height: ${embedHeight}px; border: none; border-radius: ${embedRadius}px; display: block;" 
  allow="clipboard-write">
</iframe>`}
                        </pre>
                        <button
                          onClick={() => {
                            const code = `<!-- Superform Embed -->\n<iframe \n  src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/f/${slug}${embedTransparent ? "?transparent=true" : ""}" \n  style="width: 100%; height: ${embedHeight}px; border: none; border-radius: ${embedRadius}px; display: block;" \n  allow="clipboard-write">\n</iframe>`;
                            navigator.clipboard.writeText(code);
                            setCopiedEmbed(true);
                            setTimeout(() => setCopiedEmbed(false), 2000);
                          }}
                          className={clsx(
                            "w-full py-2.5 font-mono text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all",
                            copiedEmbed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-ink text-canvas hover:bg-ink/95"
                          )}
                        >
                          {copiedEmbed ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copied Embed HTML
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy HTML Embed Code
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-border/50 pt-5 mt-2">
                  <a
                    href={`/f/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink hover:opacity-75 transition-opacity underline decoration-dotted decoration-1"
                  >
                    View live form <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setIsPublishModalOpen(false)}
                    className="bg-ink text-canvas font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-ink/90 transition-colors shadow-lg shadow-black/5"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
