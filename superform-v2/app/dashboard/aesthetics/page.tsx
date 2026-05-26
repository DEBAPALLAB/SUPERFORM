"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sparkles, Settings, Eye, Check, Sliders, Palette, Type, SquareDot } from "lucide-react";
import clsx from "clsx";

export default function AestheticLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("Editorial");
  const [copiedToken, setCopiedToken] = useState(false);

  // Live Token States
  const [cornerRadius, setCornerRadius] = useState("sm");
  const [borderWeight, setBorderWeight] = useState("1px");
  const [typography, setTypography] = useState("Serif");
  const [enableNoise, setEnableNoise] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    loadUser();
  }, [router]);

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

  const getSidebarNavClass = (active: boolean) => clsx(
    "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer w-full text-left",
    active ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-lg shadow-black/5 font-semibold" : "text-[#888888] hover:text-[#0D0D0D] hover:bg-white/80"
  );

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
              <Link href="/dashboard/aesthetics" className={getSidebarNavClass(true)}>
                <Sparkles className="w-3.5 h-3.5" /> Aesthetic Library
              </Link>
              <Link href="/dashboard/insights" className={getSidebarNavClass(false)}>
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
                <h1 className="font-serif italic text-3xl text-[#0D0D0D]">Aesthetic Library</h1>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1.5">Style your collection with premium preset layouts or construct custom design tokens</p>
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
                            "flex items-start text-left border rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-sm",
                            selectedPreset === preset.name 
                              ? "border-[#0D0D0D] bg-[#FAF8F4]/40" 
                              : "border-[#0D0D0D]/5 bg-white hover:border-[#0D0D0D]/20 hover:bg-[#FAF8F4]/10"
                          )}
                        >
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center justify-between">
                              <span className={clsx("text-base tracking-wide", preset.font)}>
                                {preset.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={clsx("w-3 h-3 rounded-full border border-black/10", preset.accentColor)} />
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

                    <div className={clsx(
                      "border border-[#0D0D0D]/10 rounded-xl p-5 flex flex-col gap-3 min-h-[160px] justify-center transition-all duration-500",
                      selectedPreset === "Glass Sheen" ? "bg-slate-950 text-white border-white/10" : "bg-[#FAF8F4]"
                    )}>
                      <div className="flex flex-col gap-1">
                        <span className={clsx(
                          "text-base",
                          typography === "Serif" ? "font-serif italic" : typography === "Sans" ? "font-sans font-bold" : "font-mono"
                        )}>
                          Previewing Form Header
                        </span>
                        <p className="font-mono text-[8px] uppercase tracking-wider opacity-60">Curated layout design system</p>
                      </div>

                      <div className="flex items-center border border-[#0D0D0D]/10 rounded-lg p-2 bg-white/20 backdrop-blur-md">
                        <input
                          type="text"
                          disabled
                          placeholder="Your Response Here..."
                          className="bg-transparent outline-none border-none text-[10px] w-full cursor-not-allowed placeholder:opacity-50"
                        />
                      </div>

                      <button
                        className={clsx(
                          "w-full py-2 font-mono text-[8px] uppercase tracking-widest font-bold shadow-md",
                          cornerRadius === "none" ? "rounded-none" : cornerRadius === "sm" ? "rounded-md" : "rounded-full",
                          selectedPreset === "Glass Sheen" ? "bg-sky-500 text-white" : "bg-[#0D0D0D] text-[#FAF8F4]"
                        )}
                      >
                        Submit Response
                      </button>
                    </div>
                  </div>

                  {/* TOKENS ADJUSTER PANEL */}
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4 flex-1">
                    <h3 className="font-serif italic text-base border-b border-[#0D0D0D]/5 pb-2 text-[#0D0D0D]">Design System Tokens</h3>

                    <div className="flex flex-col gap-3">
                      
                      {/* Radius */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Border Radius</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["none", "sm", "lg"].map((r) => (
                            <button
                              key={r}
                              onClick={() => setCornerRadius(r)}
                              className={clsx(
                                "flex-1 py-1 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                cornerRadius === r ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Default Typography</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["Serif", "Sans", "Mono"].map((t) => (
                            <button
                              key={t}
                              onClick={() => setTypography(t)}
                              className={clsx(
                                "flex-1 py-1 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                typography === t ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border Weight */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Border Weight</label>
                        <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                          {["0px", "1px", "2px"].map((w) => (
                            <button
                              key={w}
                              onClick={() => setBorderWeight(w)}
                              className={clsx(
                                "flex-1 py-1 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                borderWeight === w ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5" : "text-[#888888] hover:text-[#0D0D0D]"
                              )}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* JSON Token Copy Trigger */}
                      <button
                        onClick={handleCopyJSON}
                        className={clsx(
                          "w-full py-2.5 font-mono text-[8px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2",
                          copiedToken ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-[#0D0D0D] text-[#FAF8F4] hover:bg-amber-800"
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
    </div>
  );
}
