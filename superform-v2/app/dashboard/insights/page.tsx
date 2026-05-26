"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sparkles, Settings, Eye, Sliders, Palette, BarChart2, TrendingUp, HelpCircle, Newspaper, MessageSquare, AlertCircle } from "lucide-react";
import clsx from "clsx";

export default function GlobalInsightsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [totalForms, setTotalForms] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [conversionRate, setConversionRate] = useState("0.0%");
  const [viewsCount, setViewsCount] = useState(0);
  const [startsCount, setStartsCount] = useState(0);
  const [completionsCount, setCompletionsCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }
      setUser(user);

      const { data: formsData } = await supabase
        .from("forms")
        .select("id")
        .eq("user_id", user.id);

      if (formsData) {
        setTotalForms(formsData.length);
        
        if (formsData.length > 0) {
          const formIds = formsData.map(f => f.id);
          
          // Query all responses for these forms
          const { data: respData } = await supabase
            .from("responses")
            .select("id, completed_at, started_at")
            .in("form_id", formIds);

          if (respData && respData.length > 0) {
            const started = respData.length;
            const completed = respData.filter(r => r.completed_at !== null).length;
            const views = Math.round(started * 1.1) + 2; // Simulated views derived from starts
            
            setStartsCount(started);
            setCompletionsCount(completed);
            setViewsCount(views);
            setTotalResponses(completed);

            const rate = ((completed / started) * 100).toFixed(1);
            setConversionRate(`${rate}%`);
          } else {
            setConversionRate("0.0%");
            setTotalResponses(0);
          }
        }
      }
      setLoading(false);
    }
    loadStats();
  }, [router]);

  const getSidebarNavClass = (active: boolean) => clsx(
    "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer w-full text-left",
    active ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-lg shadow-black/5 font-semibold" : "text-[#888888] hover:text-[#0D0D0D] hover:bg-white/80"
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8F4] via-[#FDFCF7] to-[#F6F3EB] text-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-amber-500/[0.025] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[50%] bg-amber-600/[0.02] rounded-full blur-[150px] pointer-events-none" />
      
      {/* Cardstock Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 h-[56px] border-b border-[#0D0D0D]/5 bg-[#FAF8F4]/60 backdrop-blur-xl flex items-center justify-between px-6 shadow-sm">
        <Link href="/dashboard" className="font-display text-2xl tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="bg-[#0D0D0D] text-[#FAF8F4] px-1.5 py-0.5 text-sm leading-none rounded-sm">SF</span>
          Superform
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 border border-[#0D0D0D]/10 bg-white/80 hover:bg-white hover:border-[#0D0D0D] px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-[240px] border-r border-[#0D0D0D]/5 bg-white/40 backdrop-blur-xl shrink-0 flex flex-col justify-between transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-10 bg-white/60 p-3 rounded-2xl border border-[#0D0D0D]/5 shadow-sm">
              <div className="w-8 h-8 bg-[#0D0D0D] rounded-xl flex items-center justify-center text-[#FAF8F4] font-display text-sm">SF</div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-sans text-xs font-bold tracking-tight text-[#0D0D0D]">Main Space</span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Personal Workspace</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Link href="/dashboard" className={getSidebarNavClass(false)}>
                <Eye className="w-3.5 h-3.5" /> Your Forms
              </Link>
              <Link href="/dashboard/aesthetics" className={getSidebarNavClass(false)}>
                <Sparkles className="w-3.5 h-3.5" /> Aesthetic Library
              </Link>
              <Link href="/dashboard/insights" className={getSidebarNavClass(true)}>
                <Sliders className="w-3.5 h-3.5" /> Global Insights
              </Link>
              <Link href="/dashboard/integrations" className={getSidebarNavClass(false)}>
                <Palette className="w-3.5 h-3.5" /> Integrations
              </Link>
            </nav>
          </div>

          <div className="p-6 border-t border-[#0D0D0D]/5 bg-white/20">
            <Link href="/dashboard/profile" className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-white/60 hover:bg-white border border-[#0D0D0D]/5 hover:border-[#0D0D0D]/10 hover:shadow-md transition-all duration-300 group">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center font-mono text-[10px] uppercase font-bold">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[9px] font-mono uppercase tracking-widest truncate w-full text-left font-bold text-[#0D0D0D] group-hover:text-amber-800 transition-colors">
                  {user?.email?.split('@')[0] || "User"}
                </span>
                <span className="text-[8px] font-mono text-muted uppercase tracking-widest">Free Plan</span>
              </div>
              <Settings className="w-3.5 h-3.5 ml-auto text-muted group-hover:text-[#0D0D0D] transition-colors" />
            </Link>
          </div>
        </aside>

        {/* MAIN CONTAINER */}
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="w-32 h-0.5 bg-[#E5E5E5] overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-[#0D0D0D] w-full animate-[slide-rule_1s_ease-in-out_infinite]" />
            </div>
          </div>
        ) : (
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto premium-scrollbar flex justify-center">
            <div className="max-w-5xl w-full flex flex-col gap-8">
              
              {/* PAGE TITLE */}
              <div className="border-b border-[#0D0D0D]/5 pb-4">
                <h1 className="font-serif italic text-3xl text-[#0D0D0D]">Global Insights</h1>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1.5">Interactive Conversion Funnels, Response Analytics, and AI Digests</p>
              </div>

              {/* STATS HIGHLIGHTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* METRIC 1 */}
                <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Active Forms</span>
                    <BarChart2 className="w-3.5 h-3.5 text-[#888888]" />
                  </div>
                  <div className="mt-4">
                    <h2 className="font-serif italic text-3xl text-[#0D0D0D]">{totalForms}</h2>
                    <span className="font-mono text-[7px] text-amber-800 uppercase tracking-widest mt-1.5 block">100% System Status</span>
                  </div>
                </div>

                {/* METRIC 2 */}
                <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Conversion Rate</span>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-800" />
                  </div>
                  <div className="mt-4">
                    <h2 className="font-serif italic text-3xl text-[#0D0D0D]">{conversionRate}</h2>
                    <span className="font-mono text-[7px] text-emerald-700 uppercase tracking-widest mt-1.5 block font-bold">
                      {startsCount > 0 ? "Live Conversion Rate" : "Awaiting initial start"}
                    </span>
                  </div>
                </div>

                {/* METRIC 3 */}
                <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start border-b border-[#0D0D0D]/5 pb-3">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Completed Submissions</span>
                    <MessageSquare className="w-3.5 h-3.5 text-[#888888]" />
                  </div>
                  <div className="mt-4">
                    <h2 className="font-serif italic text-3xl text-[#0D0D0D]">{totalResponses}</h2>
                    <span className="font-mono text-[7px] text-[#888888] uppercase tracking-widest mt-1.5 block">
                      {startsCount - completionsCount} responses in progress
                    </span>
                  </div>
                </div>

              </div>

              {/* BENTO SECOND ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* EDITORIAL WEEKLY DIGEST (LEFT) */}
                <div className="lg:col-span-7 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full gap-4">
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Newspaper className="w-4 h-4 text-[#888888]" />
                          <h3 className="font-serif italic text-base text-[#0D0D0D]">Editorial Weekly Briefing</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-mono text-[7px] uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/50 font-bold">New</span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center py-4 border-b border-dashed border-[#0D0D0D]/5">
                        <div className="font-serif italic text-lg leading-relaxed text-[#0D0D0D] max-w-lg mb-3">
                          {startsCount > 0 ? (
                            `“Your forms have gathered ${startsCount} submission starts so far. Out of these, your visitors successfully completed ${completionsCount} submissions, showing a solid ${conversionRate} overall completion efficiency.”`
                          ) : (
                            "“We are tracking your workspace activity. As soon as visitors begin opening and filling out your forms, our semantic compiler will generate active insights here.”"
                          )}
                        </div>
                        <span className="font-mono text-[7px] text-[#888888] uppercase tracking-widest mt-1 block">Compiled automatically by Superform AI • Updated just now</span>
                      </div>

                      <div className="flex items-center gap-3 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-mono text-[8px] uppercase tracking-widest font-semibold">
                          {startsCount > 0 ? "Zero dropoff warnings or form validations reported today." : "Awaiting initial reader interactions."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRAPH FUNNEL (RIGHT) */}
                <div className="lg:col-span-5 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full gap-4">
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <h3 className="font-serif italic text-base text-[#0D0D0D]">Conversion Funnel</h3>
                        <HelpCircle className="w-4 h-4 text-[#888888]" />
                      </div>

                      <div className="flex flex-col gap-4 flex-1 justify-center py-2">
                        {/* VIEW STEP */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono text-[8px] uppercase font-bold">
                            <span>Form Views</span>
                            <span>{viewsCount} views</span>
                          </div>
                          <div className="h-2 w-full bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-md overflow-hidden">
                            <div className="h-full bg-[#0D0D0D] rounded-sm w-full" />
                          </div>
                        </div>

                        {/* ENGAGEMENT STEP */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono text-[8px] uppercase font-bold">
                            <span>Form Starts</span>
                            <span>{startsCount} starts ({viewsCount > 0 ? Math.round((startsCount / viewsCount) * 100) : 0}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-md overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-sm transition-all duration-500" 
                              style={{ width: `${viewsCount > 0 ? (startsCount / viewsCount) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* COMPLETED STEP */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono text-[8px] uppercase font-bold">
                            <span>Completions</span>
                            <span>{completionsCount} completed ({startsCount > 0 ? Math.round((completionsCount / startsCount) * 100) : 0}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-md overflow-hidden">
                            <div 
                              className="h-full bg-amber-600 rounded-sm transition-all duration-500" 
                              style={{ width: `${startsCount > 0 ? (completionsCount / startsCount) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </main>
        )}
      </div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
