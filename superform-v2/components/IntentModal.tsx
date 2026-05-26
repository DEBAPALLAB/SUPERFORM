"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (intent: string) => void;
}

const loadingStates = [
  "READING YOUR INTENT...",
  "STRUCTURING YOUR QUESTIONS...",
  "CHOOSING YOUR AESTHETIC..."
];

export default function IntentModal({ isOpen, onClose, onComplete }: IntentModalProps) {
  const [intent, setIntent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingStates.length - 1) {
            clearInterval(interval);
            setTimeout(() => onComplete(intent), 800); // Wait a bit then finish
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isLoading, intent, onComplete]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!intent.trim()) return;
    setIsLoading(true);
  };

  const handleQuickStart = (chip: string) => {
    setIntent(`I want to create a ${chip.toLowerCase()} form...`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-canvas/95 backdrop-blur-md flex items-center justify-center p-6"
        >
          {!isLoading && (
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-ink hover:opacity-70 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {isLoading ? (
            <div className="w-full max-w-2xl flex flex-col items-center">
              <motion.div 
                className="h-[1px] bg-ink w-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, repeat: 2 }}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-mono text-xs text-muted tracking-widest mt-8 uppercase"
                >
                  {loadingStates[loadingStep]}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-2xl flex flex-col gap-12"
            >
              <div className="font-mono text-[11px] text-muted tracking-[0.2em] uppercase">
                What are you building?
              </div>

              <form onSubmit={handleSubmit} className="relative group border-b-2 border-ink">
                <input
                  type="text"
                  autoFocus
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="I want to..."
                  className="w-full bg-transparent font-serif italic text-4xl lg:text-5xl outline-none pb-4 placeholder:text-muted/50"
                />
              </form>

              <div className="flex flex-col gap-4">
                <div className="font-mono text-[9px] text-muted tracking-widest uppercase">
                  Or start with:
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Waitlist", "Application", "Event", "Feedback"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickStart(chip)}
                      className="px-4 py-2 rounded-full border border-border font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-canvas transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSubmit()}
                className="w-full bg-ink text-canvas py-5 font-mono text-xs tracking-widest uppercase hover:bg-ink/90 transition-colors mt-8"
              >
                Generate my form →
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
