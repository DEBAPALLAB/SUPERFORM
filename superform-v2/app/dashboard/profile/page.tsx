"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, User, Mail, CreditCard, BarChart2, ShieldCheck, Key, RefreshCw, Copy, Check, Save, Sparkles, BookOpen, Layers, ClipboardList, Settings } from "lucide-react";
import clsx from "clsx";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [totalForms, setTotalForms] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);

  const [tier, setTier] = useState("Free");

  // Developer Preferences
  const [defaultAesthetic, setDefaultAesthetic] = useState("Editorial");
  const [defaultRadius, setDefaultRadius] = useState("SM");
  const [enableGrain, setEnableGrain] = useState(true);

  // API Key visual states
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/register?mode=login");
        return;
      }
      setUser(user);
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");

      // Fetch dynamic billing tier from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTier(profile.tier || "Free");
        if (profile.full_name) setFullName(profile.full_name);
      }

      // Dynamic count of total forms
      const { data: formsData } = await supabase
        .from("forms")
        .select("id")
        .eq("user_id", user.id);

      if (formsData) {
        setTotalForms(formsData.length);
        if (formsData.length > 0) {
          const formIds = formsData.map(f => f.id);
          const { data: respData } = await supabase
            .from("responses")
            .select("id")
            .in("form_id", formIds);
          if (respData) {
            setTotalResponses(respData.length);
          }
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      setSuccessMsg("Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert("Error updating profile: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateApiKey = () => {
    const randomBytes = Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiKey(`sf_live_${randomBytes}`);
    setSuccessMsg("New API Key generated.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8F4] via-[#FDFCF7] to-[#F6F3EB] text-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Soft Ambient Light Glows */}
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
              <linearGradient id="profileSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="30%" stopColor="#FAF8F4" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#profileSfGrad)" letterSpacing="-0.03em">SF</text>
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
        {/* SIDEBAR NAVIGATION (SHARED) */}
        <aside className="hidden md:flex w-[240px] h-[calc(100vh-56px)] sticky top-[56px] border-r border-[#0D0D0D]/5 bg-white/40 backdrop-blur-xl shrink-0 flex-col justify-between transition-all duration-300">
          <div className="p-6 flex-1 overflow-y-auto premium-scrollbar flex flex-col">
            <div className="flex items-center gap-3 mb-8 bg-white/60 p-3 rounded-2xl border border-[#0D0D0D]/5 shadow-sm shrink-0">
              <svg className="w-8 h-8 rounded-xl shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="profileSidebarSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="30%" stopColor="#FAF8F4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#profileSidebarSfGrad)" letterSpacing="-0.03em">SF</text>
              </svg>
              <div className="flex flex-col overflow-hidden">
                <span className="font-sans text-xs font-bold tracking-tight text-[#0D0D0D]">Main Space</span>
                <span className="font-mono text-[7px] uppercase tracking-widest text-[#888888] mt-0.5">Personal Workspace</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 shrink-0">
              {[
                { label: "Your Forms", icon: BarChart2, active: false, href: "/dashboard" },
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

          <div className="p-6 border-t border-[#0D0D0D]/5 bg-white/40 shrink-0">
            <div className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-white border border-amber-800/20 shadow-md">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center font-mono text-[10px] uppercase font-bold">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[9px] font-mono uppercase tracking-widest truncate w-full text-left font-bold text-amber-800">
                  {fullName}
                </span>
                <span className="text-[8px] font-mono text-amber-800 uppercase tracking-widest font-semibold">Active Settings</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN PROFILE WRAPPER */}
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
                <h1 className="font-serif italic text-3xl text-[#0D0D0D]">Account Settings</h1>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1.5">Manage your profile, visual settings, and API preferences</p>
              </div>

              {/* SUCCESS POPUP */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-mono text-[9px] uppercase tracking-wider font-semibold flex items-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* PROFILE CARD */}
                <div className="md:col-span-7 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div>
                      <div className="flex items-center gap-4 border-b border-[#0D0D0D]/5 pb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl flex items-center justify-center font-display text-xl shadow-inner shadow-black/10 shrink-0">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-serif italic text-lg text-[#0D0D0D]">{fullName}</span>
                          <div className="flex items-center gap-2.5 mt-1">
                            <span className="px-2 py-0.5 rounded-full font-mono text-[7px] uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/50 w-max font-bold">{tier} Plan</span>
                            <button
                              type="button"
                              onClick={() => router.push("/pricing")}
                              className="text-[8px] font-mono uppercase tracking-widest text-[#0D0D0D] hover:text-amber-800 underline transition-colors cursor-pointer bg-transparent border-none p-0 font-bold"
                            >
                              {tier === "Free" ? "Upgrade" : "Manage"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3.5 mt-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Full Name</label>
                          <div className="flex items-center border border-[#0D0D0D]/10 bg-[#FAF8F4]/30 rounded-lg focus-within:border-[#0D0D0D] transition-colors px-3 py-2 gap-2">
                            <User className="w-3.5 h-3.5 text-[#888888]" />
                            <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="bg-transparent outline-none border-none text-xs w-full text-[#0D0D0D]"
                              placeholder="Jane Doe"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Email Address</label>
                          <div className="flex items-center border border-[#0D0D0D]/10 bg-[#FAF8F4]/20 rounded-lg px-3 py-2 gap-2 opacity-50 cursor-not-allowed">
                            <Mail className="w-3.5 h-3.5 text-[#888888]" />
                            <input 
                              type="email" 
                              disabled
                              value={email}
                              className="bg-transparent outline-none border-none text-xs w-full text-[#0D0D0D] cursor-not-allowed font-medium"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={updating}
                          className="w-full bg-[#0D0D0D] hover:bg-amber-800 text-[#FAF8F4] py-2.5 rounded-lg font-mono text-[8px] uppercase tracking-widest hover:shadow-md transition-all duration-300 flex justify-center items-center gap-1.5 font-bold cursor-pointer mt-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {updating ? "Saving..." : "Save Changes"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* WORKSPACE USAGE CARD */}
                <div className="md:col-span-5 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <h3 className="font-serif italic text-base text-[#0D0D0D]">Workspace Usage</h3>
                        <CreditCard className="w-4 h-4 text-[#888888]" />
                      </div>

                      <div className="flex flex-col gap-4 flex-1 justify-center">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono text-[8px] uppercase font-bold">
                            <span>Forms Created</span>
                            <span>{totalForms} / 10 limit</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((totalForms / 10) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono text-[8px] uppercase font-bold">
                            <span>Monthly Responses</span>
                            <span>{totalResponses} / 100 limit</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#FAF8F4] border border-[#0D0D0D]/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((totalResponses / 100) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                       <div className="flex flex-col gap-2 mt-1">
                        <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl text-[8px] font-mono uppercase text-amber-800 tracking-wider font-semibold leading-relaxed">
                          Need higher quotas? Upgrade to the Creator plan for 5,000 monthly responses and custom branding.
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/pricing")}
                          className="w-full bg-[#0D0D0D] hover:bg-amber-850 hover:shadow-lg hover:shadow-black/5 active:scale-[0.99] text-[#FAF8F4] py-2 rounded-xl font-mono text-[8px] uppercase tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {tier === "Free" ? "Upgrade Plan" : "Change or Manage Plan"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DEVELOPER CREDENTIALS KEY */}
                <div className="md:col-span-7 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <h3 className="font-serif italic text-base text-[#0D0D0D]">Developer Integrations</h3>
                        <Key className="w-4 h-4 text-[#888888]" />
                      </div>

                      <div className="flex flex-col gap-2 flex-1 justify-center">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Superform Webhook API Key</label>
                        
                        {apiKey ? (
                          <div className="flex items-center border border-[#0D0D0D]/10 bg-[#FAF8F4] rounded-lg overflow-hidden p-1 pl-3">
                            <input 
                              type="text" 
                              readOnly
                              value={apiKey}
                              className="bg-transparent outline-none border-none text-[9px] font-mono w-full text-[#0D0D0D] select-all truncate"
                            />
                            <button 
                              onClick={handleCopyKey}
                              className={clsx(
                                "px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest rounded-md flex items-center gap-1 transition-all shrink-0 cursor-pointer",
                                copied ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-[#0D0D0D] text-[#FAF8F4]"
                              )}
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        ) : (
                          <div className="border border-dashed border-[#0D0D0D]/10 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2.5">
                            <p className="font-mono text-[8px] text-[#888888] uppercase tracking-widest">No API keys constructed yet</p>
                            <button 
                              onClick={handleGenerateApiKey}
                              className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-white border border-[#0D0D0D]/10 hover:border-[#0D0D0D] rounded-md font-mono text-[8px] uppercase tracking-wider text-[#0D0D0D] transition-all cursor-pointer shadow-sm"
                            >
                              Generate Webhook Key
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRESET PREFERENCES CARD */}
                <div className="md:col-span-5 flex">
                  <div className="bg-white border border-[#0D0D0D]/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between w-full h-full gap-5">
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="flex items-center justify-between border-b border-[#0D0D0D]/5 pb-3">
                        <h3 className="font-serif italic text-base text-[#0D0D0D]">Default Form Presets</h3>
                      </div>
                      
                      <div className="flex flex-col gap-3 flex-1 justify-center">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Aesthetic Profile</label>
                          <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                            {["Editorial", "Minimal", "Brutalist"].map((aes) => (
                              <button 
                                key={aes} 
                                onClick={() => setDefaultAesthetic(aes)} 
                                className={clsx(
                                  "flex-1 py-1 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                  defaultAesthetic === aes ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5" : "text-[#888888] hover:text-[#0D0D0D]"
                                )}
                              >
                                {aes}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Corner Radii</label>
                          <div className="flex bg-[#FAF8F4] p-0.5 rounded-lg border border-[#0D0D0D]/5">
                            {["None", "SM", "Full"].map((rad) => (
                              <button 
                                key={rad} 
                                onClick={() => setDefaultRadius(rad)} 
                                className={clsx(
                                  "flex-1 py-1 text-[7px] uppercase font-mono tracking-wider rounded-md transition-all cursor-pointer",
                                  defaultRadius === rad ? "bg-white shadow-sm font-bold border border-[#0D0D0D]/5" : "text-[#888888] hover:text-[#0D0D0D]"
                                )}
                              >
                                {rad}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-[#888888]">Enable Film Grain</span>
                          <button 
                            onClick={() => setEnableGrain(!enableGrain)}
                            className={clsx(
                              "w-7 h-3.5 rounded-full transition-all relative cursor-pointer",
                              enableGrain ? "bg-[#0D0D0D]" : "bg-[#FAF8F4] border border-[#0D0D0D]/10"
                            )}
                          >
                            <div className={clsx(
                              "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                              enableGrain ? "right-0.5 bg-white" : "left-0.5 bg-[#888888]"
                            )} />
                          </button>
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
        <Link href="/dashboard/integrations" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#0D0D0D] transition-colors">
          <Layers className="w-4 h-4 text-[#888888]" />
          <span>Plugins</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#0D0D0D] font-bold">
          <Settings className="w-4 h-4 text-[#0D0D0D]" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}
