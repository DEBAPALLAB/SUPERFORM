"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sparkles, Settings, Eye, Sliders, Palette, Layers, Terminal, ToggleLeft, ToggleRight, Check, Copy } from "lucide-react";
import clsx from "clsx";

export default function IntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  
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

  const getSidebarNavClass = (active: boolean) => clsx(
    "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer w-full text-left",
    active ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-lg shadow-black/5 font-semibold" : "text-[#888888] hover:text-[#0D0D0D] hover:bg-white/80"
  );

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
              <Link href="/dashboard/insights" className={getSidebarNavClass(false)}>
                <Sliders className="w-3.5 h-3.5" /> Global Insights
              </Link>
              <Link href="/dashboard/integrations" className={getSidebarNavClass(true)}>
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

            </div>
          </main>
        )}
      </div>
      <style>{`@keyframes slide-rule{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
