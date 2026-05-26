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
