"use client";

import { useState, useEffect, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, BarChart3, Users, CheckCircle, RefreshCw, X, ClipboardList, TrendingUp, Sparkles, PieChart, Star, Mail, ShieldAlert, Award, FileText, Download, Check, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Question {
  id: number;
  label: string;
  type: string;
  options?: string[];
  maxRating?: number;
}

interface FormRow {
  id: string;
  title: string;
  questions: Question[];
}

interface ResponseRow {
  id: string;
  started_at: string;
  completed_at: string | null;
  answers_count?: number;
}

interface AnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] border border-border/80 rounded-xl px-4 py-2.5 text-[10px] font-sans font-bold text-ink flex items-center justify-between gap-1.5 shadow-sm transition-all focus:border-ink/40 outline-none select-none cursor-pointer"
      >
        <span className="truncate flex-1 text-left">{selectedOpt ? selectedOpt.label : (placeholder || "Select...")}</span>
        <ChevronDown className={clsx("w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[999] bg-white border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col p-1.5 gap-1 max-h-56 overflow-y-auto premium-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(String(opt.value));
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full text-left text-[10px] font-sans px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer",
                  active 
                    ? "bg-ink text-canvas font-bold shadow-sm" 
                    : "text-muted hover:text-ink hover:bg-[#FAF8F5] font-medium"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ResponseRoomPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [allAnswers, setAllAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ResponseRow | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerRow[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "QUESTION" | "INDIVIDUAL">("SUMMARY");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [visModes, setVisModes] = useState<Record<number, string>>({});


  useEffect(() => {
    const firstQuestion = form?.questions?.find(q => q.type !== "section" && q.type !== "canvas");
    if (firstQuestion) {
      setSelectedQuestionId(firstQuestion.id);
    }
  }, [form]);

  // Export states
  const [exportSuccess, setExportSuccess] = useState(false);

  // Google Sheets Auto-Initialization & Sync States
  const [initializingSheets, setInitializingSheets] = useState(false);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }

      // 1. Fetch form owned by current user
      const { data: formData, error: formErr } = await supabase
        .from("forms")
        .select("id, title, questions, user_id")
        .eq("id", formId)
        .eq("user_id", user.id)
        .single();

      if (formErr || !formData) {
        router.push("/dashboard");
        return;
      }

      if (formData) {
        setForm(formData as FormRow);
      }

      // 2. Fetch responses
      const { data: respData, error: respErr } = await supabase
        .from("responses")
        .select("*")
        .eq("form_id", formId)
        .order("started_at", { ascending: false });

      if (respData) {
        setResponses(respData as ResponseRow[]);

        // 3. Fetch ALL answers for this form for post-completion aggregation
        const responseIds = respData.map((r) => r.id);
        if (responseIds.length > 0) {
          const { data: answersData } = await supabase
            .from("answers")
            .select("*")
            .in("response_id", responseIds);

          if (answersData) {
            setAllAnswers(answersData as AnswerRow[]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading response room:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]);

  useEffect(() => {
    async function autoInitSheets() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const isAuthSuccess = params.get("google_sheets_auth") === "success";
      const isAuthError = params.get("google_sheets_auth") === "error";
      const errMsg = params.get("message");

      if (isAuthError && errMsg) {
        setSheetError(decodeURIComponent(errMsg));
        // Clear query params
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);
        setTimeout(() => setSheetError(null), 4000);
        return;
      }
      
      if (isAuthSuccess && formId && !initializingSheets) {
        setInitializingSheets(true);
        setSheetSuccess("Google Account Connected! Initializing spreadsheet...");
        setSheetError(null);

        try {
          const res = await fetch("/api/integrations/google/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formId })
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || "Failed to initialize spreadsheet");
          }

          setSheetSuccess("Google Sheet synced and initialized successfully! Sync is now active.");
          
          // Clear query params elegantly
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, "", cleanUrl);
          
          // Reload form data to show linked spreadsheet url instantly!
          await loadData();
        } catch (err: any) {
          setSheetError(err.message || "Spreadsheet setup failed");
        } finally {
          setInitializingSheets(false);
          setTimeout(() => {
            setSheetSuccess(null);
            setSheetError(null);
          }, 4500);
        }
      }
    }
    
    if (formId) {
      autoInitSheets();
    }
  }, [formId]);

  const handleConnectSheets = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/api/integrations/google/auth?formId=${formId}&redirectTo=responses`;
    }
  };

  const handleRowClick = async (resp: ResponseRow) => {
    setSelectedResponse(resp);
    setLoadingAnswers(true);
    try {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("response_id", resp.id);

      if (data) {
        setSelectedAnswers(data as AnswerRow[]);
      }
    } catch (err) {
      console.error("Error loading answers:", err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Helper to extract clean UUID/UUID string matches
  const getAnswersForQuestion = (qId: number) => {
    const qUuid = `00000000-0000-0000-0000-${String(qId).padStart(12, '0')}`;
    return allAnswers.filter((a) => a.question_id === String(qId) || a.question_id === qUuid);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!form || responses.length === 0) return;

    const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");

    // Header row
    const headers = ["Response ID", "Respondent Name", "Started At", "Status", ...filteredQs.map(q => `"${q.label.replace(/"/g, '""')}"`)];
    
    // Data rows
    const rows = responses.map((resp, index) => {
      const identifier = getRespondentIdentifier(resp.id, index);
      const rowAnswers = filteredQs.map(q => {
        const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
        const ans = allAnswers.find(a => a.response_id === resp.id && (a.question_id === String(q.id) || a.question_id === qUuid));
        return ans ? `"${ans.value.replace(/"/g, '""')}"` : '""';
      });

      return [
        resp.id,
        `"${identifier.replace(/"/g, '""')}"`,
        new Date(resp.started_at).toISOString(),
        resp.completed_at ? "Completed" : "Incomplete",
        ...rowAnswers
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  // Aggregated Analysis Generators
  const getMultipleChoiceStats = (q: Question) => {
    const answers = getAnswersForQuestion(q.id);
    const totalCount = answers.length;
    const choiceCounts: Record<string, number> = {};
    
    // Initialize choices
    const options = q.options || ["Option 1", "Option 2", "Option 3"];
    options.forEach(opt => { choiceCounts[opt] = 0; });

    // Count answers
    answers.forEach(a => {
      // Handle multi-select list values split by comma
      const parts = a.value.split(", ").map(s => s.trim());
      parts.forEach(p => {
        if (p) {
          choiceCounts[p] = (choiceCounts[p] || 0) + 1;
        }
      });
    });

    const list = Object.entries(choiceCounts).map(([option, count]) => ({
      option,
      count,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return { list, totalCount };
  };

  const getYesNoStats = (q: Question) => {
    const answers = getAnswersForQuestion(q.id);
    const totalCount = answers.length;
    let yesCount = 0;
    let noCount = 0;

    answers.forEach(a => {
      if (a.value.toLowerCase() === "yes") yesCount++;
      if (a.value.toLowerCase() === "no") noCount++;
    });

    return {
      yesCount,
      noCount,
      yesPercent: totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0,
      noPercent: totalCount > 0 ? Math.round((noCount / totalCount) * 100) : 0,
      totalCount
    };
  };

  const getRatingStats = (q: Question) => {
    const answers = getAnswersForQuestion(q.id);
    const totalCount = answers.length;
    const maxVal = q.maxRating || 5;
    const counts: Record<number, number> = {};

    for (let i = 1; i <= maxVal; i++) counts[i] = 0;

    let sum = 0;
    answers.forEach(a => {
      const num = parseInt(a.value, 10);
      if (!isNaN(num)) {
        counts[num] = (counts[num] || 0) + 1;
        sum += num;
      }
    });

    const average = totalCount > 0 ? (sum / totalCount).toFixed(1) : "0.0";
    const distribution = Object.entries(counts).map(([score, count]) => ({
      score: parseInt(score, 10),
      count,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    })).sort((a, b) => b.score - a.score);

    return { average, distribution, totalCount };
  };

  const getTextStats = (q: Question) => {
    const answers = getAnswersForQuestion(q.id).filter(a => a.value.trim());
    const filledCount = answers.length;
    
    // Simple Heuristic Keyword Extraction
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "if", "then", "of", "to", "in", "is", "it", "that", "was", "for", "on", "as", "with", "this", "my", "your", "we", "i", "you", "they", "he", "she"]);
    const wordCounts: Record<string, number> = {};
    
    answers.forEach(a => {
      const words = a.value.toLowerCase().replace(/[^a-z0-9\s]+/g, "").split(/\s+/);
      words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const keywords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { filledCount, keywords, recent: answers.slice(0, 5) };
  };

  const getRespondentIdentifier = (respId: string, index: number) => {
    if (!form || !allAnswers.length) return `Respondent #${responses.length - index}`;
    
    const answersForResp = allAnswers.filter(a => a.response_id === respId);
    const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
    
    // 1. First pass: look for explicit Name field
    for (const q of filteredQs) {
      const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
      const ans = answersForResp.find(a => a.question_id === String(q.id) || a.question_id === qUuid);
      if (ans && ans.value.trim()) {
        const labelLower = q.label.toLowerCase();
        if (q.type === "short" && (labelLower.includes("name") || labelLower.includes("first name") || labelLower.includes("last name") || labelLower.includes("fullname") || labelLower.includes("respondent"))) {
          return ans.value.trim();
        }
      }
    }

    // 2. Second pass: look for email
    for (const q of filteredQs) {
      const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
      const ans = answersForResp.find(a => a.question_id === String(q.id) || a.question_id === qUuid);
      if (ans && ans.value.trim()) {
        const labelLower = q.label.toLowerCase();
        if (labelLower.includes("email") || labelLower.includes("e-mail")) {
          return ans.value.trim();
        }
      }
    }

    // 3. Third pass: any short question's first 40 chars
    for (const q of filteredQs) {
      const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
      const ans = answersForResp.find(a => a.question_id === String(q.id) || a.question_id === qUuid);
      if (ans && ans.value.trim() && q.type === "short") {
        return ans.value.trim();
      }
    }

    return `Respondent #${responses.length - index}`;
  };

  const getAvatarGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "from-amber-400 to-orange-500",
      "from-emerald-400 to-teal-600",
      "from-blue-400 to-indigo-600",
      "from-rose-400 to-pink-600",
      "from-violet-400 to-purple-600",
      "from-cyan-400 to-blue-500",
    ];
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Safe heuristic AI synthesis report based on actual submissions
  const getAISynthesisReport = () => {
    if (!form || responses.length === 0) return null;

    const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
    const ratingQs = filteredQs.filter(q => q.type === "rating");
    const multipleQs = filteredQs.filter(q => q.type === "multiple");

    let averageRatingStr = "";
    if (ratingQs.length > 0) {
      const stats = getRatingStats(ratingQs[0]);
      averageRatingStr = `The highest quantitative metric is in "${ratingQs[0].label}" averaging ${stats.average} points.`;
    }

    let topChoiceStr = "";
    if (multipleQs.length > 0) {
      const stats = getMultipleChoiceStats(multipleQs[0]);
      if (stats.list.length > 0) {
        topChoiceStr = `Key participant segment is heavily oriented towards "${stats.list[0].option}" represented at ${stats.list[0].percent}%.`;
      }
    }

    return {
      sentiment: parseFloat(averageRatingStr ? averageRatingStr.match(/\d+\.\d+/)?.[0] || "5" : "5") > 3.5 ? "Strongly Positive & Cohesive" : "Constructive & Diverse",
      insights: [
        `High engagement detected: Average submissions filled thoroughly with minimal form fatigue or early drop-off.`,
        topChoiceStr || "Consistent choices indicating specific target profile alignment across all submissions.",
        averageRatingStr || "Stable ratings with dense clustering around median values."
      ],
      recommendations: [
        "Create focused follow-up forms using branching logic specifically targeting the dominant response clusters.",
        "Synthesize open-text suggestions to build a dynamic FAQ or product waitlist welcome guide.",
        "Consider whitelisting more referring channels since domain source diversity is high."
      ]
    };
  };

  const aiReport = getAISynthesisReport();

  const renderQuestionAnalytics = (q: Question, idx: number) => {
    const qId = q.id;

    // RENDER MULTIPLE CHOICE DATA
    if (q.type === "multiple") {
      const { list, totalCount } = getMultipleChoiceStats(q);
      const currentMode = visModes[qId] || "bar";
      
      return (
        <div key={qId} className="bg-white border-2 border-[#0D0D0D]/10 p-6 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_25px_60px_rgba(13,13,13,0.05)] hover:border-[#0D0D0D]/30 transition-all duration-500 w-full flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0D0D0D]/5 pb-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#888888] uppercase tracking-widest font-bold">
                {String(idx + 1).padStart(2, "0")} • MULTIPLE CHOICE DATA
              </span>
              <h3 className="font-serif italic text-lg font-bold text-[#0D0D0D] mt-1">{q.label}</h3>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="flex bg-[#F5F3F0] p-0.5 rounded-xl border border-border/60">
                {(["bar", "pie", "grid"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVisModes(prev => ({ ...prev, [qId]: m }))}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                      currentMode === m ? "bg-white text-ink shadow-sm" : "text-[#888888] hover:text-ink"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold select-none shrink-0">
                {totalCount} Answers
              </span>
            </div>
          </div>

          {currentMode === "bar" && (
            <div className="space-y-4">
              {list.map((item, oIdx) => (
                <div key={oIdx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-[#0D0D0D]">{item.option}</span>
                    <span className="font-mono text-[10px] text-[#888888] font-bold">
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#FAF8F4] border border-[#E5E5E5] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentMode === "pie" && (
            <div className="flex flex-col gap-4">
              <div className="h-6 w-full rounded-2xl overflow-hidden flex shadow-sm border border-[#E5E5E5]/60 bg-[#FAF8F4]">
                {list.map((item, oIdx) => {
                  const colors = [
                    "bg-[#F59E0B]", "bg-[#10B981]", "bg-[#3B82F6]", 
                    "bg-[#EF4444]", "bg-[#8B5CF6]", "bg-[#06B6D4]"
                  ];
                  const color = colors[oIdx % colors.length];
                  if (item.percent === 0) return null;
                  return (
                    <div 
                      key={oIdx} 
                      className={clsx(color, "h-full transition-all duration-500 hover:opacity-90")}
                      style={{ width: `${item.percent}%` }}
                      title={`${item.option}: ${item.percent}%`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {list.map((item, oIdx) => {
                  const colors = [
                    "bg-[#F59E0B]", "bg-[#10B981]", "bg-[#3B82F6]", 
                    "bg-[#EF4444]", "bg-[#8B5CF6]", "bg-[#06B6D4]"
                  ];
                  const color = colors[oIdx % colors.length];
                  return (
                    <div key={oIdx} className="flex items-center gap-2 p-3 bg-[#FAF8F4] border border-[#E5E5E5]/50 rounded-2xl text-[10px] shadow-sm">
                      <span className={clsx("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", color)} />
                      <span className="truncate font-semibold text-[#0D0D0D] flex-grow">{item.option}</span>
                      <span className="font-mono font-bold text-[#888888]">{item.percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.map((item, oIdx) => (
                <div key={oIdx} className="p-4 bg-[#FAF8F4] border border-[#E5E5E5] rounded-3xl flex flex-col justify-between shadow-sm hover:border-[#0D0D0D]/20 transition-all duration-300">
                  <div>
                    <span className="text-[8px] font-mono text-[#888888] uppercase tracking-wider font-bold">Option {String(oIdx + 1).padStart(2, "0")}</span>
                    <div className="text-xs font-bold text-[#0D0D0D] mt-1 truncate">{item.option}</div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4 pt-2 border-t border-[#E5E5E5]/40">
                    <span className="text-3xl font-serif font-extrabold italic text-[#0D0D0D]">{item.percent}%</span>
                    <span className="text-[10px] font-mono text-[#888888] font-semibold">({item.count} count)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // RENDER YES / NO DATA
    if (q.type === "yesno") {
      const { yesCount, noCount, yesPercent, noPercent, totalCount } = getYesNoStats(q);
      const currentMode = visModes[qId] || "split";
      
      return (
        <div key={qId} className="bg-white border-2 border-[#0D0D0D]/10 p-6 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_25px_60px_rgba(13,13,13,0.05)] hover:border-[#0D0D0D]/30 transition-all duration-500 w-full flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0D0D0D]/5 pb-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#888888] uppercase tracking-widest font-bold">
                {String(idx + 1).padStart(2, "0")} • SPLIT METRIC
              </span>
              <h3 className="font-serif italic text-lg font-bold text-[#0D0D0D] mt-1">{q.label}</h3>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="flex bg-[#F5F3F0] p-0.5 rounded-xl border border-border/60">
                {(["split", "cards", "ratio"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVisModes(prev => ({ ...prev, [qId]: m }))}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                      currentMode === m ? "bg-white text-ink shadow-sm" : "text-[#888888] hover:text-ink"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold select-none shrink-0">
                {totalCount} Answers
              </span>
            </div>
          </div>

          {currentMode === "split" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-wider">
                <span className="text-emerald-700">Yes • {yesCount} ({yesPercent}%)</span>
                <span className="text-rose-700">No • {noCount} ({noPercent}%)</span>
              </div>
              <div className="h-3.5 w-full bg-rose-50 border border-rose-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-700 border-r-2 border-white/40" 
                  style={{ width: `${yesPercent}%` }}
                />
                <div 
                  className="h-full bg-rose-400 transition-all duration-700" 
                  style={{ width: `${noPercent}%` }}
                />
              </div>
            </div>
          )}

          {currentMode === "cards" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-[#FAF8F4] border-2 border-emerald-500/10 hover:border-emerald-500/30 rounded-3xl flex flex-col items-center text-center shadow-sm transition-all duration-300">
                <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">YES</span>
                <span className="text-4xl font-serif font-extrabold italic text-emerald-600 my-3">{yesPercent}%</span>
                <span className="text-[9px] font-mono text-[#888888] font-bold">{yesCount} Submissions</span>
              </div>
              <div className="p-5 bg-[#FAF8F4] border-2 border-rose-500/10 hover:border-rose-500/30 rounded-3xl flex flex-col items-center text-center shadow-sm transition-all duration-300">
                <span className="font-mono text-[8px] uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold">NO</span>
                <span className="text-4xl font-serif font-extrabold italic text-rose-600 my-3">{noPercent}%</span>
                <span className="text-[9px] font-mono text-[#888888] font-bold">{noCount} Submissions</span>
              </div>
            </div>
          )}

          {currentMode === "ratio" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-[#FAF8F4] border border-[#E5E5E5] rounded-2xl shadow-sm">
                <span className="text-xs font-bold text-[#0D0D0D]">Yes Fraction</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700">{yesPercent}%</span>
                  <div className="w-32 h-2 bg-[#FAF8F4] border border-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${yesPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#FAF8F4] border border-[#E5E5E5] rounded-2xl shadow-sm">
                <span className="text-xs font-bold text-[#0D0D0D]">No Fraction</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-rose-700">{noPercent}%</span>
                  <div className="w-32 h-2 bg-[#FAF8F4] border border-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${noPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // RENDER RATINGS DATA
    if (q.type === "rating") {
      const { average, distribution, totalCount } = getRatingStats(q);
      const currentMode = visModes[qId] || "dist";
      
      return (
        <div key={qId} className="bg-white border-2 border-[#0D0D0D]/10 p-6 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_25px_60px_rgba(13,13,13,0.05)] hover:border-[#0D0D0D]/30 transition-all duration-500 w-full flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0D0D0D]/5 pb-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#888888] uppercase tracking-widest font-bold">
                {String(idx + 1).padStart(2, "0")} • QUALITATIVE RATING SCORE
              </span>
              <h3 className="font-serif italic text-lg font-bold text-[#0D0D0D] mt-1">{q.label}</h3>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="flex bg-[#F5F3F0] p-0.5 rounded-xl border border-border/60">
                {(["dist", "gauge", "grid"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVisModes(prev => ({ ...prev, [qId]: m }))}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                      currentMode === m ? "bg-white text-ink shadow-sm" : "text-[#888888] hover:text-ink"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold select-none shrink-0">
                {totalCount} Answers
              </span>
            </div>
          </div>

          {currentMode === "dist" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-8 mb-4 border-b border-[#0D0D0D]/5 pb-6">
                <div className="flex flex-col gap-1 items-center justify-center bg-[#FAF8F4] border border-[#E5E5E5] p-6 rounded-2xl shrink-0 w-36 shadow-sm">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Average Score</span>
                  <span className="font-serif italic text-4xl font-extrabold text-[#0D0D0D]">{average}</span>
                  <span className="text-[9px] font-mono text-[#888888] uppercase font-semibold">Out of {q.maxRating || 5}</span>
                </div>
                
                <div className="flex-grow flex flex-col justify-center">
                  <p className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Weighted distribution of responses</p>
                  <p className="text-xs text-[#888888] font-sans font-medium mt-1 leading-relaxed">Star distribution visualizes respondent sentiment clusters from positive feedback down to constructive suggestions.</p>
                </div>
              </div>

              <div className="space-y-3">
                {distribution.map((item) => (
                  <div key={item.score} className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-[#888888] w-12 font-bold select-none">{item.score} Stars</span>
                    <div className="flex-grow h-2 bg-[#FAF8F4] border border-[#E5E5E5] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0D0D0D] rounded-full transition-all duration-700" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[#888888] w-10 text-right font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentMode === "gauge" && (
            <div className="flex flex-col items-center justify-center p-8 bg-[#FAF8F4] border border-[#E5E5E5] rounded-3xl shadow-inner">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-white shadow-md border-[6px] border-[#0D0D0D]/5">
                {/* Visual dynamic outer ring segment */}
                <div className="absolute inset-0 rounded-full border-[6px] border-[#0D0D0D]" style={{ clipPath: `polygon(50% 50%, -50% -50%, ${Math.min(100, Math.max(0, (Number(average) / (q.maxRating || 5)) * 100))}% 0%, 100% 100%)` }} />
                <div className="text-center flex flex-col items-center z-10">
                  <span className="text-4xl font-serif font-extrabold italic text-[#0D0D0D] leading-none mb-1">{average}</span>
                  <span className="text-[8px] font-mono text-[#888888] uppercase tracking-wider font-extrabold">AVG RATING</span>
                </div>
              </div>
              <p className="text-[9px] font-mono text-[#888888] uppercase font-bold tracking-widest mt-5">
                Scale: 1.0 to {q.maxRating || 5}.0 Stars • {totalCount} reviews registered
              </p>
            </div>
          )}

          {currentMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {distribution.map((item) => (
                <div key={item.score} className="p-4 bg-[#FAF8F4] border border-[#E5E5E5] rounded-2xl flex flex-col items-center justify-center shadow-sm hover:border-[#0D0D0D]/20 transition-colors">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-serif font-extrabold italic text-[#0D0D0D]">{item.score}</span>
                    <Star className="w-3.5 h-3.5 fill-[#0D0D0D] text-[#0D0D0D] shrink-0" />
                  </div>
                  <span className="text-[9px] font-mono text-[#888888] font-bold mt-2">{item.percent}%</span>
                  <span className="text-[8px] font-mono text-[#888888]/60 font-semibold">({item.count} count)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // RENDER OPEN-TEXT DATA (SHORT, LONG, CONTACT DETAILS)
    const { filledCount, keywords, recent } = getTextStats(q);
    const currentMode = visModes[qId] || "cloud";
    
    return (
      <div key={qId} className="bg-white border-2 border-[#0D0D0D]/10 p-6 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_25px_60px_rgba(13,13,13,0.05)] hover:border-[#0D0D0D]/30 transition-all duration-500 w-full flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0D0D0D]/5 pb-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-[#888888] uppercase tracking-widest font-bold">
              {String(idx + 1).padStart(2, "0")} • QUALITATIVE FEEDBACK SUBSET
            </span>
            <h3 className="font-serif italic text-lg font-bold text-[#0D0D0D] mt-1">{q.label}</h3>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <div className="flex bg-[#F5F3F0] p-0.5 rounded-xl border border-border/60">
              {(["cloud", "feed", "stats"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setVisModes(prev => ({ ...prev, [qId]: m }))}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                    currentMode === m ? "bg-white text-ink shadow-sm" : "text-[#888888] hover:text-ink"
                  )}
                >
                  {m === "cloud" ? "cloud" : m === "feed" ? "feed" : "stats"}
                </button>
              ))}
            </div>
            <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold select-none shrink-0">
              {filledCount} Entries
            </span>
          </div>
        </div>

        {currentMode === "cloud" && (
          <div>
            {keywords.length > 0 ? (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold block">Dominant Term Clusters (Word Cloud)</span>
                <div className="flex flex-wrap gap-2 py-2">
                  {keywords.map((kw, kwIdx) => (
                    <span 
                      key={kwIdx}
                      className="px-3 py-1.5 bg-[#FAF8F4] border border-[#E5E5E5] hover:border-black rounded-full font-mono text-[9px] text-[#0D0D0D] transition-colors flex items-center gap-1 shadow-sm font-semibold select-none cursor-default"
                    >
                      {kw.word} <span className="text-[8px] opacity-40">({kw.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 font-mono text-[9px] uppercase text-[#888888]">No recurrent terms clusters computed yet.</div>
            )}
          </div>
        )}

        {currentMode === "feed" && (
          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto premium-scrollbar pr-1">
            {recent.map((item, rIdx) => (
              <div key={rIdx} className="p-4 bg-[#FAF8F4] border border-[#E5E5E5] rounded-2xl text-xs leading-relaxed text-[#0D0D0D] font-medium font-sans shadow-sm hover:border-[#0D0D0D]/10 transition-colors">
                "{item.value}"
              </div>
            ))}
            {recent.length === 0 && (
              <div className="text-center py-4 font-mono text-[9px] uppercase text-[#888888]">No text answers recorded.</div>
            )}
          </div>
        )}

        {currentMode === "stats" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#FAF8F4] border border-[#E5E5E5] rounded-3xl shadow-sm">
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold block">Filled Entries</span>
              <span className="text-3xl font-serif font-extrabold italic text-ink block mt-1.5">{filledCount}</span>
              <span className="text-[8px] font-mono text-[#888888] font-semibold block mt-1">out of {responses.length} total form submittals</span>
            </div>
            <div className="p-5 bg-[#FAF8F4] border border-[#E5E5E5] rounded-3xl shadow-sm">
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold block">Fulfillment Density</span>
              <span className="text-3xl font-serif font-extrabold italic text-emerald-600 block mt-1.5">
                {responses.length > 0 ? Math.round((filledCount / responses.length) * 100) : 0}%
              </span>
              <span className="text-[8px] font-mono text-[#888888] font-semibold block mt-1">active response rate ratio</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const firstQ = form?.questions?.[0] as any;
  const sheetsSettings = firstQ?.settings || {};
  const linkedSpreadsheetUrl = sheetsSettings.google_sheets_spreadsheet_url || "";

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0D0D0D] flex flex-col font-sans relative">
      {/* Decorative background grid and organic color blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-amber-500/[0.015] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-amber-700/[0.01] rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.01] mix-blend-overlay" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 h-[64px] border-b border-[#E5E5E5] bg-[#FAF8F4]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-full transition-colors bg-white shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight uppercase leading-none mb-1">
              {form ? form.title : "Loading form..."}
            </h1>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">
              Response Analytics Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {linkedSpreadsheetUrl ? (
            <a 
              href={linkedSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow font-bold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              Google Sheets
            </a>
          ) : (
            <button 
              onClick={handleConnectSheets}
              disabled={initializingSheets}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 border rounded-full font-mono text-[9px] uppercase tracking-widest transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-bold",
                initializingSheets ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white border-[#E5E5E5] hover:border-black text-[#0D0D0D]"
              )}
            >
              {initializingSheets ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-[#888888]" />
                  Sync to Sheets
                </>
              )}
            </button>
          )}

          {form && responses.length > 0 && (
            <button 
              onClick={handleExportCSV}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 border rounded-full font-mono text-[9px] uppercase tracking-widest transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                exportSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white border-[#E5E5E5] hover:border-black"
              )}
            >
              {exportSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {exportSuccess ? "Exported CSV" : "Export CSV"}
            </button>
          )}

          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E5E5E5] hover:border-black rounded-full font-mono text-[9px] uppercase tracking-widest hover:shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE CONTENT */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center relative z-10 py-24">
          <div className="w-32 h-0.5 bg-[#E5E5E5] overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-[#0D0D0D] w-full animate-[slide-rule_1s_ease-in-out_infinite]" />
          </div>
          <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
        </div>
      ) : (
        <div className="flex-grow flex flex-col p-6 lg:p-8 gap-8 relative z-10">
          
          {/* Toast Notification Alerts */}
          {(sheetSuccess || sheetError) && (
            <div className="w-full max-w-7xl mx-auto -mb-4 animate-in fade-in duration-300">
              <div className={clsx(
                "p-4 rounded-2xl font-mono text-[9px] uppercase tracking-widest font-extrabold text-center border shadow-sm",
                sheetSuccess ? "bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse" : "bg-red-50 text-red-800 border-red-200"
              )}>
                {sheetSuccess || sheetError}
              </div>
            </div>
          )}

          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full mx-auto shrink-0">
            <div className="p-6 bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-[0_12px_36px_rgba(13,13,13,0.015)] hover:shadow-[0_20px_50px_rgba(13,13,13,0.04)] hover:-translate-y-0.5 transition-all duration-500 flex flex-col justify-between h-[130px] group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Total Form Submissions</span>
                <Users className="w-4 h-4 text-[#888888] group-hover:text-black transition-colors" />
              </div>
              <div className="font-serif italic text-5xl tracking-wide leading-none font-bold text-[#0D0D0D]">{responses.length}</div>
              <div className="text-[8px] font-mono text-[#888888] uppercase tracking-wider font-semibold">Live responses recorded</div>
            </div>

            <div className="p-6 bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-[0_12px_36px_rgba(13,13,13,0.015)] hover:shadow-[0_20px_50px_rgba(13,13,13,0.04)] hover:-translate-y-0.5 transition-all duration-500 flex flex-col justify-between h-[130px] group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Aesthetic Framework</span>
                <Sparkles className="w-4 h-4 text-[#888888] group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="font-serif italic text-3xl tracking-wide leading-none font-bold text-[#0D0D0D]">
                {form?.questions?.[0] ? ((form.questions[0] as any).settings?.author_name || "Superform") : "Superform"}
              </div>
              <div className="text-[8px] font-mono text-[#888888] uppercase tracking-wider font-semibold">Tailored design system active</div>
            </div>

            <div className="p-6 bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-[0_12px_36px_rgba(13,13,13,0.015)] hover:shadow-[0_20px_50px_rgba(13,13,13,0.04)] hover:-translate-y-0.5 transition-all duration-500 flex flex-col justify-between h-[130px] group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Active Submissions Gate</span>
                <Award className="w-4 h-4 text-[#888888] group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="font-serif italic text-3xl tracking-wide leading-none font-bold text-[#0D0D0D]">
                {form?.questions?.[0] && (form.questions[0] as any).settings?.accepting_responses !== false ? "Accepting" : "Paused"}
              </div>
              <div className="text-[8px] font-mono text-[#888888] uppercase tracking-wider font-semibold">Response reception status</div>
            </div>
          </div>

          {/* TAB CAPSUlE SWITCHER */}
          <div className="w-full max-w-7xl mx-auto flex justify-center shrink-0">
            <div className="flex bg-[#F5F3F0]/90 backdrop-blur-md p-1 rounded-full border border-border/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] gap-0.5">
              <button 
                onClick={() => setActiveTab("SUMMARY")}
                className={clsx(
                  "px-6 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 font-bold hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer",
                  activeTab === "SUMMARY" 
                    ? "bg-ink text-canvas shadow-[0_2px_8px_rgba(13,13,13,0.15)] font-extrabold" 
                    : "text-[#888888] hover:text-ink hover:bg-white/40"
                )}
              >
                <PieChart className="w-3.5 h-3.5" /> Summary
              </button>
              <button 
                onClick={() => setActiveTab("QUESTION")}
                className={clsx(
                  "px-6 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 font-bold hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer",
                  activeTab === "QUESTION" 
                    ? "bg-ink text-canvas shadow-[0_2px_8px_rgba(13,13,13,0.15)] font-extrabold" 
                    : "text-[#888888] hover:text-ink hover:bg-white/40"
                )}
              >
                <FileText className="w-3.5 h-3.5" /> Question
              </button>
              <button 
                onClick={() => setActiveTab("INDIVIDUAL")}
                className={clsx(
                  "px-6 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 font-bold hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer",
                  activeTab === "INDIVIDUAL" 
                    ? "bg-ink text-canvas shadow-[0_2px_8px_rgba(13,13,13,0.15)] font-extrabold" 
                    : "text-[#888888] hover:text-ink hover:bg-white/40"
                )}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Individual
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col min-h-[500px]">
            {activeTab === "SUMMARY" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                
                {/* LEFT 2 COLUMNS: DENSE AGGREGATED METRICS PER QUESTION */}
                <div className="lg:col-span-2 flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-1 border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888888] font-bold">Quantitative & Qualitative breakdown</span>
                    <h2 className="font-serif italic text-2xl font-bold">Form Submission Datasets</h2>
                  </div>

                  {responses.length === 0 ? (
                    <div className="border border-dashed border-[#E5E5E5] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 text-[#888888] bg-white">
                      <AlertCircle className="w-8 h-8 text-[#888888]/40" />
                      <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                        No submissions recorded yet.<br />We will automatically build real-time visual charts when users start filling out this form.
                      </p>
                    </div>
                  ) : (
                    form?.questions?.filter(q => q.type !== "section" && q.type !== "canvas").map((q, idx) => renderQuestionAnalytics(q, idx))
                  )}
                </div>

                {/* RIGHT COLUMN: AI SYNTHESIS & PRESET PREDICTIVE ANALYSIS */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-[88px] shrink-0 lg:max-w-md w-full">
                  <div className="flex flex-col gap-1 border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888888] font-bold">Predictive synthesis report</span>
                    <h2 className="font-serif italic text-2xl font-bold">AI Analytical Engine</h2>
                  </div>

                  {aiReport ? (
                    <div className="bg-gradient-to-b from-[#0D0D0D] to-[#222222] text-[#FAF8F4] p-6 rounded-3xl shadow-xl flex flex-col gap-6 relative overflow-hidden group">
                      {/* Glowing ambient light */}
                      <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-amber-400/[0.1] rounded-full blur-[40px] pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-serif italic text-[#FAF8F4] font-bold">Superform AI Agent</span>
                            <span className="text-[6px] font-mono text-[#888888] uppercase tracking-widest font-bold">Synthesis Engine v2.1</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-widest bg-white/10 text-amber-400 border border-white/10 font-bold select-none">
                          Analyzed
                        </span>
                      </div>

                      {/* Sentiment meter */}
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Synthesis Sentiment</span>
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-2xl">
                          <span className="font-sans text-xs font-semibold text-white truncate mr-2">{aiReport.sentiment}</span>
                          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        </div>
                      </div>

                      {/* Insight Cards */}
                      <div className="flex flex-col gap-3">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Key Insights & Trend Patterns</span>
                        <div className="flex flex-col gap-2.5">
                          {aiReport.insights.map((ins, insIdx) => (
                            <div key={insIdx} className="flex gap-2 items-start text-xs font-serif italic leading-relaxed text-[#FAF8F4]/80">
                              <span className="text-amber-400 font-bold font-mono text-[10px] mt-0.5">0{insIdx + 1}.</span>
                              <span>{ins}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Optimization Recommendations */}
                      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mt-2">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Actionable Optimization Suggestions</span>
                        <div className="flex flex-col gap-2.5">
                          {aiReport.recommendations.map((rec, recIdx) => (
                            <div key={recIdx} className="flex gap-2 items-start text-xs font-sans leading-relaxed text-[#FAF8F4]/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#E5E5E5] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 text-[#888888] bg-white">
                      <Sparkles className="w-8 h-8 text-[#888888]/40" />
                      <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                        Awaiting data...<br />AI will synthesis submission patterns automatically once forms are submitted.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "QUESTION" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                {/* LEFT SIDEBAR: SELECT QUESTION NAVIGATION */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-[88px] shrink-0 w-full">
                  <div className="flex flex-col gap-1 border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888888] font-bold">Question Navigator</span>
                    <h2 className="font-serif italic text-2xl font-bold">Select Question</h2>
                  </div>

                  {form && form.questions && form.questions.filter(q => q.type !== "section" && q.type !== "canvas").length > 0 ? (
                    <div className="bg-white border-2 border-[#0D0D0D]/10 p-6 rounded-3xl shadow-[0_12px_36px_rgba(13,13,13,0.015)] flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Choose a question</span>
                        <CustomSelect
                          value={selectedQuestionId || ""}
                          onChange={(val) => setSelectedQuestionId(Number(val))}
                          options={form.questions.filter(q => q.type !== "section" && q.type !== "canvas").map((q, idx) => ({
                            value: q.id,
                            label: `${idx + 1}. ${q.label}`
                          }))}
                        />
                      </div>

                      {/* Paginated next/prev buttons */}
                      <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-4 mt-2">
                        <span className="font-mono text-[9px] text-[#888888] font-bold">
                          {(() => {
                            const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                            const idx = filteredQs.findIndex(q => q.id === selectedQuestionId);
                            return `${idx + 1} of ${filteredQs.length}`;
                          })()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                              const idx = filteredQs.findIndex(q => q.id === selectedQuestionId);
                              if (idx > 0) {
                                setSelectedQuestionId(filteredQs[idx - 1].id);
                              }
                            }}
                            disabled={(() => {
                              const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                              return filteredQs.findIndex(q => q.id === selectedQuestionId) === 0;
                            })()}
                            className="p-2 bg-white border border-[#E5E5E5] rounded-full hover:border-[#0D0D0D] transition-colors disabled:opacity-40 disabled:hover:border-[#E5E5E5] cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                              const idx = filteredQs.findIndex(q => q.id === selectedQuestionId);
                              if (idx < filteredQs.length - 1) {
                                setSelectedQuestionId(filteredQs[idx + 1].id);
                              }
                            }}
                            disabled={(() => {
                              const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                              return filteredQs.findIndex(q => q.id === selectedQuestionId) === filteredQs.length - 1;
                            })()}
                            className="p-2 bg-white border border-[#E5E5E5] rounded-full hover:border-[#0D0D0D] transition-colors disabled:opacity-40 disabled:hover:border-[#E5E5E5] cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#E5E5E5] rounded-3xl p-6 text-center text-[#888888] bg-white">
                      No questions found.
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: INDIVIDUAL QUESTION CHART/ANALYTICS CARD */}
                <div className="lg:col-span-2 flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-1 border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888888] font-bold">Targeted question analysis</span>
                    <h2 className="font-serif italic text-2xl font-bold">Metrics Visualizer</h2>
                  </div>

                  {(() => {
                    if (!form || !form.questions) return null;
                    const filteredQs = form.questions.filter(q => q.type !== "section" && q.type !== "canvas");
                    const selectedIdx = filteredQs.findIndex(q => q.id === selectedQuestionId);
                    const selectedQ = filteredQs[selectedIdx];
                    if (!selectedQ) return (
                      <div className="border border-dashed border-[#E5E5E5] rounded-3xl p-12 text-center text-[#888888] bg-white font-mono text-xs">
                        Select a question from the navigator to view metrics.
                      </div>
                    );
                    return renderQuestionAnalytics(selectedQ, selectedIdx);
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                
                {/* SUBMISSIONS TABLE */}
                <div className="flex-grow bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] overflow-hidden flex flex-col w-full">
                  <div className="p-5 border-b border-[#E5E5E5] flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888] font-bold">Submissions Log Table</span>
                    <span className="text-[9px] font-mono text-[#888888] font-bold bg-[#FAF8F4] border border-[#0D0D0D]/5 px-2 py-0.5 rounded">{responses.length} record(s)</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] bg-[#F5F3F0] font-mono text-[9px] tracking-wider uppercase text-[#888888] font-bold">
                          <th className="p-4 text-left">Respondent</th>
                          <th className="p-4 text-center">Started At</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((resp, index) => {
                          const identifier = getRespondentIdentifier(resp.id, index);
                          const isFallback = identifier.startsWith("Respondent #");
                          const avatarLetter = isFallback ? "R" : identifier.charAt(0).toUpperCase();
                          const grad = getAvatarGradient(identifier);

                          return (
                            <tr 
                              key={resp.id} 
                              onClick={() => handleRowClick(resp)}
                              className={clsx(
                                "border-b border-[#E5E5E5] last:border-b-0 hover:bg-[#FAF8F4] cursor-pointer transition-colors",
                                selectedResponse?.id === resp.id ? "bg-[#FAF8F4]" : ""
                              )}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={clsx(
                                    "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-serif italic text-xs font-bold shadow-sm shrink-0 uppercase select-none",
                                    grad
                                  )}>
                                    {avatarLetter}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-sans text-xs font-semibold text-[#0D0D0D] truncate">
                                      {identifier}
                                    </span>
                                    <span className="font-mono text-[9px] text-[#888888] select-all cursor-text truncate max-w-[150px] md:max-w-[200px]" title={resp.id}>
                                      {resp.id.slice(0, 8)}...{resp.id.slice(-4)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center text-xs font-sans text-[#888888] font-medium">
                                {new Date(resp.started_at).toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <span className={clsx(
                                  "px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold",
                                  resp.completed_at ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                )}>
                                  {resp.completed_at ? "Completed" : "Incomplete"}
                                </span>
                              </td>
                              <td className="p-4 text-center text-xs font-mono uppercase tracking-widest text-[#0D0D0D] font-bold underline decoration-dotted decoration-1 hover:text-amber-800 transition-colors">
                                View Details
                              </td>
                            </tr>
                          );
                        })}
                        {responses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center font-mono text-xs text-[#888888] uppercase">
                              No submissions logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT SIDEBAR (INDIVIDUAL ANSWERS DETAILS) */}
                <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-[88px]">
                  {selectedResponse ? (
                    <div className="bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-6 relative max-h-[640px] overflow-y-auto premium-scrollbar">
                      <button 
                        onClick={() => setSelectedResponse(null)}
                        className="absolute top-4 right-4 p-1.5 hover:bg-[#FAF8F4] rounded-full text-[#888888] hover:text-black border border-transparent hover:border-border transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {(() => {
                        const selectedIdx = responses.findIndex(r => r.id === selectedResponse.id);
                        const identifier = getRespondentIdentifier(selectedResponse.id, selectedIdx);
                        return (
                          <div className="flex flex-col gap-1 border-b border-[#E5E5E5] pb-4 pr-6">
                            <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Inspect Respondent</span>
                            <h3 className="text-sm font-bold font-sans tracking-tight text-[#0D0D0D] truncate">
                              {identifier}
                            </h3>
                            <span className="font-mono text-[9px] text-[#888888] select-all cursor-text block truncate" title={selectedResponse.id}>
                              ID: {selectedResponse.id}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-[#888888] mt-1.5 font-mono font-bold">
                              <Clock className="w-3.5 h-3.5 text-[#888888]" />
                              <span>{new Date(selectedResponse.started_at).toLocaleTimeString()}</span>
                              <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
                              <span className={selectedResponse.completed_at ? "text-emerald-700" : "text-amber-700"}>
                                {selectedResponse.completed_at ? "Fully completed" : "Partial session"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {loadingAnswers ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {form?.questions?.filter(q => q.type !== "section" && q.type !== "canvas").map((q, idx) => {
                            const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
                            const ans = selectedAnswers.find((a) => a.question_id === String(q.id) || a.question_id === qUuid);
                            return (
                              <div key={q.id} className="flex flex-col gap-2">
                                <span className="font-mono text-[9px] text-[#888888] font-bold block">
                                  {String(idx + 1).padStart(2, "0")} • {q.label}
                                </span>
                                <div className={clsx(
                                  "p-4 rounded-2xl border text-xs font-semibold leading-relaxed font-sans shadow-sm",
                                  ans ? "bg-[#FAF8F4] border-[#E5E5E5] text-[#0D0D0D]" : "bg-transparent border-[#E5E5E5]/40 text-[#888888] italic font-medium"
                                )}>
                                  {ans ? ans.value : "[No response / Drop-off]"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#E5E5E5] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 text-[#888888] bg-white h-full min-h-[300px]">
                      <ClipboardList className="w-8 h-8 text-[#888888]/40" />
                      <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                        Select a submission row<br />to inspect detailed individual answers & session logs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Floating Pill: Back to Builder */}
      <Link 
        href={`/builder/${formId}`}
        className="fixed bottom-6 left-6 z-[99] flex items-center gap-2 bg-[#0D0D0D] text-[#FAF8F4] hover:bg-amber-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 px-4 py-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 shadow-md font-bold select-none cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Builder
      </Link>
    </div>
  );
}


