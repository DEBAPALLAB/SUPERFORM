"use client";

import Link from "next/link";
import TransitionLink from "@/components/TransitionLink";
import { ArrowRight, Menu as MenuIcon, X as XIcon } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import clsx from "clsx";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import IntentModal from "@/components/IntentModal";
import { usePageTransition } from "@/components/TransitionProvider";
import { supabase } from "@/lib/supabase";

interface IntentModalTriggerProps {
  user: any;
}

function IntentModalTrigger({ user }: IntentModalTriggerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { navigateTo } = usePageTransition();

  useEffect(() => {
    if (searchParams.get("start") === "true") {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    // Clear search param
    const params = new URLSearchParams(searchParams.toString());
    params.delete("start");
    const query = params.toString();
    router.replace(pathname + (query ? `?${query}` : ""));
  };

  const handleComplete = (intent: string) => {
    setIsOpen(false);
    localStorage.setItem("superform_intent", intent);
    if (user) {
      navigateTo("/dashboard");
    } else {
      navigateTo("/register");
    }
  };

  return (
    <IntentModal
      isOpen={isOpen}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#0D0D0D]">
      {/* HEADER CONTAINER */}
      <div className="sticky top-0 z-50 w-full pt-4 px-4 transition-all duration-300">
        <header className={clsx(
          "mx-auto w-full max-w-7xl flex items-center justify-between transition-all duration-500 border",
          scrolled 
            ? "h-[58px] px-5 md:px-6 border-ink/10 bg-[#FAF8F4]/85 backdrop-blur-xl rounded-full shadow-[0_12px_40px_-12px_rgba(13,13,13,0.08)]"
            : "h-[68px] px-6 md:px-8 border-ink/5 bg-white/60 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(13,13,13,0.02)]"
        )}>
          <div className="flex items-center gap-8">
            <TransitionLink href="/" className="font-display text-xl tracking-wide flex items-center gap-3 md:gap-4 group cursor-pointer">
              <svg className="w-7 h-7 rounded-[7px] group-hover:scale-105 transition-transform duration-300 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="30%" stopColor="#FAF8F4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#0D0D0D"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" fill="url(#headerSfGrad)" letterSpacing="-0.03em">SF</text>
              </svg>
              <span className="font-bold tracking-[0.04em]">Superform</span>
            </TransitionLink>
            
            <nav className="hidden md:flex gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] items-center">
              <TransitionLink 
                href="/features" 
                className={clsx(
                  "px-3 py-1.5 rounded-full transition-all duration-300 hover:text-[#0D0D0D] hover:bg-[#0D0D0D]/5",
                  pathname === "/features" ? "text-[#0D0D0D] bg-[#0D0D0D]/5 font-bold" : "text-[#888888]"
                )}
              >
                Features
              </TransitionLink>
              <TransitionLink 
                href="/showcase" 
                className={clsx(
                  "px-3 py-1.5 rounded-full transition-all duration-300 hover:text-[#0D0D0D] hover:bg-[#0D0D0D]/5",
                  pathname === "/showcase" ? "text-[#0D0D0D] bg-[#0D0D0D]/5 font-bold" : "text-[#888888]"
                )}
              >
                Showcase
              </TransitionLink>
              <TransitionLink 
                href="/pricing" 
                className={clsx(
                  "px-3 py-1.5 rounded-full transition-all duration-300 hover:text-[#0D0D0D] hover:bg-[#0D0D0D]/5",
                  pathname === "/pricing" ? "text-[#0D0D0D] bg-[#0D0D0D]/5 font-bold" : "text-[#888888]"
                )}
              >
                Pricing
              </TransitionLink>
            </nav>
          </div>
          
          {/* Desktop Navigation CTAs */}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.18em]">
            {user ? (
              <TransitionLink 
                href="/dashboard" 
                className="flex items-center gap-1.5 bg-[#0D0D0D] text-[#FAF8F4] px-5 py-2.5 rounded-full hover:bg-[#0D0D0D]/90 active:scale-[0.98] transition-all group cursor-pointer shadow-md shadow-black/5 font-bold"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
              </TransitionLink>
            ) : (
              <>
                <TransitionLink 
                  href="/register?mode=login" 
                  className="text-[#0D0D0D] border border-ink/10 py-2.5 px-5 rounded-full hover:bg-[#0D0D0D]/5 active:scale-[0.98] transition-all cursor-pointer font-bold animate-pulse-subtle"
                >
                  Log In
                </TransitionLink>
                <Link 
                  href={`${pathname}?start=true`}
                  className="flex items-center gap-1.5 bg-[#0D0D0D] text-[#FAF8F4] px-5 py-2.5 rounded-full hover:bg-[#0D0D0D]/90 active:scale-[0.98] transition-all group cursor-pointer shadow-md shadow-black/5"
                >
                  <span>Start Building</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <TransitionLink 
                href="/register?mode=login" 
                className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#0D0D0D] border border-ink/10 py-1.5 px-3.5 rounded-full active:scale-[0.98] transition-all cursor-pointer font-bold"
              >
                Log In
              </TransitionLink>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 border border-ink/10 rounded-full flex items-center justify-center text-ink hover:bg-ink/5 transition-all active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <XIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </header>
      </div>

      {/* FULLSCREEN MOBILE MENU OVERLAY */}
      <div className={clsx(
        "fixed inset-0 z-40 bg-[#FAF8F4] md:hidden flex flex-col justify-between pt-28 pb-12 px-8 transition-all duration-500 ease-out-quint",
        mobileMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-4"
      )}>
        <nav className="flex flex-col gap-6 text-2xl font-serif italic text-ink/90 mt-8">
          <TransitionLink 
            href="/features" 
            className={clsx(
              "hover:text-[#F59E0B] transition-colors duration-300 py-2 border-b border-ink/5",
              pathname === "/features" && "text-[#F59E0B]"
            )}
          >
            Features
          </TransitionLink>
          <TransitionLink 
            href="/showcase" 
            className={clsx(
              "hover:text-[#F59E0B] transition-colors duration-300 py-2 border-b border-ink/5",
              pathname === "/showcase" && "text-[#F59E0B]"
            )}
          >
            Showcase
          </TransitionLink>
          <TransitionLink 
            href="/pricing" 
            className={clsx(
              "hover:text-[#F59E0B] transition-colors duration-300 py-2 border-b border-ink/5",
              pathname === "/pricing" && "text-[#F59E0B]"
            )}
          >
            Pricing
          </TransitionLink>
        </nav>

        <div className="flex flex-col gap-4 text-xs font-mono uppercase tracking-[0.18em]">
          {user ? (
            <TransitionLink 
              href="/dashboard" 
              className="flex items-center justify-center gap-2 bg-[#0D0D0D] text-[#FAF8F4] py-4 rounded-xl hover:bg-[#0D0D0D]/90 active:scale-[0.99] transition-all font-bold"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </TransitionLink>
          ) : (
            <>
              <Link 
                href={`${pathname}?start=true`}
                className="flex items-center justify-center gap-2 bg-[#0D0D0D] text-[#FAF8F4] py-4 rounded-xl hover:bg-[#0D0D0D]/90 active:scale-[0.99] transition-all font-bold text-center"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* PAGE CONTENTS */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>

      {/* FOOTER */}
      <footer className="h-[64px] border-t border-[#E5E5E5] bg-[#FAF8F4] flex items-center justify-between px-6 lg:px-16 font-mono text-xs tracking-widest text-[#888888] shrink-0">
        <div className="font-display text-lg text-[#0D0D0D] tracking-wide">
          <span className="bg-[#0D0D0D] text-[#FAF8F4] px-1 py-0.5 text-[10px] mr-2">SF</span>
          Superform
        </div>
        <div className="flex gap-6">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D0D0D] transition-colors">Twitter</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D0D0D] transition-colors">Github</a>
          <Link href="/features" className="hover:text-[#0D0D0D] transition-colors">Contact</Link>
        </div>
      </footer>

      {/* Suspended Trigger to prevent build-time static generation bailouts */}
      <Suspense fallback={null}>
        <IntentModalTrigger user={user} />
      </Suspense>
    </div>
  );
}
