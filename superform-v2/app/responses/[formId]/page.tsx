"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, BarChart3, Users, CheckCircle, RefreshCw, X, ClipboardList } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Question {
  id: number;
  label: string;
  type: string;
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
  question_id: string;
  value: string;
}

export default function ResponseRoomPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [form, setForm] = useState<FormRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ResponseRow | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerRow[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  
  // Dynamic drop-off mapping
  const [dropoffMap, setDropoffMap] = useState<Record<string, number>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch form
      const { data: formData, error: formErr } = await supabase
        .from("forms")
        .select("id, title, questions")
        .eq("id", formId)
        .single();

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

        // 3. Fetch all answers for this form to calculate dropoff stats
        const responseIds = respData.map((r) => r.id);
        if (responseIds.length > 0) {
          const { data: answersData } = await supabase
            .from("answers")
            .select("question_id")
            .in("response_id", responseIds);

          if (answersData) {
            // Count occurrences of answers per question
            const counts: Record<string, number> = {};
            answersData.forEach((a) => {
              counts[a.question_id] = (counts[a.question_id] || 0) + 1;
            });
            setDropoffMap(counts);
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

  const totalResponses = responses.length;
  const completedResponses = responses.filter((r) => r.completed_at !== null).length;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0D0D0D] flex flex-col font-sans">
      {/* HEADER */}
      <header className="h-[64px] border-b border-[#E5E5E5] bg-[#FAF8F4] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-[#E5E5E5] rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight uppercase">
              {form ? form.title : "Loading form..."}
            </h1>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">
              Response analytics studio
            </span>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E5E5] hover:border-[#0D0D0D] rounded-full font-mono text-[9px] uppercase tracking-widest hover:bg-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </button>
      </header>

      {/* WORKSPACE CONTENT */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-32 h-0.5 bg-[#E5E5E5] overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-[#0D0D0D] w-full animate-[slide-rule_1s_ease-in-out_infinite]" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row p-6 lg:p-8 gap-8 overflow-y-auto">
          {/* LEFT CONTENT (METRICS & GRAPH) */}
          <div className="flex-grow flex flex-col gap-8 max-w-4xl">
            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col justify-between h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">Total Responses</span>
                  <Users className="w-4 h-4 text-[#888888]" />
                </div>
                <div className="font-display text-5xl tracking-wide leading-none">{totalResponses}</div>
                <div className="text-[10px] font-mono text-[#888888]">ALL STARTS DETECTED</div>
              </div>

              <div className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col justify-between h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">Completion Rate</span>
                  <BarChart3 className="w-4 h-4 text-[#888888]" />
                </div>
                <div className="font-display text-5xl tracking-wide leading-none text-emerald-600">{completionRate}%</div>
                <div className="text-[10px] font-mono text-[#888888]">SUBMISSION CONVERSION</div>
              </div>

              <div className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col justify-between h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">Completely Filled</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-display text-5xl tracking-wide leading-none">{completedResponses}</div>
                <div className="text-[10px] font-mono text-[#888888]">FULLY SUBMITTED OUTCOMES</div>
              </div>
            </div>

            {/* DROP-OFF GRAPH */}
            <div className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888888] block mb-6">Drop-Off Funnel Map</span>
              
              <div className="flex flex-col gap-5">
                {form?.questions?.map((q, idx) => {
                  const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
                  const answersCount = dropoffMap[q.id] || dropoffMap[qUuid] || 0;
                  const percent = totalResponses > 0 ? Math.round((answersCount / totalResponses) * 100) : 0;
                  return (
                    <div key={q.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#0D0D0D] font-medium truncate max-w-[70%]">
                          {String(idx + 1).padStart(2, "0")}. {q.label}
                        </span>
                        <span className="text-[#888888] text-[10px]">
                          {answersCount} answered ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#FAF8F4] border border-[#E5E5E5] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0D0D0D] rounded-full transition-all duration-700" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!form?.questions || form.questions.length === 0) && (
                  <div className="text-center py-6 font-mono text-xs text-[#888888] uppercase">
                    No questions defined to map funnel.
                  </div>
                )}
              </div>
            </div>

            {/* SUBMISSIONS TABLE */}
            <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[#E5E5E5] flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#888888]">Submissions Log</span>
                <span className="text-[10px] font-mono text-[#888888]">{responses.length} record(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F5F3F0] font-mono text-[9px] tracking-wider uppercase text-[#888888]">
                      <th className="p-4 text-left">Response ID</th>
                      <th className="p-4 text-center">Started At</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((resp) => (
                      <tr 
                        key={resp.id} 
                        onClick={() => handleRowClick(resp)}
                        className={clsx(
                          "border-b border-[#E5E5E5] last:border-b-0 hover:bg-[#FAF8F4] cursor-pointer transition-colors",
                          selectedResponse?.id === resp.id ? "bg-[#FAF8F4]" : ""
                        )}
                      >
                        <td className="p-4 font-mono text-xs font-semibold text-[#0D0D0D]">{resp.id}</td>
                        <td className="p-4 text-center text-xs font-sans text-[#888888]">
                          {new Date(resp.started_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className={clsx(
                            "px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest",
                            resp.completed_at ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}>
                            {resp.completed_at ? "Completed" : "Incomplete"}
                          </span>
                        </td>
                        <td className="p-4 text-center text-xs font-mono uppercase tracking-widest text-[#0D0D0D] underline decoration-dotted">
                          View details
                        </td>
                      </tr>
                    ))}
                    {responses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center font-mono text-xs text-[#888888] uppercase">
                          No submissions logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (INDIVIDUAL ANSWERS DETAILS) */}
          <div className="w-full lg:w-[350px] shrink-0">
            {selectedResponse ? (
              <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-6 flex flex-col gap-6 relative max-h-[700px] overflow-y-auto">
                <button 
                  onClick={() => setSelectedResponse(null)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-[#FAF8F4] rounded-full text-[#888888] hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-1 border-b border-[#E5E5E5] pb-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">INSPECT RESPONDENT</span>
                  <h3 className="text-xs font-semibold font-mono tracking-tight text-[#0D0D0D] truncate pr-8">
                    ID: {selectedResponse.id}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-[#888888] mt-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedResponse.started_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {loadingAnswers ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {form?.questions?.map((q, idx) => {
                      const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, '0')}`;
                      const ans = selectedAnswers.find((a) => a.question_id === String(q.id) || a.question_id === qUuid);
                      return (
                        <div key={q.id} className="flex flex-col gap-1.5">
                          <span className="font-mono text-[10px] text-[#888888] block">
                            {String(idx + 1).padStart(2, "0")} → {q.label}
                          </span>
                          <div className={clsx(
                            "p-3 rounded-lg border text-xs font-medium leading-relaxed",
                            ans ? "bg-[#FAF8F4] border-[#E5E5E5] text-[#0D0D0D]" : "bg-transparent border-[#E5E5E5]/40 text-[#888888] italic"
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
              <div className="border border-dashed border-[#E5E5E5] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 text-[#888888] h-full min-h-[250px]">
                <ClipboardList className="w-8 h-8 text-[#888888]/40" />
                <p className="font-mono text-[10px] uppercase tracking-widest">
                  Select a submission row to inspect questions & answers detail
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
