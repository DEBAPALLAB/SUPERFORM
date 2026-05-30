"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Settings, FileText, BarChart2, LogOut, Loader2, Sparkles, X, ArrowRight, ClipboardList, BookOpen, Layers, MoreHorizontal, Trash2, Search } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface Form {
  id: string;
  title: string;
  questions: Record<string, unknown>[];
  aesthetic: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Extended form settings states
  const [selectedSettingsForm, setSelectedSettingsForm] = useState<Form | null>(null);
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsAesthetic, setSettingsAesthetic] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsRedirectUrl, setSettingsRedirectUrl] = useState("");
  const [settingsAllowedDomains, setSettingsAllowedDomains] = useState("");
  const [settingsResponseLimit, setSettingsResponseLimit] = useState("");
  const [settingsAcceptingResponses, setSettingsAcceptingResponses] = useState(true);
  const [settingsCloseAt, setSettingsCloseAt] = useState("");
  const [settingsCustomClosedMessage, setSettingsCustomClosedMessage] = useState("");
  const [settingsPasswordProtection, setSettingsPasswordProtection] = useState("");
  const [settingsOneResponsePerDevice, setSettingsOneResponsePerDevice] = useState(false);
  const [settingsSeoTitle, setSettingsSeoTitle] = useState("");
  const [settingsSeoDescription, setSettingsSeoDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Recent");

  const [tier, setTier] = useState("Free");

  useEffect(() => {
    // Delay clearing the hash so Supabase library has ample time to parse the access token
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("id_token"))) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      // 1. Instant cached check to prevent network lag on dashboard render
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch dynamic billing tier from profiles (Cache Pass)
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setTier(data.tier || "Free");
          });

        // Load initial forms immediately with cached user credentials
        const { data: formsData } = await supabase
          .from('forms')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (formsData) setForms(formsData);
        setIsLoading(false);
      }

      // 2. Perform secure background verification without blocking UI
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }
      setUser(user);

      // Verified dynamic billing tier check
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTier(profile.tier || "Free");
      }

      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (formsData) setForms(formsData);
      setIsLoading(false);
    }
    loadData();
  }, [router]);


  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [intentValue, setIntentValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  useEffect(() => {
    if (user) {
      const savedIntent = localStorage.getItem("superform_intent");
      if (savedIntent) {
        setIntentValue(savedIntent);
        setIsIntentOpen(true);
        localStorage.removeItem("superform_intent");
      }
    }
  }, [user]);

  const genSteps = [
    "Reading your intent...",
    "Structuring your questions...",
    "Choosing your aesthetic...",
    "Finalizing architecture..."
  ];

  const handleCreateForm = async (customIntent?: string) => {
    if (!user) return;
    
    const isBlank = customIntent === "Blank Form";

    if (!isBlank) {
      setIsGenerating(true);
      setGenStep(0);

      // Simulated Generation Sequence
      for (let i = 0; i < genSteps.length; i++) {
        setGenStep(i);
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }
    }
    
    try {
      let generatedData;
      if (isBlank) {
        generatedData = {
          title: "Untitled Superform",
          questions: [{ id: 1, type: "short", label: "Untitled Question", placeholder: "", description: "", required: false, maxChars: 100, buttonText: "Continue" }],
          aesthetic: "Minimal",
          surface: "Flat",
          typography: "MD",
          radius: "SM"
        };
      } else {
        // AI Generation Call
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ intent: customIntent || intentValue })
          });
          
          if (!res.ok) throw new Error("API responded with error");
          generatedData = await res.json();
        } catch (e) {
          console.error("AI Generation failed, falling back to default", e);
          generatedData = {
            title: intentValue || "New Superform",
            questions: [{ id: 1, type: "short", label: "What is your name?", placeholder: "Jane Doe", description: "", required: true, maxChars: 100, buttonText: "Continue" }],
            aesthetic: "Editorial",
            surface: "Flat",
            typography: "MD",
            radius: "SM"
          };
        }
      }

      const { data, error } = await supabase
        .from('forms')
        .insert([
          {
            user_id: user.id,
            title: generatedData.title || (isBlank ? "Untitled Superform" : intentValue) || "New Superform",
            questions: generatedData.questions,
            aesthetic: generatedData.aesthetic || "Editorial",
            surface: generatedData.surface || "Flat",
            typography: generatedData.typography || "MD",
            radius: generatedData.radius || "SM"
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        router.push(`/builder/${data.id}`);
      }
    } catch (err: unknown) {
      console.error("Critical error in form creation:", err);
      const msg = (err as Error).message || "Something went wrong.";
      alert(`Generation Error: ${msg}\n\nCheck if your Supabase table 'forms' has columns: user_id, title, questions, aesthetic, surface, typography, radius`);
      setIsGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleOpenSettings = (form: Form) => {
    setSelectedSettingsForm(form);
    setSettingsTitle(form.title);
    setSettingsAesthetic(form.aesthetic);
    
    // Read nested settings from the first question object
    const firstQ = form.questions?.[0] as any;
    const extraSettings = firstQ?.settings || {};
    setSettingsRedirectUrl(extraSettings.redirect_url || "");
    setSettingsAllowedDomains(extraSettings.allowed_domains || "");
    setSettingsResponseLimit(extraSettings.response_limit || "");
    setSettingsAcceptingResponses(extraSettings.accepting_responses !== undefined ? extraSettings.accepting_responses : true);
    setSettingsCloseAt(extraSettings.close_at || "");
    setSettingsCustomClosedMessage(extraSettings.custom_closed_message || "");
    setSettingsPasswordProtection(extraSettings.password_protection || "");
    setSettingsOneResponsePerDevice(!!extraSettings.one_response_per_device);
    setSettingsSeoTitle(extraSettings.seo_title || "");
    setSettingsSeoDescription(extraSettings.seo_description || "");
    
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedSettingsForm) return;
    try {
      // Embed extra settings inside the first question to keep it perfectly backward-compatible
      const updatedQuestions = [...selectedSettingsForm.questions] as any[];
      if (updatedQuestions.length > 0) {
        const firstQ = updatedQuestions[0];
        const currentSettings = firstQ.settings || {};
        updatedQuestions[0] = {
          ...firstQ,
          settings: {
            ...currentSettings,
            redirect_url: settingsRedirectUrl,
            allowed_domains: settingsAllowedDomains,
            response_limit: settingsResponseLimit,
            accepting_responses: settingsAcceptingResponses,
            close_at: settingsCloseAt,
            custom_closed_message: settingsCustomClosedMessage,
            password_protection: settingsPasswordProtection,
            one_response_per_device: settingsOneResponsePerDevice,
            seo_title: settingsSeoTitle,
            seo_description: settingsSeoDescription
          }
        };
      }

      const { error } = await supabase
        .from("forms")
        .update({
          title: settingsTitle,
          questions: updatedQuestions
        })
        .eq("id", selectedSettingsForm.id);

      if (error) throw error;
      setForms(prev => prev.map(f => f.id === selectedSettingsForm.id ? { ...f, title: settingsTitle, questions: updatedQuestions } : f));
      setIsSettingsOpen(false);
      setSelectedSettingsForm(null);
    } catch (err) {
      console.error("Failed to update form:", err);
      alert("Failed to save settings: " + (err as Error).message);
    }
  };

  const handleDeleteForm = async () => {
    if (!selectedSettingsForm) return;
    if (!confirm(`Are you absolutely sure you want to delete "${selectedSettingsForm.title}"?\nAll submissions will be permanently deleted.`)) return;

    try {
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", selectedSettingsForm.id);

      if (error) throw error;
      setForms(prev => prev.filter(f => f.id !== selectedSettingsForm.id));
      setIsSettingsOpen(false);
      setSelectedSettingsForm(null);
    } catch (err) {
      console.error("Failed to delete form:", err);
      alert("Failed to delete form: " + (err as Error).message);
    }
  };

  const getAestheticBadge = (aesthetic: string) => {
    switch (aesthetic) {
      case "Minimal":
        return <span className="px-2.5 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200/50">Minimal</span>;
      case "Brutalist":
        return <span className="px-2.5 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-tighter bg-black text-white font-black border border-black">Brutalist</span>;
      case "Editorial":
        return <span className="px-2.5 py-0.5 rounded-full font-serif text-[8px] italic tracking-wide bg-amber-50 text-amber-800 border border-amber-200/50">Editorial</span>;
      case "Cinematic":
        return <span className="px-2.5 py-0.5 rounded-md font-mono text-[8px] uppercase tracking-widest bg-slate-900 text-slate-100 border border-slate-950 font-medium">Cinematic</span>;
      case "Glass":
        return <span className="px-2.5 py-0.5 rounded-full font-serif text-[8px] italic tracking-wide bg-sky-50 text-sky-800 border border-sky-200/50 backdrop-blur-md">Glass Sheen</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-wider bg-[#F5F3F0] text-muted border border-border">Standard</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8F4] via-[#FDFCF7] to-[#F6F3EB] text-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Soft Ambient Light (Ochre and Peach glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-amber-500/[0.025] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[50%] bg-amber-600/[0.02] rounded-full blur-[150px] pointer-events-none" />
      
      {/* Editorial Cardstock Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 h-[56px] border-b border-[#0D0D0D]/5 bg-[#FAF8F4]/60 backdrop-blur-xl flex items-center justify-between px-6 shadow-sm">
        <Link href="/dashboard" className="font-display text-2xl tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity text-[#0D0D0D]">
          <svg className="w-7 h-7 rounded-[7px] shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dashboardSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="30%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#dashboardSfGrad)" letterSpacing="-0.03em">SF</text>
          </svg>
          Superform
        </Link>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsIntentOpen(true)}
            className="flex items-center gap-2 border border-[#0D0D0D]/10 bg-white/80 hover:bg-white hover:border-[#0D0D0D] px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Form
          </button>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-[#0D0D0D] text-[#FAF8F4] flex items-center justify-center font-mono text-[10px] uppercase shadow-sm">
              {user?.email?.charAt(0) || "U"}
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[#888888] hover:text-[#0D0D0D] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-grow relative z-10 min-h-0">
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden md:flex w-[240px] h-[calc(100vh-56px)] sticky top-[56px] border-r border-[#0D0D0D]/5 bg-white/40 backdrop-blur-xl shrink-0 flex-col justify-between transition-all duration-300">
          <div className="p-6 flex-1 overflow-y-auto premium-scrollbar flex flex-col">
            <div className="flex items-center gap-3 mb-8 bg-white/60 p-3 rounded-2xl border border-[#0D0D0D]/5 shadow-sm shrink-0">
              <svg className="w-8 h-8 rounded-xl shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sidebarSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="30%" stopColor="#FAF8F4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#sidebarSfGrad)" letterSpacing="-0.03em">SF</text>
              </svg>
              <div className="flex flex-col overflow-hidden">
                <span className="font-sans text-xs font-bold tracking-tight text-[#0D0D0D]">Main Space</span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Personal Workspace</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 shrink-0">
              {[
                { label: "Your Forms", icon: ClipboardList, active: true, href: "/dashboard" },
                { label: "Aesthetic Library", icon: Sparkles, active: false, href: "/dashboard/aesthetics" },
                { label: "Global Insights", icon: BookOpen, active: false, href: "/dashboard/insights" },
                { label: "Integrations", icon: Layers, active: false, href: "/dashboard/integrations" },
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
            <Link href="/dashboard/profile" className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-white/60 hover:bg-white border border-[#0D0D0D]/5 hover:border-[#0D0D0D]/10 hover:shadow-md transition-all duration-300 group">
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

        {/* MAIN DASHBOARD */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 pb-28 md:pb-8 overflow-y-auto premium-scrollbar">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#0D0D0D]/5 pb-4 mb-10 gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#888888] font-bold">Your Forms</h1>
                <span className="font-mono text-[8px] text-[#888888] tracking-widest uppercase">
                  {forms.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase())).length} of {forms.length} forms
                </span>
              </div>
              
              {/* Beautiful Left-Aligned Search Input */}
              <div className="flex items-center border border-[#0D0D0D]/10 bg-white/40 rounded-xl px-3 py-1.5 gap-2 w-64 focus-within:border-[#0D0D0D] focus-within:bg-white transition-all shadow-sm">
                <Search className="w-3.5 h-3.5 text-[#888888]" />
                <input 
                  type="text" 
                  placeholder="Search forms..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none border-none text-[10px] w-full font-mono text-[#0D0D0D] placeholder:opacity-50"
                />
              </div>
            </div>

            {/* Sort Control Switcher (Giving user control) */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-semibold">Sort:</span>
              <div className="flex bg-white/40 p-0.5 rounded-lg border border-[#0D0D0D]/5">
                {["Recent", "A-Z"].map((sortOption) => (
                  <button
                    key={sortOption}
                    onClick={() => setSortOrder(sortOption)}
                    className={clsx(
                      "py-1 px-3 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                      sortOrder === sortOption ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5 text-[#0D0D0D]" : "text-[#888888] hover:text-[#0D0D0D]"
                    )}
                  >
                    {sortOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {forms
                .filter(form => form.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => {
                  if (sortOrder === "A-Z") {
                    return a.title.localeCompare(b.title);
                  }
                  return 0; // Recent order (descending, defaulted by fetch)
                })
                .map((form) => (
                  <div 
                    key={form.id} 
                    className="group relative flex flex-col h-[280px] bg-white border-2 border-[#0D0D0D]/10 rounded-3xl shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_30px_75px_rgba(13,13,13,0.065)] hover:-translate-y-1.5 hover:border-[#0D0D0D] transition-all duration-500 p-8"
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-5 flex justify-between items-start">
                        {getAestheticBadge(form.aesthetic)}
                      </div>
                      
                      <h3 className="font-serif italic text-2.5xl leading-[1.1] group-hover:text-amber-800 transition-colors line-clamp-3 text-[#0D0D0D] font-bold">
                        {form.title}
                      </h3>
                      
                      <div className="mt-auto">
                        <div className="h-px w-full bg-[#0D0D0D]/8 mb-4" />
                        <div className="flex items-center gap-2 font-mono text-[9px] text-[#888888] tracking-wider uppercase font-semibold">
                          <span className="text-[#0D0D0D]">{form.questions?.length || 0} Questions</span>
                          <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
                          <span>Status: Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Tactile Overlay */}
                    <div className="absolute inset-0 bg-[#FAF8F4]/80 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                      <Link href={`/builder/${form.id}`} className="w-11 h-11 bg-[#0D0D0D] hover:bg-amber-800 text-[#FAF8F4] rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-black/10" title="Edit Form">
                        <FileText className="w-4 h-4" />
                      </Link>
                      <Link href={`/responses/${form.id}`} className="w-11 h-11 bg-white border border-[#0D0D0D]/10 hover:border-amber-800 text-[#0D0D0D] hover:text-amber-800 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-md" title="Analytics">
                        <BarChart2 className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleOpenSettings(form)}
                        className="w-11 h-11 bg-white border border-[#0D0D0D]/10 hover:border-amber-800 text-[#0D0D0D] hover:text-amber-800 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-md cursor-pointer" 
                        title="Settings"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* TACTILE NEW FORM CARD */}
              <button 
                onClick={() => setIsIntentOpen(true)}
                className="h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-[#0D0D0D]/15 hover:border-[#0D0D0D] bg-white rounded-3xl group transition-all duration-500 shadow-[0_15px_45px_rgba(13,13,13,0.02)] hover:shadow-[0_25px_60px_rgba(13,13,13,0.05)] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#0D0D0D]/15 flex items-center justify-center mb-4 group-hover:border-[#0D0D0D] group-hover:scale-110 transition-all bg-[#FAF8F5] shadow-sm">
                  <Plus className="w-5 h-5 text-muted group-hover:text-ink" />
                </div>
                <div className="font-serif italic text-lg text-muted group-hover:text-[#0D0D0D] transition-colors">Start with intent</div>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* INTENT MODAL */}
      <AnimatePresence>
        {isIntentOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#FAF8F4]/98 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <button 
              onClick={() => setIsIntentOpen(false)}
              className="absolute top-8 right-8 text-muted hover:text-[#0D0D0D] p-2 hover:bg-white rounded-full border border-transparent hover:border-[#0D0D0D]/5 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-2xl flex flex-col gap-12">
              <div className="flex flex-col gap-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted font-bold">What are you building?</div>
                
                <div className="relative border-b-2 border-[#0D0D0D] pb-4 group">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="I want to..."
                    className="w-full bg-transparent outline-none font-serif text-4xl italic placeholder:text-muted/20 pr-16 transition-all"
                    value={intentValue}
                    onChange={(e) => setIntentValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && intentValue && handleCreateForm()}
                  />
                  <div className="absolute right-0 bottom-4">
                    <button 
                      onClick={() => intentValue && handleCreateForm()}
                      className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                        intentValue ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-md hover:bg-amber-800" : "bg-border text-muted cursor-not-allowed"
                      )}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Blank Form Option */}
                <button 
                  onClick={() => handleCreateForm("Blank Form")}
                  className="text-[#888888] hover:text-[#0D0D0D] font-mono text-[8px] uppercase tracking-[0.25em] transition-colors flex items-center gap-1.5 w-max cursor-pointer font-bold mt-1"
                >
                  <span>+ Or start with a new blank Form</span>
                </button>

                <div className="flex flex-col gap-4 mt-4">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted">Or start with quick intent:</div>
                  <div className="flex flex-wrap gap-2">
                    {["Waitlist", "Application", "Event Feedback", "Survey"].map((chip) => (
                      <button 
                        key={chip}
                        onClick={() => {
                          setIntentValue(`A ${chip.toLowerCase()} form`);
                          handleCreateForm(chip.toLowerCase());
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#0D0D0D]/10 bg-white hover:border-[#0D0D0D] font-mono text-[9px] uppercase tracking-wider hover:bg-[#0D0D0D] hover:text-[#FAF8F4] transition-all cursor-pointer shadow-sm"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curated Pre-made Faded Scrollable Templates Grid (Downward Scroll) */}
                <div className="flex flex-col gap-3 mt-6 border-t border-[#0D0D0D]/5 pt-5">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-[#888888] font-bold">Curated Starter Templates:</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto premium-scrollbar pr-1 opacity-50 hover:opacity-100 transition-opacity duration-300">
                    {[
                      {
                        title: "Product Waitlist",
                        tag: "Editorial",
                        description: "Delicate email acquisition layout styled in warm cardboard cream with thin organic serif text rules.",
                        intent: "waitlist",
                        visual: (
                          <div className="bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-lg p-2 flex items-center justify-between mt-1">
                            <span className="font-serif italic text-[8px] text-[#0D0D0D]">Subscribers</span>
                            <span className="font-mono text-[7px] uppercase bg-amber-50 text-amber-800 border border-amber-200/50 px-1 py-0.5 rounded font-bold">+1.2k</span>
                          </div>
                        )
                      },
                      {
                        title: "Talent Intake Portal",
                        tag: "Minimalist",
                        description: "Professional job application builder featuring robust metadata, long description spaces, and requirements.",
                        intent: "application",
                        visual: (
                          <div className="bg-white border border-[#0D0D0D]/5 rounded-lg p-2 flex flex-col gap-1 mt-1">
                            <div className="h-1.5 w-full bg-[#FAF8F4] rounded-full overflow-hidden">
                              <div className="h-full bg-black rounded-full w-3/4" />
                            </div>
                            <span className="font-mono text-[6px] uppercase tracking-widest text-[#888888] font-semibold">Setup Complete • 75%</span>
                          </div>
                        )
                      },
                      {
                        title: "RSVP & Event Invitation",
                        tag: "Glass Sheen",
                        description: "High-end RSVP template featuring guest counts, aesthetic multi-choice chips, and confirmation controls.",
                        intent: "event feedback",
                        visual: (
                          <div className="bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-lg p-2 flex items-center justify-between mt-1">
                            <span className="font-sans text-[8px] font-bold text-[#0D0D0D]">Attending</span>
                            <span className="font-mono text-[7px] uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/50 px-1 py-0.5 rounded font-bold">98% Yes</span>
                          </div>
                        )
                      },
                      {
                        title: "User Satisfaction Survey",
                        tag: "Brutalist",
                        description: "Curated customer experience outline complete with custom numeric rating swatches and open feedback inputs.",
                        intent: "survey",
                        visual: (
                          <div className="flex gap-1.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} className="w-4 h-4 rounded-full border border-[#0D0D0D]/10 flex items-center justify-center font-mono text-[7px] bg-white font-bold">{n}</div>
                            ))}
                          </div>
                        )
                      }
                    ].map((tpl) => (
                      <button 
                        key={tpl.title}
                        onClick={() => {
                          setIntentValue(tpl.title);
                          handleCreateForm(tpl.intent);
                        }}
                        className="flex flex-col text-left p-4 bg-[#FAF8F4]/30 hover:bg-white border border-[#0D0D0D]/10 hover:border-[#0D0D0D] rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-serif italic text-sm text-[#0D0D0D] font-bold leading-tight">{tpl.title}</span>
                          <span className="font-mono text-[6px] uppercase tracking-widest bg-white border border-[#0D0D0D]/10 px-1.5 py-0.5 rounded-full text-[#888888] font-bold">{tpl.tag}</span>
                        </div>
                        <p className="font-mono text-[8px] uppercase tracking-wider leading-relaxed text-[#888888] w-[95%]">{tpl.description}</p>
                        {tpl.visual}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LOADING STATE OVERLAY */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#FAF8F4] z-[110] flex flex-col items-center justify-center gap-12"
                  >
                    {/* Animated Rule Line */}
                    <div className="absolute inset-0 flex flex-col justify-center overflow-hidden pointer-events-none">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="h-px w-full bg-gradient-to-r from-transparent via-[#0D0D0D]/10 to-transparent"
                      />
                    </div>

                    <div className="relative flex flex-col items-center gap-6">
                      <div className="w-12 h-12 rounded-full border-2 border-border border-t-amber-800 animate-spin" />
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={genStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="font-mono text-xs uppercase tracking-[0.2em] text-[#0D0D0D] font-bold"
                        >
                          {genSteps[genStep]}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXTENDED FORM SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && selectedSettingsForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#FAF8F4]/98 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <button 
              onClick={() => {
                setIsSettingsOpen(false);
                setSelectedSettingsForm(null);
              }}
              className="absolute top-8 right-8 text-muted hover:text-[#0D0D0D] p-2 hover:bg-white rounded-full border border-transparent hover:border-[#0D0D0D]/5 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-md bg-white border border-[#0D0D0D]/5 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
              <div className="border-b border-[#0D0D0D]/5 pb-4">
                <h3 className="font-serif italic text-2xl text-[#0D0D0D]">Extended Form Settings</h3>
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#888888] mt-1">Configure presets and properties for this form</p>
              </div>

              <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto premium-scrollbar pr-1">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Form Title</label>
                  <input 
                    type="text" 
                    value={settingsTitle}
                    onChange={(e) => setSettingsTitle(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                    placeholder="Enter form title"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Completion Redirect URL</label>
                  <input 
                    type="url" 
                    value={settingsRedirectUrl}
                    onChange={(e) => setSettingsRedirectUrl(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                    placeholder="https://example.com/thank-you"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Whitelisted Referring Domains</label>
                  <textarea 
                    value={settingsAllowedDomains}
                    onChange={(e) => setSettingsAllowedDomains(e.target.value)}
                    rows={2}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors resize-none"
                    placeholder="example.com&#10;localhost:3000"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Response Cap Limit</label>
                  <input 
                    type="number" 
                    value={settingsResponseLimit}
                    onChange={(e) => setSettingsResponseLimit(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                    placeholder="No limit (leave empty)"
                    min="1"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-[#0D0D0D]">Accepting Responses</span>
                    <span className="text-[8px] text-[#888888] uppercase font-mono tracking-wider">Turn submissions on or off</span>
                  </div>
                  <button
                    onClick={() => setSettingsAcceptingResponses(!settingsAcceptingResponses)}
                    className={clsx(
                      "w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none",
                      settingsAcceptingResponses ? "bg-[#0D0D0D]" : "bg-[#EAE6DF]"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                      settingsAcceptingResponses ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Scheduled Expiry (Close Date)</label>
                  <input 
                    type="datetime-local" 
                    value={settingsCloseAt}
                    onChange={(e) => setSettingsCloseAt(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Custom Closed Notice</label>
                  <textarea 
                    value={settingsCustomClosedMessage}
                    onChange={(e) => setSettingsCustomClosedMessage(e.target.value)}
                    rows={2}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors resize-none"
                    placeholder="We are no longer accepting submissions..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Passcode Lock (Optional)</label>
                  <input 
                    type="text" 
                    value={settingsPasswordProtection}
                    onChange={(e) => setSettingsPasswordProtection(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                    placeholder="Passcode for private access"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-[#0D0D0D]">Prevent Duplicate Submissions</span>
                    <span className="text-[8px] text-[#888888] uppercase font-mono tracking-wider">Limit to one response per device</span>
                  </div>
                  <button
                    onClick={() => setSettingsOneResponsePerDevice(!settingsOneResponsePerDevice)}
                    className={clsx(
                      "w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 relative outline-none",
                      settingsOneResponsePerDevice ? "bg-[#0D0D0D]" : "bg-[#EAE6DF]"
                    )}
                  >
                    <div className={clsx(
                      "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                      settingsOneResponsePerDevice ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">SEO Share Title (Og:Title)</label>
                  <input 
                    type="text" 
                    value={settingsSeoTitle}
                    onChange={(e) => setSettingsSeoTitle(e.target.value)}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors"
                    placeholder="Custom social share title"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">SEO Share Description (Og:Description)</label>
                  <textarea 
                    value={settingsSeoDescription}
                    onChange={(e) => setSettingsSeoDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-[#FAF8F4]/50 border border-[#0D0D0D]/10 rounded-xl p-3 text-xs outline-none focus:border-[#0D0D0D] transition-colors resize-none"
                    placeholder="Custom social share description"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-2 border-t border-[#0D0D0D]/5 pt-4">
                <button 
                  onClick={handleSaveSettings}
                  className="w-full bg-[#0D0D0D] hover:bg-amber-800 text-[#FAF8F4] py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-bold shadow-md transition-all duration-300 cursor-pointer"
                >
                  Save Configuration
                </button>
                
                <button 
                  onClick={handleDeleteForm}
                  className="w-full border border-red-200/50 bg-red-50/50 hover:bg-red-50 text-red-800 py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-bold flex justify-center items-center gap-1.5 transition-all duration-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Form Permanentely
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MOBILE BOTTOM FLOATING NAVIGATION PILL */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-[#0D0D0D]/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-around py-3 px-2">
        <Link href="/dashboard" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#0D0D0D] font-bold">
          <ClipboardList className="w-4 h-4 text-[#0D0D0D]" />
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
        <Link href="/dashboard/integrations" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <Layers className="w-4 h-4 text-[#888888]" />
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
