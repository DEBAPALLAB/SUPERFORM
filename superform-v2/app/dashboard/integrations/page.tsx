"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Sparkles,
  Settings,
  Eye,
  Sliders,
  Palette,
  Layers,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Check,
  Copy,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Database,
  ClipboardList,
  BookOpen
} from "lucide-react";
import clsx from "clsx";

export default function IntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  
  // Embed generator states
  const [selectedEmbedLang, setSelectedEmbedLang] = useState("HTML");
  const [embedTransparent, setEmbedTransparent] = useState(true);
  const [embedRadius, setEmbedRadius] = useState("sm");
  const [embedAesthetic, setEmbedAesthetic] = useState("editorial");
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Connection states
  const [connections, setConnections] = useState<Record<string, boolean>>({
    notion: false,
    resend: false,
    webhooks: true
  });

  // Google Sheets Action States
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const [tier, setTier] = useState("Free");

  useEffect(() => {
    async function loadData() {
      // 1. Instant cached check to prevent network lag on dashboard render
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch dynamic billing tier
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setTier(data.tier || "Free");
          });

        const { data: formsData } = await supabase
          .from('forms')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (formsData) {
          setForms(formsData);
          if (formsData.length > 0) {
            setSelectedFormId(formsData[0].id);
          }
        }
        setLoading(false);
      }

      // 2. Perform background secure session validation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();
      if (profile) setTier(profile.tier || "Free");

      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (formsData) {
        setForms(formsData);
        if (formsData.length > 0) {
          setSelectedFormId(formsData[0].id);
        }
      }
      
      setLoading(false);
    }
    loadData();
  }, [router]);


  const toggleConnection = (key: string) => {
    setConnections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEmbedCode = () => {
    const srcUrl = `https://superform.v2/f/demo-form?transparent=${embedTransparent}&radius=${embedRadius}&aesthetic=${embedAesthetic}`;
    
    if (selectedEmbedLang === "HTML") {
      return `<iframe \n  src="${srcUrl}"\n  style="width: 100%; border: none; min-height: 480px; background: transparent;"\n  allowtransparency="true"\n  loading="lazy">\n</iframe>`;
    }
    
    if (selectedEmbedLang === "NextJS") {
      return `// Superform Next.js Headless Component\nexport default function FormEmbed() {\n  return (\n    <iframe \n      src="${srcUrl}"\n      className="w-full min-h-[480px] border-none bg-transparent"\n      allowTransparency\n      loading="lazy"\n    />\n  );\n}`;
    }

    if (selectedEmbedLang === "Svelte") {
      return `<!-- Superform Headless Embed -->\n<iframe \n  src="${srcUrl}"\n  style="width: 100%; border: none; min-height: 480px; background: transparent;"\n  allowtransparency="true"\n  loading="lazy">\n</iframe>`;
    }

    return "";
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Google Sheets integration setup triggers
  const handleConnectGoogle = () => {
    if (!selectedFormId) return;
    window.location.href = `/api/integrations/google/auth?formId=${selectedFormId}`;
  };


  const handleCreateSpreadsheet = async () => {
    if (!selectedFormId) return;
    setSyncingSheet(true);
    setSheetSuccess(null);
    setSheetError(null);

    try {
      const res = await fetch("/api/integrations/google/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: selectedFormId })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create spreadsheet");
      }

      // Update local forms state to reflect spreadsheet connection
      setForms(prev => prev.map(f => {
        if (f.id === selectedFormId) {
          const updatedQ = [...f.questions];
          if (updatedQ.length > 0) {
            const firstQ = updatedQ[0] as any;
            updatedQ[0] = {
              ...firstQ,
              settings: {
                ...firstQ.settings,
                google_sheets_spreadsheet_id: data.spreadsheetId,
                google_sheets_spreadsheet_url: data.spreadsheetUrl,
                google_sheets_enabled: true
              }
            };
          }
          return { ...f, questions: updatedQ };
        }
        return f;
      }));

      setSheetSuccess("Google Spreadsheet created and mapped successfully!");
    } catch (err: any) {
      setSheetError(err.message || "An unexpected error occurred");
    } finally {
      setSyncingSheet(false);
    }
  };

  const selectedForm = forms.find(f => f.id === selectedFormId);
  const firstQ = selectedForm?.questions?.[0] as any;
  const sheetsSettings = firstQ?.settings || {};
  const isGoogleConnected = !!sheetsSettings.google_sheets_refresh_token;
  const isGoogleEnabled = !!sheetsSettings.google_sheets_enabled;
  const linkedSpreadsheetUrl = sheetsSettings.google_sheets_spreadsheet_url || "";
  const linkedSpreadsheetEmail = sheetsSettings.google_sheets_email || "";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8F4] via-[#FDFCF7] to-[#F6F3EB] text-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-amber-500/[0.025] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[50%] bg-amber-600/[0.02] rounded-full blur-[150px] pointer-events-none" />
      
      {/* Cardstock Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 h-[56px] border-b border-[#0D0D0D]/5 bg-[#FAF8F4]/60 backdrop-blur-xl flex items-center justify-between px-6 shadow-sm">
        <Link href="/dashboard" className="font-display text-2xl tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity text-[#0D0D0D]">
          <svg className="w-7 h-7 rounded-[7px] shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="integrationsSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="30%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#integrationsSfGrad)" letterSpacing="-0.03em">SF</text>
          </svg>
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

      <div className="flex flex-1 relative z-10 min-h-0">
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden md:flex w-[240px] h-[calc(100vh-56px)] sticky top-[56px] border-r border-[#0D0D0D]/5 bg-white/40 backdrop-blur-xl shrink-0 flex-col justify-between transition-all duration-300">
          <div className="p-6 flex-1 overflow-y-auto premium-scrollbar flex flex-col">
            <div className="flex items-center gap-3 mb-8 bg-white/60 p-3 rounded-2xl border border-[#0D0D0D]/5 shadow-sm shrink-0">
              <svg className="w-8 h-8 rounded-xl shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="integrationsSidebarSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="30%" stopColor="#FAF8F4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#integrationsSidebarSfGrad)" letterSpacing="-0.03em">SF</text>
              </svg>
              <div className="flex flex-col overflow-hidden">
                <span className="font-sans text-xs font-bold tracking-tight text-[#0D0D0D]">Main Space</span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Personal Workspace</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 shrink-0">
              {[
                { label: "Your Forms", icon: ClipboardList, active: false, href: "/dashboard" },
                { label: "Aesthetic Library", icon: Sparkles, active: false, href: "/dashboard/aesthetics" },
                { label: "Global Insights", icon: BookOpen, active: false, href: "/dashboard/insights" },
                { label: "Integrations", icon: Layers, active: true, href: "/dashboard/integrations" },
              ].map((item, idx) => (
                <Link 
                  key={idx}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-sans tracking-tight transition-all duration-300 cursor-pointer w-full text-left group",
                    item.active 
                      ? "bg-white text-[#0D0D0D] border border-[#0D0D0D]/5 shadow-sm font-semibold" 
                      : "text-[#666666] hover:text-[#0D0D0D] hover:bg-white/50"
                  )}
                >
                  <div className={clsx(
                    "w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                    item.active 
                      ? "bg-[#0D0D0D] text-[#FAF8F4]" 
                      : "bg-[#0D0D0D]/5 text-[#666666] group-hover:bg-[#0D0D0D] group-hover:text-[#FAF8F4]"
                  )}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-sans text-xs font-semibold tracking-tight">{item.label}</span>
                </Link>
              ))}
            </nav>

            {tier === "Free" && (
              <div className="mt-6 p-4 bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border border-[#2e2a24] rounded-2xl shadow-xl flex flex-col gap-3 relative overflow-hidden group/upgrade shrink-0">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover/upgrade:scale-150 transition-transform duration-700 pointer-events-none" />
                
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-sans text-[10px] uppercase tracking-widest font-black text-amber-400">Upgrade Available</span>
                </div>
                
                <p className="font-sans text-[10.5px] text-zinc-400 leading-normal font-medium tracking-tight">
                  Unlock custom branding, whitelisted domains, and unlimited submissions.
                </p>
                
                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0c0a09] py-2 rounded-xl font-sans text-xs font-semibold tracking-tight shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[#0D0D0D]/5 bg-white/20 shrink-0">
            <Link href="/dashboard/profile" className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-white/60 hover:bg-white border border-[#0D0D0D]/5 hover:border-[#0D0D0D]/10 hover:shadow-md transition-all duration-300 group shrink-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center font-mono text-[10px] uppercase font-bold">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[9px] font-mono uppercase tracking-widest truncate w-full text-left font-bold text-[#0D0D0D] group-hover:text-amber-800 transition-colors">
                  {user?.email?.split('@')[0] || "User"}
                </span>
                <span className="text-[8px] font-mono text-muted uppercase tracking-widest">{tier} Plan</span>
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
          <main className="flex-1 p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto premium-scrollbar flex justify-center">
            <div className="max-w-5xl w-full flex flex-col gap-8">
              
              {/* PAGE TITLE */}
              <div className="border-b border-[#0D0D0D]/5 pb-4">
                <h1 className="font-serif italic text-3xl text-[#0D0D0D]">Headless & Ecosystem Integrations</h1>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1.5">Connect Superform submissions to Notion, Resend workflows, raw webhooks, or embed headlessly anywhere</p>
              </div>

              {/* BENTO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* CONNECTIONS LIST (LEFT) */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full">
                    <h3 className="font-serif italic text-base border-b border-[#0D0D0D]/5 pb-2 text-[#0D0D0D]">Ecosystem Connectors</h3>
                    
                    <div className="flex flex-col gap-4 flex-1 justify-center">
                      
                      {/* Connection 1: Notion */}
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <div className="flex flex-col">
                          <span className="font-sans text-xs font-bold text-[#0D0D0D]">Notion Workspace</span>
                          <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Append records directly into custom databases</span>
                        </div>
                        <button onClick={() => toggleConnection("notion")} className="cursor-pointer">
                          {connections.notion ? <ToggleRight className="w-9 h-9 text-amber-800" /> : <ToggleLeft className="w-9 h-9 text-[#888888]/30" />}
                        </button>
                      </div>

                      {/* Connection 2: Resend */}
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <div className="flex flex-col">
                          <span className="font-sans text-xs font-bold text-[#0D0D0D]">Resend / Loops Alerts</span>
                          <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Push subscribers instantly into automated emails</span>
                        </div>
                        <button onClick={() => toggleConnection("resend")} className="cursor-pointer">
                          {connections.resend ? <ToggleRight className="w-9 h-9 text-amber-800" /> : <ToggleLeft className="w-9 h-9 text-[#888888]/30" />}
                        </button>
                      </div>

                      {/* Connection 3: Webhooks */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-sans text-xs font-bold text-[#0D0D0D]">Low-Latency Webhooks</span>
                          <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Cryptographically signed JSON payload triggers</span>
                        </div>
                        <button onClick={() => toggleConnection("webhooks")} className="cursor-pointer">
                          {connections.webhooks ? <ToggleRight className="w-9 h-9 text-amber-800" /> : <ToggleLeft className="w-9 h-9 text-[#888888]/30" />}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* HEADLESS SDK EMBED GENERATOR (RIGHT) */}
                <div className="lg:col-span-6 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full gap-4">
                      
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <h3 className="font-serif italic text-base text-[#0D0D0D]">Headless SDK Builder</h3>
                        <Terminal className="w-4 h-4 text-[#888888]" />
                      </div>

                      {/* Embedded Style Configurations */}
                      <div className="grid grid-cols-2 gap-3.5">
                        
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Aesthetic Frame</span>
                          <select 
                            value={embedAesthetic} 
                            onChange={(e) => setEmbedAesthetic(e.target.value)}
                            className="bg-[#FAF8F4] border border-[#0D0D0D]/10 rounded-md p-1.5 text-[9px] uppercase font-mono tracking-wider focus:outline-none"
                          >
                            <option value="editorial">Editorial</option>
                            <option value="minimalist">Minimalist</option>
                            <option value="brutalist">Brutalist</option>
                            <option value="glass">Glass Sheen</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Background Translucency</span>
                          <select 
                            value={embedTransparent ? "true" : "false"} 
                            onChange={(e) => setEmbedTransparent(e.target.value === "true")}
                            className="bg-[#FAF8F4] border border-[#0D0D0D]/10 rounded-md p-1.5 text-[9px] uppercase font-mono tracking-wider focus:outline-none"
                          >
                            <option value="true">Transparent Inherit</option>
                            <option value="false">Solid Cream Card</option>
                          </select>
                        </div>

                      </div>

                      {/* Code Output Header with Language Selection */}
                      <div className="flex flex-col gap-2.5 mt-2 flex-1">
                        <div className="flex items-center justify-between bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-t-xl px-3 py-1">
                          <div className="flex gap-2">
                            {["HTML", "NextJS", "Svelte"].map(lang => (
                              <button
                                key={lang}
                                onClick={() => setSelectedEmbedLang(lang)}
                                className={clsx(
                                  "py-1 px-2 font-mono text-[8px] uppercase tracking-widest rounded-md cursor-pointer",
                                  selectedEmbedLang === lang ? "bg-white font-bold shadow-sm" : "text-[#888888]"
                                )}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            onClick={handleCopyCode}
                            className={clsx(
                              "flex items-center gap-1.5 py-1 px-2 font-mono text-[7px] uppercase tracking-widest rounded-md cursor-pointer transition-all",
                              copiedCode ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100" : "bg-white hover:bg-[#0D0D0D] hover:text-[#FAF8F4]"
                            )}
                          >
                            {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedCode ? "Copied" : "Copy Code"}
                          </button>
                        </div>

                        {/* Raw Code Snippet Block */}
                        <div className="bg-[#0D0D0D] text-[#FAF8F4] p-4 rounded-b-xl font-mono text-[8px] leading-relaxed overflow-x-auto whitespace-pre-wrap select-all min-h-[140px]">
                          {getEmbedCode()}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* PREMIUM NATIVE GOOGLE SHEETS CONNECTOR CARD */}
              <div className="bg-white border-2 border-[#0D0D0D]/10 rounded-3xl p-8 shadow-[0_15px_45px_rgba(13,13,13,0.015)] flex flex-col gap-6 relative overflow-hidden group hover:border-[#0D0D0D] transition-all duration-500">
                {/* Background Sheets Grid Accent */}
                <div className="absolute top-0 right-0 w-[30%] h-full opacity-[0.035] pointer-events-none group-hover:scale-105 transition-transform duration-700" 
                  style={{
                    backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
                    backgroundSize: "20px 20px"
                  }} 
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#0D0D0D]/5 pb-5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-serif italic text-2xl text-[#0D0D0D]">Google Sheets Native Stream</h3>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[#888888] mt-0.5">Stream respondent answers into dedicated spreadsheets automatically in real-time</p>
                    </div>
                  </div>

                  {/* Form Selector Dropdown */}
                  <div className="flex flex-col gap-1 w-full md:w-60">
                    <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] font-bold">Target Form</span>
                    <select
                      value={selectedFormId}
                      onChange={(e) => {
                        setSelectedFormId(e.target.value);
                        setSheetSuccess(null);
                        setSheetError(null);
                      }}
                      className="w-full bg-[#FAF8F4] border border-[#0D0D0D]/10 rounded-xl p-2.5 text-[10px] uppercase font-mono tracking-wider focus:outline-none focus:border-[#0D0D0D] transition-all shadow-sm"
                    >
                      {forms.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {forms.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888]">No forms available to integrate. Create a form first.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* LEFT PANEL: CONFIG CONTROL */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      
                      {!isGoogleConnected ? (
                        <div className="bg-[#FAF8F4]/60 border border-[#0D0D0D]/5 rounded-2xl p-6 flex flex-col gap-4 text-center items-center shadow-inner">
                          <Database className="w-8 h-8 text-[#888888]/40 mb-1" />
                          <div className="flex flex-col gap-1">
                            <span className="font-sans text-xs font-bold text-[#0D0D0D]">Google Account Connection Required</span>
                            <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] leading-relaxed max-w-sm">
                              Authorize Superform to securely link spreadsheets and append submissions automatically on your behalf.
                            </span>
                          </div>
                          
                          <button
                            onClick={handleConnectGoogle}
                            className="bg-[#0D0D0D] hover:bg-emerald-800 text-[#FAF8F4] px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all cursor-pointer font-bold mt-2"
                          >
                            Connect Google Account
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-5">
                          
                          {/* Connected Account Banner */}
                          <div className="flex items-center justify-between bg-emerald-50/40 border border-emerald-100/60 rounded-2xl px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-800 flex items-center justify-center font-mono text-[10px] font-bold">G</div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-sans font-bold text-[#0D0D0D]">Google Account Linked</span>
                                <span className="font-mono text-[8px] uppercase text-emerald-800 font-semibold">{linkedSpreadsheetEmail}</span>
                              </div>
                            </div>
                            <button
                              onClick={handleConnectGoogle}
                              className="font-mono text-[8px] uppercase tracking-wider text-[#888888] hover:text-[#0D0D0D] flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                            >
                              <RefreshCw className="w-3 h-3" /> Reconnect
                            </button>
                          </div>

                          {/* Link Control */}
                          {!linkedSpreadsheetUrl ? (
                            <div className="bg-[#FAF8F4]/60 border border-[#0D0D0D]/5 rounded-2xl p-6 flex flex-col gap-4 text-center items-center shadow-inner">
                              <Sparkles className="w-7 h-7 text-amber-700 animate-pulse" />
                              <div className="flex flex-col gap-1">
                                <span className="font-sans text-xs font-bold text-[#0D0D0D]">Auto-Initialize Spreadsheet</span>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] leading-relaxed max-w-sm">
                                  Instantly construct a spreadsheet custom-tailored with all response columns preset for this form.
                                </span>
                              </div>

                              <button
                                onClick={handleCreateSpreadsheet}
                                disabled={syncingSheet}
                                className={clsx(
                                  "bg-[#0D0D0D] hover:bg-emerald-800 text-[#FAF8F4] px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer font-bold mt-2 flex items-center gap-2",
                                  syncingSheet && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {syncingSheet ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Constructing Sheet...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" /> Initialize Google Sheet
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="bg-[#FAF8F4]/40 border border-[#0D0D0D]/5 rounded-2xl p-6 flex flex-col gap-4 shadow-inner">
                              <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                                <div className="flex flex-col">
                                  <span className="font-sans text-xs font-bold text-[#0D0D0D]">Linked spreadsheet</span>
                                  <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Sheet ID: {sheetsSettings.google_sheets_spreadsheet_id?.substring(0, 16)}...</span>
                                </div>

                                <a
                                  href={linkedSpreadsheetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 bg-white border border-[#0D0D0D]/10 hover:border-[#0D0D0D] hover:shadow-sm px-4 py-2 font-mono text-[8px] uppercase tracking-wider rounded-xl transition-all font-bold"
                                >
                                  Open Spreadsheet <ExternalLink className="w-3 h-3 text-[#888888]" />
                                </a>
                              </div>

                              {/* Toggle active sync status */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex flex-col">
                                  <span className="font-sans text-xs font-bold text-[#0D0D0D]">Real-Time Streaming Status</span>
                                  <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Stream submissions instantly upon successful entry</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={clsx(
                                    "font-mono text-[8px] uppercase tracking-widest font-bold",
                                    isGoogleEnabled ? "text-emerald-700" : "text-[#888888]"
                                  )}>
                                    {isGoogleEnabled ? "Active & Syncing" : "Paused"}
                                  </span>

                                  <button
                                    onClick={async () => {
                                      const updatedQ = [...selectedForm.questions];
                                      const firstQ = updatedQ[0] as any;
                                      updatedQ[0] = {
                                        ...firstQ,
                                        settings: {
                                          ...firstQ.settings,
                                          google_sheets_enabled: !isGoogleEnabled
                                        }
                                      };

                                      await supabase
                                        .from("forms")
                                        .update({ questions: updatedQ })
                                        .eq("id", selectedFormId);

                                      setForms(prev => prev.map(f => f.id === selectedFormId ? { ...f, questions: updatedQ } : f));
                                    }}
                                    className={clsx(
                                      "w-10 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none cursor-pointer",
                                      isGoogleEnabled ? "bg-emerald-700" : "bg-[#EAE6DF]"
                                    )}
                                  >
                                    <div className={clsx(
                                      "w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm",
                                      isGoogleEnabled ? "translate-x-4.5" : "translate-x-0"
                                    )} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      )}

                      {/* Toast Success/Error Notices */}
                      {sheetSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl font-mono text-[8px] uppercase tracking-widest font-semibold text-center animate-in fade-in duration-300">
                          {sheetSuccess}
                        </div>
                      )}
                      {sheetError && (
                        <div className="bg-red-50 border border-red-100 text-red-800 px-4 py-3 rounded-xl font-mono text-[8px] uppercase tracking-widest font-semibold text-center animate-in fade-in duration-300">
                          {sheetError}
                        </div>
                      )}

                    </div>

                    {/* RIGHT PANEL: COLUMN MAPPING SCHEMATIC */}
                    <div className="lg:col-span-5 border border-[#0D0D0D]/5 bg-[#FAF8F4]/40 rounded-3xl p-6 flex flex-col gap-4 shadow-inner">
                      <div className="flex items-center gap-2 border-b border-[#0D0D0D]/5 pb-3">
                        <Database className="w-4 h-4 text-[#888888]" />
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Active Column Schematics</span>
                      </div>

                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto premium-scrollbar pr-1">
                        <div className="flex justify-between items-center bg-white border border-[#0D0D0D]/5 rounded-xl px-3 py-2 font-mono text-[8px] uppercase tracking-wider">
                          <span className="text-[#888888] font-bold">Column A</span>
                          <span className="text-[#0D0D0D] font-bold">Submission ID</span>
                        </div>
                        <div className="flex justify-between items-center bg-white border border-[#0D0D0D]/5 rounded-xl px-3 py-2 font-mono text-[8px] uppercase tracking-wider">
                          <span className="text-[#888888] font-bold">Column B</span>
                          <span className="text-[#0D0D0D] font-bold">Submitted At</span>
                        </div>

                        {selectedForm?.questions?.filter((q: any) => q.type !== "section").map((q: any, idx: number) => {
                          const colLetter = String.fromCharCode(67 + idx); // Start from C (ASCII 67)
                          return (
                            <div key={q.id} className="flex justify-between items-center bg-white border border-[#0D0D0D]/5 rounded-xl px-3 py-2 font-mono text-[8px] uppercase tracking-wider">
                              <span className="text-amber-800 font-bold">Column {colLetter}</span>
                              <span className="text-[#0D0D0D] font-bold truncate max-w-[140px]">{q.label || `Question ${q.id}`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </main>
        )}
      </div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      {/* MOBILE BOTTOM FLOATING NAVIGATION PILL */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-[#0D0D0D]/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-around py-3 px-2">
        <Link href="/dashboard" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <ClipboardList className="w-4 h-4 text-[#888888]" />
          <span>Forms</span>
        </Link>
        <Link href="/dashboard/aesthetics" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <Sparkles className="w-4 h-4 text-[#888888]" />
          <span>Design</span>
        </Link>
        <Link href="/dashboard/insights" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <BookOpen className="w-4 h-4 text-[#888888]" />
          <span>Insights</span>
        </Link>
        <Link href="/dashboard/integrations" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#0D0D0D] font-bold">
          <Layers className="w-4 h-4 text-[#0D0D0D]" />
          <span>Plugins</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <Settings className="w-4 h-4 text-[#888888]" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}
