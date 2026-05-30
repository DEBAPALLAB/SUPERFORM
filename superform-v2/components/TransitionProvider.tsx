"use client";

import React, { createContext, useContext, useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TransitionContextType {
  navigateTo: (href: string) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within a TransitionProvider");
  }
  return context;
}

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // App Initial Loading states
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // App startup loading logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds of premium animation progress

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setLoadingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAppLoading(false);
        }, 150); // premium hold at 100%
      }
    };

    interval = setInterval(updateProgress, 16);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // When pathname changes, make sure transitioning is turned off
  useEffect(() => {
    setIsTransitioning(false);
    setPendingPath(null);
  }, [pathname]);

  const navigateTo = (href: string) => {
    if (href === pathname) return;
    
    setIsTransitioning(true);
    setPendingPath(href);

    // Super snappy transition duration (250ms) to keep it feeling fast and responsive
    setTimeout(() => {
      router.push(href);
    }, 250); 
  };

  return (
    <TransitionContext.Provider value={{ navigateTo, isTransitioning }}>
      {/* 
        PREMIUM INITIAL APP LOADER
      */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              y: "-100%",
              transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
            }}
            className="fixed inset-0 z-[10000] bg-[#FAF8F4] flex flex-col items-center justify-center select-none"
          >
            {/* Cardstock Grain Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-overlay"
              style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

            {/* Aesthetic Fine Lines Grid */}
            <div className="absolute inset-x-0 top-1/4 h-px bg-[#0D0D0D]/5" />
            <div className="absolute inset-x-0 bottom-1/4 h-px bg-[#0D0D0D]/5" />
            <div className="absolute inset-y-0 left-1/4 w-px bg-[#0D0D0D]/5" />
            <div className="absolute inset-y-0 right-1/4 w-px bg-[#0D0D0D]/5" />

            <div className="relative flex flex-col items-center gap-8 text-center px-6">
              {/* Premium Circular Ring + Progress Value */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Circular Border Path */}
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    stroke="rgba(13, 13, 13, 0.04)" 
                    strokeWidth="1.5"
                    fill="transparent" 
                  />
                  {/* Animated Foreground Progress Circle */}
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    stroke="#0D0D0D" 
                    strokeWidth="1.5"
                    fill="transparent"
                    strokeDasharray={282.7}
                    strokeDashoffset={282.7 - (282.7 * loadingProgress) / 100}
                    style={{ transition: "stroke-dashoffset 100ms linear" }}
                  />
                </svg>

                {/* Progress Value Counter */}
                <span className="font-mono text-[14px] tracking-widest text-[#0D0D0D] font-bold">
                  {String(loadingProgress).padStart(3, "0")}
                </span>
              </div>

              {/* Minimal Brand Identifier */}
              <div className="flex flex-col gap-2 overflow-hidden mt-2">
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
                  className="font-display text-4xl tracking-[0.05em] text-[#0D0D0D] flex items-center gap-3"
                >
                  <svg className="w-8 h-8 rounded-[8px] shrink-0 shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="loaderSfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="30%" stopColor="#FAF8F4" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                    <rect width="32" height="32" rx="8" fill="#0D0D0D"/>
                    <text 
                      x="50%" 
                      y="55%" 
                      dominantBaseline="middle" 
                      textAnchor="middle" 
                      fontFamily="system-ui, -apple-system, sans-serif" 
                      fontWeight="900" 
                      fontSize="12" 
                      fill="url(#loaderSfGrad)" 
                      letterSpacing="-0.03em"
                    >
                      SF
                    </text>
                  </svg>
                  <span className="font-serif italic font-bold">Superform</span>
                </motion.div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="font-mono text-[8px] uppercase tracking-[0.3em] font-semibold text-[#0D0D0D]"
                >
                  Aesthetic Form Generation
                </motion.span>
              </div>
            </div>

            {/* Fine Bottom Detail */}
            <div className="absolute bottom-10 left-10 font-mono text-[7px] uppercase tracking-[0.25em] opacity-30">
              Platform V2.4.0
            </div>
            <div className="absolute bottom-10 right-10 font-mono text-[7px] uppercase tracking-[0.25em] opacity-30">
              © 2026 Studio
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        Sleek, lightweight transition overlay using only opacity.
        Extremely smooth and hardware-accelerated to prevent any lag or jitter.
      */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-[#FAF8F4] flex items-center justify-center"
            style={{ willChange: "opacity" }}
          >
            {/* Minimal glowing spinner */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center"
            >
              <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-8 h-8 rounded-full border-t-2 border-amber-500 absolute inset-0"
                />
                <span className="font-display text-[9px] font-bold text-ink">SF</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        The main page container remains totally static during navigation,
        guaranteeing zero layout shifts, zero CPU paint calculation overhead, and pure 120 FPS performance.
      */}
      <div className="w-full min-h-screen flex flex-col">
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
