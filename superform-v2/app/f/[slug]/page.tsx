"use client";

import { useState, useEffect, useCallback, use } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ArrowRight, Check, Lock } from "lucide-react";

interface LogicRule {
  triggerValue: string;
  action: "goto" | "submit" | "next";
  targetId?: number;
}

interface QuestionLogic {
  rules: LogicRule[];
  fallbackAction?: "next" | "submit";
}

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
  logic?: QuestionLogic;
}

interface FormRow {
  id: string;
  title: string;
  slug: string;
  questions: Question[];
  aesthetic: string;
  surface: string;
  typography: string;
  radius: string;
  grain: boolean;
  motion_intensity: string;
  transition_style: string;
  progress_style: string;
  status?: string;
}

function generateUUID() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export default function RespondentForm({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<FormRow | null>(null);

  // Simple markdown parser for rich text editing
  const renderFormattedText = (text: string) => {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<u>$1</u>");
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
      const isSafe = !url.trim().toLowerCase().startsWith("javascript:") && !url.trim().toLowerCase().startsWith("data:");
      return `<a href="${isSafe ? url : '#'}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-85 transition-opacity">${text}</a>`;
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState(0); // Index in questions array
  const [historyStack, setHistoryStack] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [responseId, setResponseId] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  
  // Custom access control and limit controls
  const [formClosed, setFormClosed] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [customClosedNotice, setCustomClosedNotice] = useState("");
  const [duplicateSubmission, setDuplicateSubmission] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  const [correctPassword, setCorrectPassword] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsTransparent(params.get("transparent") === "true");
    }
  }, []);

  // Dynamic SEO Page Title & Meta Descriptions
  useEffect(() => {
    if (form) {
      const firstQ = form.questions?.[0] as any;
      const settings = firstQ?.settings || {};
      const shareTitle = settings.seo_title || form.title || "Superform";
      const shareDesc = settings.seo_description || "Built with Superform";
      
      document.title = shareTitle;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', shareDesc);
    }
  }, [form]);

  // Fetch form from Supabase
  useEffect(() => {
    async function loadForm() {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (data) {
          const rId = generateUUID();
          setResponseId(rId);

          const firstQ = data.questions?.[0] as any;
          const settings = firstQ?.settings || {};

          // 0. Check Password Protection
          if (settings.password_protection && settings.password_protection.trim()) {
            setPasswordRequired(true);
            setCorrectPassword(settings.password_protection.trim());
            setRawQuestions(data.questions || []);
            setForm({
              ...data,
              questions: []
            } as any);
          } else {
            setForm(data as FormRow);
          }

          // 0.5 Check Duplicate Submission (One Response Per Device)
          if (settings.one_response_per_device) {
            const hasSubmitted = localStorage.getItem(`superform_submitted_${data.id}`);
            if (hasSubmitted) {
              setDuplicateSubmission(true);
              setLoading(false);
              return;
            }
          }

          // 0.6 Check Accepting Responses manual toggle
          if (settings.accepting_responses === false || settings.accepting_responses === "false") {
            setFormClosed(true);
            setCustomClosedNotice(settings.custom_closed_message || "This form is no longer accepting submissions.");
            setLoading(false);
            return;
          }

          // 0.7 Check Scheduled Close Date
          if (settings.close_at) {
            const closeDate = new Date(settings.close_at);
            if (new Date() > closeDate) {
              setFormClosed(true);
              setCustomClosedNotice(settings.custom_closed_message || "This form has successfully closed and is no longer accepting new submissions.");
              setLoading(false);
              return;
            }
          }

          // 1. Check Allowed Domains Whitelist
          const allowedDomainsStr = settings.allowed_domains || "";
          if (allowedDomainsStr.trim()) {
            const allowedList = allowedDomainsStr.split("\n").map((d: string) => d.trim().toLowerCase()).filter(Boolean);
            if (allowedList.length > 0) {
              const referrer = typeof document !== "undefined" ? document.referrer.toLowerCase() : "";
              const hasMatch = allowedList.some((d: string) => 
                referrer.includes(d) || (typeof window !== "undefined" && window.location.hostname.includes(d))
              );
              if (!hasMatch) {
                setAccessDenied(true);
                setLoading(false);
                return;
              }
            }
          }

          // 2. Check Response Cap Limit
          const responseLimitVal = settings.response_limit ? parseInt(settings.response_limit, 10) : null;
          if (responseLimitVal && responseLimitVal > 0) {
            const { count, error: countErr } = await supabase
              .from("responses")
              .select("id", { count: "exact", head: true })
              .eq("form_id", data.id);

            if (!countErr && count !== null && count >= responseLimitVal) {
              setFormClosed(true);
              setCustomClosedNotice(settings.custom_closed_message || "This form has successfully reached its maximum response ceiling and is no longer accepting new submissions.");
              setLoading(false);
              return;
            }
          }

          // Load draft from localStorage if it exists
          if (typeof window !== "undefined") {
            const draftStr = localStorage.getItem(`superform_draft_${data.id}`);
            if (draftStr) {
              try {
                const draft = JSON.parse(draftStr);
                if (draft.answers) setAnswers(draft.answers);
                if (typeof draft.activeQuestion === "number" && draft.activeQuestion < (data.questions?.length || 0)) {
                  setActiveQuestion(draft.activeQuestion);
                }
              } catch (e) {
                console.error("Failed to parse draft from localStorage:", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading form:", err);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const questions = (form?.questions || []).filter(q => q.type !== "section");
  const currentQ = questions[activeQuestion];

  const aesthetic = form?.aesthetic || "Editorial";
  const surface = form?.surface || "Card";
  const typography = form?.typography || "MD";
  const radius = form?.radius || "SM";
  const grain = form?.grain || false;
  const motionIntensity = form?.motion_intensity || "Standard";
  const transitionStyle = form?.transition_style || "Slide";
  const progressStyle = form?.progress_style || "Bar";

  const isDarkTheme = (aesthetic === "Brutalist" || aesthetic === "Cinematic") && (surface === "Flat" || surface === "Frame");
  const dur = motionIntensity === "None" ? 0 : motionIntensity === "High" ? 1 : 0.65;

  const getMotionProps = () => {
    if (motionIntensity === "None") return {
      initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 }
    };

    if (transitionStyle === "Slide") return {
      initial: { opacity: 0, y: motionIntensity === "High" ? 80 : 48 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: motionIntensity === "High" ? -48 : -28, scale: 0.97 },
      transition: {
        y: { type: "spring", stiffness: 320, damping: 28, mass: 0.8 },
        opacity: { duration: dur * 0.5, ease: "easeOut" }
      }
    };

    if (transitionStyle === "Fade") return {
      initial: { opacity: 0, scale: 0.98, filter: "blur(5px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 1.02, filter: "blur(5px)" },
      transition: { duration: dur * 0.7, ease: "easeInOut" }
    };

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

  const advance = useCallback(async () => {
    if (!currentQ || !form) return;
    const answerVal = answers[currentQ.id] || "";

    if (currentQ.required && !answerVal.trim()) return;

    const updatedAnswers = { ...answers, [currentQ.id]: answerVal };
    setAnswers(updatedAnswers);

    let isSubmit = false;
    let nextIdx = activeQuestion + 1;

    // Check branching routing rules
    if (currentQ.logic?.rules && currentQ.logic.rules.length > 0) {
      const chosenVal = answerVal.trim();
      const matchedRule = currentQ.logic.rules.find(r => r.triggerValue === chosenVal);
      if (matchedRule) {
        if (matchedRule.action === "goto" && matchedRule.targetId) {
          const targetIdx = questions.findIndex(q => q.id === matchedRule.targetId);
          if (targetIdx !== -1) {
            nextIdx = targetIdx;
          }
        } else if (matchedRule.action === "submit") {
          isSubmit = true;
        }
      }
    }

    if (activeQuestion >= questions.length - 1 || isSubmit) {
      // Form is fully complete, perform bulk database inserts now!
      try {
        const rId = responseId || generateUUID();
        const nowStr = new Date().toISOString();

        // 1. Insert Completed Response
        const { error: respError } = await supabase.from("responses").insert({
          id: rId,
          form_id: form.id,
          started_at: nowStr,
          completed_at: nowStr
        });

        if (respError) throw respError;

        // 2. Map and Bulk Insert Answers (excluding Section layouts)
        const answersToInsert = questions
          .filter(q => q.type !== "section")
          .map((q) => {
            const val = updatedAnswers[q.id] || "";
            const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
            return {
              id: generateUUID(),
              response_id: rId,
              question_id: qUuid,
              value: val,
              created_at: nowStr
            };
          });

        if (answersToInsert.length > 0) {
          const { error: ansError } = await supabase.from("answers").insert(answersToInsert);
          if (ansError) throw ansError;
        }

        // Clear draft from localStorage on successful submit
        if (typeof window !== "undefined") {
          localStorage.removeItem(`superform_draft_${form.id}`);
          localStorage.setItem(`superform_submitted_${form.id}`, "true");
        }

        // Check dynamic success action (redirect)
        const firstQ = form.questions?.[0] as any;
        const settings = firstQ?.settings || {};
        if (settings.redirect_url && typeof window !== "undefined") {
          window.location.href = settings.redirect_url;
          return;
        }

        setIsCompleted(true);
      } catch (err: any) {
        console.error("Failed to submit form responses:", err);
        const errMsg = err?.message || String(err) || "Unknown error";
        const errCode = err?.code || "";
        const errDetails = err?.details || "";
        const errHint = err?.hint || "";
        console.error("Detailed Database/Postgrest Error Details:", {
          message: errMsg,
          code: errCode,
          details: errDetails,
          hint: errHint,
          raw: err
        });
        alert(`There was an issue submitting your answers. Please try again.\n\nDetails: ${errMsg} ${errCode ? `(Code: ${errCode})` : ""}`);
      }
    } else {
      // Save draft in localStorage for incomplete session
      if (typeof window !== "undefined") {
        localStorage.setItem(`superform_draft_${form.id}`, JSON.stringify({
          answers: updatedAnswers,
          activeQuestion: nextIdx,
          historyStack: [...historyStack, activeQuestion]
        }));
      }
      setHistoryStack(prev => [...prev, activeQuestion]);
      setActiveQuestion(nextIdx);
    }
  }, [currentQ, answers, activeQuestion, questions, responseId, form, historyStack]);

  const regress = useCallback(() => {
    if (historyStack.length > 0) {
      const prevIdx = historyStack[historyStack.length - 1];
      const newStack = historyStack.slice(0, -1);
      setHistoryStack(newStack);
      setActiveQuestion(prevIdx);
      
      // Save draft update in localStorage
      if (typeof window !== "undefined" && form) {
        localStorage.setItem(`superform_draft_${form.id}`, JSON.stringify({
          answers,
          activeQuestion: prevIdx,
          historyStack: newStack
        }));
      }
    }
  }, [activeQuestion, answers, form, historyStack]);

  // Support hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        advance();
      }
      // Simple option selector keyboard listeners
      if (currentQ?.type === "multiple" && currentQ.options) {
        const keyVal = e.key.toUpperCase();
        const codeIdx = keyVal.charCodeAt(0) - 65;
        if (codeIdx >= 0 && codeIdx < currentQ.options.length) {
          setAnswers(prev => ({ ...prev, [currentQ.id]: currentQ.options![codeIdx] }));
        }
      }
      if (currentQ?.type === "yesno") {
        if (e.key.toLowerCase() === "y") setAnswers(prev => ({ ...prev, [currentQ.id]: "Yes" }));
        if (e.key.toLowerCase() === "n") setAnswers(prev => ({ ...prev, [currentQ.id]: "No" }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance, regress, currentQ]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4]">
      <div className="w-32 h-0.5 bg-[#E5E5E5] overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-[#0D0D0D] w-full animate-[slide-rule_1s_ease-in-out_infinite]" />
      </div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );

  if (!form) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] text-[#0D0D0D]">
      <div className="text-center space-y-4">
        <h1 className="font-display text-7xl tracking-wider uppercase">404</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[#888888]">Form not found or unpublished</p>
      </div>
    </div>
  );

  if (accessDenied) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] text-[#0D0D0D]">
      <div className="text-center space-y-4 max-w-md p-6">
        <h1 className="font-serif italic text-3xl">Access Denied</h1>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] leading-relaxed">This form has domain-level restrictions enabled and cannot be accessed from your location.</p>
      </div>
    </div>
  );

  if (duplicateSubmission) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] text-[#0D0D0D]">
      <div className="text-center space-y-4 max-w-md p-6">
        <h1 className="font-serif italic text-3xl">Already Submitted</h1>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] leading-relaxed">
          You have already completed and submitted this form. Multiple entries have been disabled by the creator.
        </p>
      </div>
    </div>
  );

  if (formClosed) return (
    <div className="h-screen flex items-center justify-center bg-[#FAF8F4] text-[#0D0D0D]">
      <div className="text-center space-y-4 max-w-md p-6">
        <h1 className="font-serif italic text-3xl">Form Closed</h1>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] leading-relaxed">
          {customClosedNotice || "This form has successfully closed and is no longer accepting new submissions."}
        </p>
      </div>
    </div>
  );

  if (passwordRequired && !isPasswordUnlocked) {
    const checkPassword = () => {
      if (enteredPassword === correctPassword) {
        setForm(prev => prev ? { ...prev, questions: rawQuestions } : null);
        setIsPasswordUnlocked(true);
        setPasswordError(false);
        setRawQuestions([]);
        setCorrectPassword("");
      } else {
        setPasswordError(true);
      }
    };

    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF8F4] text-[#0D0D0D]">
        <div className="w-full max-w-md bg-white border border-[#0D0D0D]/10 p-8 rounded-3xl shadow-xl flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-serif italic text-2xl font-bold">Password Protected</h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] leading-relaxed">
              This form is private. Enter the passcode to access.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="password"
              placeholder="Enter passcode"
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkPassword()}
              className="w-full bg-[#FAF8F4] border border-[#0D0D0D]/10 rounded-xl px-4 py-3 text-xs text-center outline-none focus:border-[#0D0D0D] transition-colors"
            />
            {passwordError && (
              <span className="font-mono text-[8px] uppercase tracking-widest text-red-500 font-bold">
                Incorrect passcode. Please try again.
              </span>
            )}
          </div>

          <button
            onClick={checkPassword}
            className="w-full bg-[#0D0D0D] text-[#FAF8F4] py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-bold shadow-md hover:bg-black transition-colors"
          >
            Access Form
          </button>
        </div>
      </div>
    );
  }

  const motionProps = getMotionProps();

  return (
    <div className={clsx(
      "min-h-screen flex flex-col relative overflow-hidden transition-colors duration-500",
      isTransparent ? "bg-transparent text-current" : (
        aesthetic === "Brutalist" ? "bg-black text-white" :
        aesthetic === "Cinematic" ? "bg-[#0D0D0D] text-white" :
        aesthetic === "Editorial" ? "bg-[#FAF8F4] text-[#0D0D0D]" :
        "bg-[#F5F3F0] text-[#0D0D0D]"
      )
    )}>
      {/* Film Grain */}
      {grain && (
        <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-overlay" 
          style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
      )}

      {/* Dynamic Header Overlay */}
      {!isCompleted && (
        <header className={clsx(
          "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-12 pointer-events-none transition-all duration-300",
          aesthetic === "Cinematic" ? "h-[12vh]" : "h-20"
        )}>
          {/* Left: Brand/Logo & Title */}
          <div className="flex items-center gap-3 pointer-events-auto select-none">
            <svg className="w-6 h-6 rounded-[5px] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="formSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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
                fill={isDarkTheme ? "#0D0D0D" : "url(#formSfGrad)"} 
                letterSpacing="-0.03em"
              >
                SF
              </text>
            </svg>
            <div className="flex flex-col">
              <span className={clsx(
                "font-mono text-[8px] tracking-[0.2em] uppercase opacity-40 font-bold leading-none mb-1",
                aesthetic === "Brutalist" && "opacity-100 font-black italic uppercase text-white"
              )}>
                {(form?.questions?.[0] as any)?.settings?.author_name || "Superform"}
              </span>
              <h1 className={clsx(
                "text-[10px] font-mono uppercase tracking-wider font-bold truncate max-w-[150px] sm:max-w-xs leading-none",
                aesthetic === "Editorial" && "font-serif italic capitalize normal-case text-xs tracking-normal text-current",
                aesthetic === "Cinematic" && "tracking-[0.1em] font-serif text-xs italic text-white/90",
                aesthetic === "Brutalist" && "font-mono font-black italic text-xs text-white",
                aesthetic === "Glass" && "font-serif text-xs"
              )}>
                {form.title}
              </h1>
            </div>
          </div>
        </header>
      )}

      {/* Progress Bars/Dots */}
      {progressStyle === "Bar" && !isCompleted && (
        <div className="h-[3px] w-full bg-current/10 shrink-0">
          <div className="h-full bg-current transition-all duration-500" style={{ width: `${((activeQuestion + 1) / questions.length) * 100}%` }} />
        </div>
      )}
      {progressStyle === "Fraction" && !isCompleted && (
        <div className={clsx(
          "absolute font-mono text-[10px] uppercase tracking-widest z-30 opacity-50 transition-all duration-300",
          aesthetic === "Cinematic" ? "top-[4.5vh]" : "top-8",
          "right-6 sm:right-12"
        )}>
          {activeQuestion + 1} / {questions.length}
        </div>
      )}
      {progressStyle === "Dots" && !isCompleted && (
        <div className={clsx(
          "absolute flex gap-1.5 z-30 transition-all duration-300",
          aesthetic === "Cinematic" ? "top-[5vh]" : "top-9",
          "right-6 sm:right-12"
        )}>
          {questions.map((q, idx) => (
            <div key={q.id} className={clsx(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              activeQuestion === idx ? "bg-current scale-125" : "bg-current/25"
            )} />
          ))}
        </div>
      )}

      {/* Decorative overlays */}
      <AnimatePresence mode="wait">
        {aesthetic === "Editorial" && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-8 border border-current/5" />
            <div className="absolute top-0 left-12 bottom-0 w-px bg-current/5" />
            <div className="absolute top-0 right-12 bottom-0 w-px bg-current/5" />
          </div>
        )}
        {aesthetic === "Glass" && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px]" />
          </div>
        )}
        {aesthetic === "Brutalist" && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="absolute top-0 left-0 w-1 h-full bg-white" />
            <div className="absolute bottom-0 right-0 w-full h-1 bg-white" />
            <div className="absolute bottom-0 right-0 w-1 h-full bg-white" />
          </div>
        )}
        {aesthetic === "Cinematic" && (
          <div className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between">
            <div className="h-[12vh] bg-black/90 backdrop-blur-md z-20 border-b border-white/5" />
            <div className="h-[12vh] bg-black/90 backdrop-blur-md z-20 border-t border-white/5" />
          </div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-12 z-10">
        <div 
          style={{ perspective: 1400 }}
          className={clsx(
            "w-[92%] sm:w-full max-w-2xl transition-all duration-500 mx-auto",
            surface === "Card" ? "bg-white p-6 sm:p-12 lg:p-16 rounded-xl shadow-xl border border-border/10 text-ink" : "",
            surface === "Glass" ? "bg-white/40 backdrop-blur-3xl p-6 sm:p-12 lg:p-16 rounded-xl border border-white/40 shadow-xl text-ink" : "",
            surface === "Frame" ? clsx(
              "border-2 p-6 sm:p-12 lg:p-16",
              aesthetic === "Brutalist"
                ? (isDarkTheme ? "border-white text-white" : "border-ink text-ink")
                : (isDarkTheme ? "border-white/20 text-white" : "border-ink/20 text-ink")
            ) : "",
            surface === "Flat" ? "p-6 sm:p-12 lg:p-16 text-current" : "",
            radius === "None" ? "rounded-none" : radius === "SM" ? "rounded-md" : radius === "MD" ? "rounded-xl" : radius === "Full" ? "rounded-3xl" : ""
          )}
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <h2 className={clsx(
                  "leading-tight font-serif italic mb-4",
                  isDarkTheme ? "text-white" : "text-ink",
                  aesthetic === "Minimal" && "font-sans font-bold text-4xl",
                  aesthetic === "Brutalist" && "font-mono font-black uppercase text-4xl"
                )}>
                  Thank you.
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">Your response has been registered.</p>
              </motion.div>
            ) : currentQ ? (
              <motion.div
                key={activeQuestion}
                {...motionProps}
                style={{ perspective: 1400, transformStyle: "preserve-3d" }}
                className="w-full text-left"
              >
                <div className="font-mono text-sm mb-8 opacity-40">
                  {String(activeQuestion + 1).padStart(2, "0")} →
                </div>

                <h2 className={clsx(
                  "leading-tight mb-4 transition-all duration-500",
                  isDarkTheme ? "text-white" : "text-ink",
                  aesthetic === "Minimal" && "font-sans font-bold tracking-tight text-3xl",
                  aesthetic === "Editorial" && "font-serif italic text-4xl",
                  aesthetic === "Brutalist" && "font-sans font-black uppercase tracking-tighter text-4xl leading-[0.9]",
                  aesthetic === "Cinematic" && "font-serif tracking-wide text-5xl",
                  aesthetic === "Glass" && "font-serif italic text-4xl",
                  typography === "SM" ? "text-2xl" : 
                  typography === "MD" ? "text-4xl" : 
                  typography === "LG" ? "text-5xl" : "text-6xl"
                )}>
                  {renderFormattedText(currentQ.label)}
                  {currentQ.required && <span className="text-red-500 ml-1.5">*</span>}
                </h2>

                {currentQ.description && (
                  <p className="font-sans text-sm opacity-60 mb-8 leading-relaxed">
                    {renderFormattedText(currentQ.description)}
                  </p>
                )}

                {/* Input Fields */}
                <div className="mb-10 mt-6">
                  {currentQ.type === "section" ? (
                    <div className="flex flex-col gap-4 py-4">
                      <button
                        onClick={advance}
                        className={clsx(
                          "px-8 py-4 rounded-2xl font-sans text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 hover:shadow-lg transition-all shrink-0 w-max cursor-pointer",
                          isDarkTheme ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"
                        )}
                      >
                        Begin Section
                      </button>
                    </div>
                  ) : currentQ.type === "short" || currentQ.type === "email" || currentQ.type === "phone" ? (
                    <div className={clsx(
                      "pb-3 transition-all",
                      aesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                      isDarkTheme ? (
                        aesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                      ) : (
                        aesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                      )
                    )}>
                      <input
                        type={currentQ.type === "email" ? "email" : currentQ.type === "phone" ? "tel" : "text"}
                        autoFocus
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                        placeholder={currentQ.placeholder}
                        className={clsx(
                          "w-full bg-transparent outline-none text-xl placeholder:opacity-40 font-sans",
                          aesthetic === "Brutalist" && "font-bold italic uppercase"
                        )}
                      />
                    </div>
                  ) : currentQ.type === "long" ? (
                    <div className={clsx(
                      "pb-3 transition-all",
                      aesthetic === "Brutalist" ? "border-b-[8px]" : "border-b-2",
                      isDarkTheme ? (
                        aesthetic === "Brutalist" ? "border-white" : "border-white/20 focus-within:border-white/60"
                      ) : (
                        aesthetic === "Brutalist" ? "border-ink" : "border-ink/15 focus-within:border-ink/50"
                      )
                    )}>
                      <textarea
                        autoFocus
                        rows={3}
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                        placeholder={currentQ.placeholder}
                        className="w-full bg-transparent outline-none text-xl placeholder:opacity-40 resize-none font-sans"
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
                              ? (isDarkTheme ? "bg-white text-black border-white scale-110 shadow-xl" : "bg-black text-[#FAF8F4] border-black scale-110 shadow-md")
                              : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-current/20 hover:border-current")
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
                            "px-10 py-5 rounded-2xl border transition-all font-sans text-lg font-medium shadow-sm hover:-translate-y-0.5",
                            answers[currentQ.id] === opt
                              ? (isDarkTheme ? "bg-white text-black border-white shadow-xl scale-105" : "bg-black text-[#FAF8F4] border-black shadow-md scale-105")
                              : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50" : "bg-white border-current/20 hover:border-current")
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
                      {(currentQ.options || ["Option 1", "Option 2", "Option 3"]).map((opt, oIdx) => {
                        const active = (answers[currentQ.id] || "").split(", ").map((s: string) => s.trim()).includes(opt);
                        return (
                          <button
                            key={opt}
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
                              "w-full text-left px-6 py-4 rounded-xl border transition-all font-sans flex items-center justify-between group",
                              active
                                ? (isDarkTheme ? "bg-white text-black border-white translate-x-2 shadow-xl" : "bg-black text-[#FAF8F4] border-black translate-x-2")
                                : (isDarkTheme ? "bg-white/5 border-white/20 text-white hover:border-white/50 hover:translate-x-2" : "bg-white border-current/20 hover:border-current hover:translate-x-2")
                            )}
                          >
                            <span>{opt}</span>
                            <div className={clsx(
                              "w-4 h-4 flex items-center justify-center transition-colors shrink-0",
                              currentQ.allowMultiple ? "rounded-md border" : "rounded-full border",
                              active ? "bg-current border-transparent" : "border-current/30 group-hover:border-current"
                            )}>
                              {active && (
                                currentQ.allowMultiple 
                                  ? <Check className={clsx("w-2.5 h-2.5", isDarkTheme ? "text-black" : "text-white")} />
                                  : <div className={clsx("w-1.5 h-1.5 rounded-full", isDarkTheme ? "bg-black" : "bg-white")} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Continue Actions */}
                <div className="flex items-center gap-3">
                  {activeQuestion > 0 && (
                    <button
                      type="button"
                      onClick={regress}
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
                  <button
                    onClick={advance}
                    className={clsx(
                      "px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-colors",
                      isDarkTheme ? "bg-white text-black hover:bg-white/90" : "bg-black text-[#FAF8F4] hover:bg-black/90",
                      radius === "SM" ? "rounded-sm" : radius === "MD" ? "rounded-md" : radius === "Full" ? "rounded-full" : "rounded-none"
                    )}
                  >
                    {currentQ.buttonText ? currentQ.buttonText : (activeQuestion === questions.length - 1 ? "Submit" : "Continue")} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Press Enter ↵</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className={clsx(
        "absolute bottom-6 right-6 font-mono text-[9px] opacity-40 z-20"
      )}>
        Built with Superform
      </div>
    </div>
  );
}
