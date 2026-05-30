"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sparkles, Settings, Eye, Check, Sliders, Palette, Type, SquareDot, ClipboardList, BookOpen, Layers } from "lucide-react";
import clsx from "clsx";

export default function AestheticLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("Editorial");
  const [copiedToken, setCopiedToken] = useState(false);

  // Dynamic Forms and Application States
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [tier, setTier] = useState("Free");

  // Live Token States
  const [cornerRadius, setCornerRadius] = useState("sm");
  const [borderWeight, setBorderWeight] = useState("1px");
  const [typography, setTypography] = useState("Serif");
  const [enableNoise, setEnableNoise] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Instant cached check to prevent network lag
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

        // Fetch user's forms
        const { data: formsData } = await supabase
          .from("forms")
          .select("id, title, aesthetic, surface, typography, radius")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (formsData) {
          setForms(formsData);
          if (formsData.length > 0) {
            const firstForm = formsData[0];
            setSelectedFormId(firstForm.id);
            if (firstForm.aesthetic) setSelectedPreset(firstForm.aesthetic);
            if (firstForm.radius) setCornerRadius(firstForm.radius.toLowerCase());
            if (firstForm.typography) setTypography(firstForm.typography === "MD" ? "Sans" : firstForm.typography);
          }
        }
        setLoading(false);
      }

      // 2. Background secure verification
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
        .from("forms")
        .select("id, title, aesthetic, surface, typography, radius")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (formsData) {
        setForms(formsData);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  // Sync token states when user changes active form dropdown
  const handleFormChange = (formId: string) => {
    setSelectedFormId(formId);
    const selectedForm = forms.find(f => f.id === formId);
    if (selectedForm) {
      if (selectedForm.aesthetic) setSelectedPreset(selectedForm.aesthetic);
      if (selectedForm.radius) setCornerRadius(selectedForm.radius.toLowerCase());
      if (selectedForm.typography) setTypography(selectedForm.typography === "MD" ? "Sans" : selectedForm.typography);
    }
  };

  const presets = [
    {
      name: "Editorial",
      description: "Classically elegant, editorial style. Serif-first headers, soft cardboard tone backdrop, paper thin rules, and subtle organic texture overlay.",
      bg: "bg-[#FAF8F4]",
      textColor: "text-[#0D0D0D]",
      borderColor: "border-[#0D0D0D]/10",
      accentColor: "bg-amber-600",
      font: "font-serif italic",
      tokens: { radius: "sm", border: "1px", typography: "Serif" }
    },
    {
      name: "Minimalist",
      description: "Stripped down to the bare essentials. Ultra-light geometric sans-serif fonts, sharp corners, zero unnecessary borders, absolute premium whitespace.",
      bg: "bg-white",
      textColor: "text-zinc-900",
      borderColor: "border-zinc-100",
      accentColor: "bg-black",
      font: "font-sans font-light",
      tokens: { radius: "none", border: "0px", typography: "Sans" }
    },
    {
      name: "Brutalist",
      description: "High-contrast, bold, neo-brutalist aesthetic. Strong offset shadows, heavy outlines, custom monospaced letterings, and vibrant high-energy interactive blocks.",
      bg: "bg-white",
      textColor: "text-black",
      borderColor: "border-black border-2",
      accentColor: "bg-yellow-400",
      font: "font-mono font-black",
      tokens: { radius: "none", border: "2px", typography: "Mono" }
    },
    {
      name: "Glass Sheen",
      description: "Sleek and glossy dark glassmorphism. Deep backdrops, blurred glass panels, delicate transparent borders, and soft glowing ambient micro-indicators.",
      bg: "bg-slate-900",
      textColor: "text-slate-100",
      borderColor: "border-white/10",
      accentColor: "bg-sky-500",
      font: "font-sans",
      tokens: { radius: "lg", border: "1px", typography: "Sans" }
    }
  ];

  const handleApplyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const selected = presets.find(p => p.name === presetName);
    if (selected) {
      setCornerRadius(selected.tokens.radius);
      setBorderWeight(selected.tokens.border);
      setTypography(selected.tokens.typography);
    }
  };

  const handleApplyStyling = async () => {
    if (!selectedFormId) return;
    setIsApplying(true);
    setApplySuccess(false);

    try {
      const { error } = await supabase
        .from("forms")
        .update({
          aesthetic: selectedPreset,
          radius: cornerRadius.toUpperCase(),
          typography: typography === "Sans" ? "MD" : typography
        })
        .eq("id", selectedFormId);

      if (error) throw error;
      
      // Update local state forms array
      setForms(prev => prev.map(f => f.id === selectedFormId ? { 
        ...f, 
        aesthetic: selectedPreset, 
        radius: cornerRadius.toUpperCase(), 
        typography: typography === "Sans" ? "MD" : typography 
      } : f));

      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to apply aesthetic:", err);
      alert("Failed to apply aesthetic styles: " + (err as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopyJSON = () => {
    const tokenObj = {
      preset: selectedPreset,
      borderRadius: cornerRadius === "none" ? "0px" : cornerRadius === "sm" ? "8px" : "24px",
      borderWidth: borderWeight,
      fontFamily: typography === "Serif" ? "Newsreader, Playfair, serif" : typography === "Sans" ? "Inter, Outfit, sans-serif" : "JetBrains Mono, Courier, monospace",
      ambientGrain: enableNoise ? "true" : "false",
      theme: selectedPreset === "Glass Sheen" ? "dark" : "light"
    };

    navigator.clipboard.writeText(JSON.stringify(tokenObj, null, 2));
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8F4] via-[#FDFCF7] to-[#F6F3EB] text-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Soft glows */}
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
              <linearGradient id="aestheticSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="30%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#aestheticSfGrad)" letterSpacing="-0.03em">SF</text>
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
                  <linearGradient id="aestheticSidebarSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="30%" stopColor="#FAF8F4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#aestheticSidebarSfGrad)" letterSpacing="-0.03em">SF</text>
              </svg>
              <div className="flex flex-col overflow-hidden">
                <span className="font-sans text-xs font-bold tracking-tight text-[#0D0D0D]">Main Space</span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Personal Workspace</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 shrink-0">
              {[
                { label: "Your Forms", icon: ClipboardList, active: false, href: "/dashboard" },
                { label: "Aesthetic Library", icon: Sparkles, active: true, href: "/dashboard/aesthetics" },
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
              <div className="border-b border-[#0D0D0D]/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif italic text-3xl text-[#0D0D0D]">Aesthetic Studio</h1>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1.5">Apply premium typography, border structures, and grain aesthetics to your active forms</p>
                </div>
                
                {/* Form Selection dropdown */}
                {forms.length > 0 && (
                  <div className="flex flex-col gap-1 w-64 shrink-0">
                    <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Target Form Design</label>
                    <select
                      value={selectedFormId}
                      onChange={(e) => handleFormChange(e.target.value)}
                      className="bg-white border border-[#0D0D0D]/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#0D0D0D] transition-colors font-sans font-medium"
                    >
                      {forms.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BENTO LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* PRESETS LIST (LEFT) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full">
                    <h3 className="font-serif italic text-lg border-b border-[#0D0D0D]/5 pb-2 text-[#0D0D0D]">Curated Visual Presets</h3>
                    
                    <div className="grid grid-cols-1 gap-3.5">
                      {presets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleApplyPreset(preset.name)}
                          className={clsx(
                            "flex items-start text-left border rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-sm relative overflow-hidden group",
                            selectedPreset === preset.name 
                              ? "border-[#0D0D0D] bg-[#FAF8F4]/40" 
                              : "border-[#0D0D0D]/5 bg-white hover:border-[#0D0D0D]/20 hover:bg-[#FAF8F4]/10"
                          )}
                        >
                          <div className="flex flex-col gap-2 w-full z-10">
                            <div className="flex items-center justify-between">
                              <span className={clsx("text-base tracking-wide font-bold", preset.font)}>
                                {preset.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={clsx("w-3 h-3 rounded-full border border-black/10 shrink-0", preset.accentColor)} />
                                {selectedPreset === preset.name && <Check className="w-4 h-4 text-amber-800" />}
                              </div>
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-wider leading-relaxed text-[#888888] w-[95%]">
                              {preset.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* THE LIVE PREVIEW CANVAS & DESIGN TOKENS (RIGHT) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* LIVE PREVIEW SHIELD */}
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-2">
                      <h3 className="font-serif italic text-base text-[#0D0D0D]">Live Surface Preview</h3>
                      <Eye className="w-4 h-4 text-[#888888]" />
                    </div>

                    <div 
                      className={clsx(
                        "border rounded-2xl p-6 flex flex-col gap-4 min-h-[180px] justify-center transition-all duration-500 relative overflow-hidden",
                        selectedPreset === "Glass Sheen" ? "bg-slate-950 text-white border-white/10" : "bg-[#FAF8F4] border-[#0D0D0D]/10"
                      )}
                      style={{
                        borderWidth: borderWeight,
                        borderRadius: cornerRadius === "none" ? "0px" : cornerRadius === "sm" ? "12px" : "28px"
                      }}
                    >
                      {/* Film grain effect if enabled */}
                      {enableNoise && (
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
                          style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} 
                        />
                      )}

                      <div className="flex flex-col gap-1 z-10">
                        <span className={clsx(
                          "text-lg font-bold leading-tight",
                          typography === "Serif" ? "font-serif italic" : typography === "Sans" ? "font-sans font-extrabold" : "font-mono"
                        )}>
                          Form Title Preview
                        </span>
                        <p className="font-mono text-[8px] uppercase tracking-widest opacity-60">Interactive canvas mockup</p>
                      </div>

                      <div 
                        className="flex items-center border border-[#0D0D0D]/10 p-2.5 bg-white/20 backdrop-blur-md z-10"
                        style={{
                          borderRadius: cornerRadius === "none" ? "0px" : cornerRadius === "sm" ? "8px" : "16px"
                        }}
                      >
                        <input
                          type="text"
                          disabled
                          placeholder="Your Response Here..."
                          className="bg-transparent outline-none border-none text-xs w-full cursor-not-allowed placeholder:opacity-50"
                        />
                      </div>

                      <button
                        type="button"
                        className={clsx(
                          "w-full py-2.5 font-mono text-[8px] uppercase tracking-widest font-bold shadow-md z-10 active:scale-[0.99] transition-transform",
                          cornerRadius === "none" ? "rounded-none" : cornerRadius === "sm" ? "rounded-xl" : "rounded-full",
                          selectedPreset === "Glass Sheen" ? "bg-sky-500 text-white hover:bg-sky-600" : "bg-[#0D0D0D] text-[#FAF8F4] hover:bg-[#1a1a1a]"
                        )}
                      >
                        Submit Response
                      </button>
                    </div>
                  </div>

                  {/* TOKENS ADJUSTER PANEL */}
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4 flex-1">
                    <h3 className="font-serif italic text-base border-b border-[#0D0D0D]/5 pb-2 text-[#0D0D0D]">Design System Tokens</h3>

                    <div className="flex flex-col gap-3.5">
                      
                      {/* Radius */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Border Radius</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["none", "sm", "lg"].map((r) => (
                            <button
                              key={r}
                              onClick={() => setCornerRadius(r)}
                              className={clsx(
                                "flex-1 py-1.5 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                cornerRadius === r ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5 text-[#0D0D0D]" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Default Typography</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["Serif", "Sans", "Mono"].map((t) => (
                            <button
                              key={t}
                              onClick={() => setTypography(t)}
                              className={clsx(
                                "flex-1 py-1.5 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                typography === t ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5 text-[#0D0D0D]" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border Weight */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888] font-bold">Border Weight</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["0px", "1px", "2px"].map((w) => (
                            <button
                              key={w}
                              onClick={() => setBorderWeight(w)}
                              className={clsx(
                                "flex-1 py-1.5 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                borderWeight === w ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5 text-[#0D0D0D]" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-[#0D0D0D]/5 w-full my-1" />

                      {/* DATABASE APPLY BUTTON */}
                      <button
                        onClick={handleApplyStyling}
                        disabled={isApplying || forms.length === 0}
                        className={clsx(
                          "w-full py-2.5 font-mono text-[8px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md font-bold text-white",
                          applySuccess 
                            ? "bg-emerald-600 shadow-emerald-500/10" 
                            : "bg-[#0D0D0D] hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isApplying ? (
                          <span>Applying Design...</span>
                        ) : applySuccess ? (
                          <span>Styles Applied!</span>
                        ) : (
                          <span>Apply Styling to Form</span>
                        )}
                      </button>

                      {/* JSON Token Copy Trigger */}
                      <button
                        onClick={handleCopyJSON}
                        className={clsx(
                          "w-full py-2.5 font-mono text-[8px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#0D0D0D]/10 hover:border-[#0D0D0D]/30",
                          copiedToken ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-transparent text-[#0D0D0D]"
                        )}
                      >
                        {copiedToken ? "Tokens Copied" : "Copy Design Tokens JSON"}
                      </button>

                    </div>
                  </div>

                </div>

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
        <Link href="/dashboard/aesthetics" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#0D0D0D] font-bold">
          <Sparkles className="w-4 h-4 text-[#0D0D0D]" />
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
