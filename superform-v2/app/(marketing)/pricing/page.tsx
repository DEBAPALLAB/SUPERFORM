"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ArrowRight, Check, Minus, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BillingCycle = "monthly" | "annual";

interface Tier {
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const Tiers: Tier[] = [
  {
    name: "FREE",
    priceMonthly: 0,
    priceAnnual: 0,
    description: "Ideal for individual creators launching clean, light-touch projects.",
    features: [
      "100 Responses / month limit",
      "Minimal & Brutalist Art Directions",
      "Standard responses stream panel",
      "Standard spring slide transitions",
      "Public superform.so/f/ link"
    ],
    cta: "Get Started Free"
  },
  {
    name: "CREATOR",
    priceMonthly: 499,
    priceAnnual: 399, // ₹399/mo billed annually
    description: "Engineered for active startups, builders, and high-fidelity writers.",
    features: [
      "5,000 Responses / month limit",
      "All 5 Art Directions (Minimal, Editorial, Brutalist, Cinematic, Glass)",
      "Analytical drop-off maps & completion metrics",
      "Advanced physics spring transitions (Slide, Fade, Zoom, Flip)",
      "Film grain overlays & corner radius adjustments",
      "Custom ending page redirects",
      "Zapier & Webhook integrations"
    ],
    cta: "Start Creator Trial",
    popular: true
  },
  {
    name: "STUDIO",
    priceMonthly: 1499,
    priceAnnual: 1199,
    description: "Designed for scaling agencies, design systems, and fast brands.",
    features: [
      "Unlimited Responses limit",
      "Multiple user accounts & workspaces",
      "Custom CSS styling injection",
      "Custom brand typography & google fonts upload",
      "Remove all built-in branding marks",
      "Priority response SLA guarantees",
      "Dedicated Slack account support"
    ],
    cta: "Upgrade to Studio"
  }
];

interface FeatureRow {
  name: string;
  free: string | boolean;
  creator: string | boolean;
  studio: string | boolean;
}

const COMPARISON_GRID: FeatureRow[] = [
  { name: "Monthly Responses", free: "100", creator: "5,000", studio: "Unlimited" },
  { name: "Art Directions Available", free: "2 (Minimal, Brutalist)", creator: "All 5", studio: "All 5 + Custom CSS" },
  { name: "Transitions Engine", free: "Standard Slide", creator: "All (Slide, Fade, Zoom, Flip)", studio: "All + Custom Curves" },
  { name: "Film Grain & Radii Refines", free: false, creator: true, studio: true },
  { name: "Drop-off maps & Analytics", free: "Standard Stream", creator: "Advanced Metrics", studio: "Advanced Metrics + Export" },
  { name: "Custom Ending Page Redirects", free: false, creator: true, studio: true },
  { name: "Workspace Collaborators", free: "1 User", creator: "3 Users", studio: "Unlimited" },
  { name: "Branding Removal Option", free: false, creator: false, studio: true },
  { name: "SLA Priorities Support", free: false, creator: false, studio: true }
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [user, setUser] = useState<any>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCta = async (tier: Tier) => {
    if (tier.name === "FREE") {
      router.push("?start=true");
      return;
    }

    // Force sign up/in first so we can tie the subscription to a valid user account
    if (!user) {
      router.push(`/register?mode=signup&redirect=pricing`);
      return;
    }

    try {
      setLoadingTier(tier.name);
      
      // 1. Load checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment portal script. Please check your network connection.");
        setLoadingTier(null);
        return;
      }

      // 2. Initialize subscription on backend
      const res = await fetch("/api/billing/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: tier.name.toLowerCase(),
          billingCycle: billingCycle,
          email: user.email,
          userId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to initialize payment.");
      }

      // 3. Launch Checkout Modal
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Superform",
        description: `${tier.name} Subscription Plan`,
        image: "/icon.svg",
        handler: async function (response: any) {
          try {
            // Success Callback -> Crypotographically verify and instantly upgrade
            const verifyRes = await fetch("/api/billing/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id || data.subscriptionId,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                planType: tier.name.toLowerCase()
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Instant payment verification failed.");
            }

            router.push("/dashboard?payment=success");
          } catch (err: any) {
            console.error("Instant verification error:", err);
            // Fallback: Webhook will still process asynchronously, redirect to dashboard
            router.push("/dashboard?payment=pending");
          }
        },
        prefill: {
          name: user.email?.split("@")[0] || "",
          email: user.email || ""
        },
        theme: {
          color: "#0D0D0D"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Payment initialization failed. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <main className="flex-grow flex flex-col bg-[#FAF8F4] text-[#0D0D0D]">
      {/* HERO SECTION */}
      <section className="border-b border-[#E5E5E5] px-6 py-20 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-12 bottom-0 w-px bg-[#0D0D0D]/5 hidden md:block" />
        <div className="absolute top-0 right-12 bottom-0 w-px bg-[#0D0D0D]/5 hidden md:block" />

        <div className="max-w-3xl relative z-10 flex flex-col items-center">
          <div className="font-mono text-xs text-[#888888] tracking-[0.25em] uppercase mb-6 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#0D0D0D]" /> THE PRICING MODEL
          </div>
          <h1 className="font-display text-6xl lg:text-9xl leading-[0.9] tracking-tight mb-8">
            HONEST &<br />TRANSPARENT.
          </h1>
          <p className="font-serif italic text-xl lg:text-2xl text-[#888888] max-w-xl leading-relaxed mb-12">
            Unleash absolute visual expression. Choose a plan tailored to your volume and aesthetic requirements. Save 20% with annual commitments.
          </p>

          {/* Toggle billing cycle */}
          <div className="flex items-center gap-3 bg-[#F5F3F0] p-1 rounded-full border border-[#E5E5E5]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={clsx(
                "px-5 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all",
                billingCycle === "monthly" ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-md" : "text-[#888888] hover:text-[#0D0D0D]"
              )}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={clsx(
                "px-5 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all relative flex items-center gap-1.5",
                billingCycle === "annual" ? "bg-[#0D0D0D] text-[#FAF8F4] shadow-md" : "text-[#888888] hover:text-[#0D0D0D]"
              )}
            >
              Billed Annually
              <span className="bg-red-500 text-white text-[7px] font-sans px-1.5 py-0.5 rounded-full leading-none">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* CARDS SECTION */}
      <section className="px-6 py-20 lg:py-24 border-b border-[#E5E5E5] flex justify-center bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl items-stretch">
          {Tiers.map((tier) => {
            const price = billingCycle === "monthly" ? tier.priceMonthly : tier.priceAnnual;
            return (
              <div 
                key={tier.name}
                className={clsx(
                  "p-8 border rounded-2xl flex flex-col justify-between transition-all duration-300 relative h-full",
                  tier.popular
                    ? "bg-[#0D0D0D] border-[#0D0D0D] text-[#FAF8F4] shadow-2xl lg:scale-105 z-10"
                    : "bg-white border-[#E5E5E5] text-[#0D0D0D] hover:border-[#0D0D0D]/30"
                )}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF8F4] text-[#0D0D0D] font-mono text-[9px] px-3.5 py-1 tracking-widest border border-[#E5E5E5] rounded-full uppercase font-bold">
                    RECOMMENDED CHOICE
                  </div>
                )}

                <div className="flex flex-col gap-6">
                  <div className={clsx("font-mono text-xs tracking-widest", tier.popular ? "text-[#E8DCC8]" : "text-[#888888]")}>
                    {tier.name}
                  </div>
                  <div className="flex items-baseline">
                    <span className="font-display text-6xl tracking-wide">₹{price}</span>
                    <span className={clsx("font-mono text-xs ml-1.5", tier.popular ? "text-white/40" : "text-[#888888]")}>/ month</span>
                  </div>
                  <p className={clsx("font-serif italic text-sm leading-relaxed", tier.popular ? "text-white/60" : "text-[#888888]")}>
                    {tier.description}
                  </p>

                  <div className={clsx("h-px w-full my-4", tier.popular ? "bg-white/10" : "bg-[#E5E5E5]")} />

                  <ul className="flex flex-col gap-4 font-mono text-[11px] uppercase tracking-wider text-left leading-relaxed">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start">
                        <Check className={clsx("w-4 h-4 shrink-0 mt-0.5", tier.popular ? "text-[#E8DCC8]" : "text-black")} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleCta(tier)}
                  disabled={loadingTier !== null}
                  className={clsx(
                    "w-full py-4 text-xs font-mono uppercase tracking-widest mt-10 transition-all rounded-xl flex items-center justify-center gap-2",
                    tier.popular
                      ? "bg-white text-black hover:bg-white/90 shadow-lg"
                      : "bg-[#0D0D0D] text-[#FAF8F4] hover:bg-[#0D0D0D]/90",
                    loadingTier !== null && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loadingTier === tier.name ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FULL FEATURE COMPARISON TABLE */}
      <section className="px-6 py-20 lg:py-24 border-b border-[#E5E5E5] flex flex-col items-center">
        <h2 className="font-display text-4xl lg:text-6xl tracking-wide mb-12 uppercase text-center">FEATURE MATRIX</h2>
        
        <div className="w-full max-w-4xl border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F5F3F0]">
                <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#888888] text-left w-[30%]">Feature Name</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#888888] text-center w-[23%]">FREE</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#888888] text-center w-[23%]">CREATOR</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#888888] text-center w-[23%]">STUDIO</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_GRID.map((row, idx) => (
                <tr key={idx} className="border-b border-[#E5E5E5] last:border-b-0 hover:bg-[#FAF8F4]/30 transition-colors">
                  <td className="p-4 font-sans text-xs font-medium text-[#0D0D0D]">{row.name}</td>
                  
                  {/* Free cell */}
                  <td className="p-4 text-center">
                    {typeof row.free === "string" ? (
                      <span className="font-mono text-xs text-[#888888]">{row.free}</span>
                    ) : row.free ? (
                      <Check className="w-4.5 h-4.5 text-[#0D0D0D] mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-[#888888]/30 mx-auto" />
                    )}
                  </td>

                  {/* Creator cell */}
                  <td className="p-4 text-center">
                    {typeof row.creator === "string" ? (
                      <span className="font-mono text-xs font-semibold text-black">{row.creator}</span>
                    ) : row.creator ? (
                      <Check className="w-4.5 h-4.5 text-[#0d0d0d] mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-[#888888]/30 mx-auto" />
                    )}
                  </td>

                  {/* Studio cell */}
                  <td className="p-4 text-center">
                    {typeof row.studio === "string" ? (
                      <span className="font-mono text-xs font-semibold text-black">{row.studio}</span>
                    ) : row.studio ? (
                      <Check className="w-4.5 h-4.5 text-black mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-[#888888]/30 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
