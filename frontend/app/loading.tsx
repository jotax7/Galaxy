"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "galaxy investigate --initializing...",
  "Loading scrutinizer pipeline...",
  "Mounting evidence index...",
  "Verifying SIFT tool signatures...",
  "Establishing audit chain...",
];

export default function Loading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 420);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#05050f]">
      <div className="w-full max-w-sm px-4">
        {/* Terminal window */}
        <div className="rounded-xl overflow-hidden border border-[#00ff88]/20 bg-black/90 shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-black/60 border-b border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            <span className="ml-2 text-xs font-mono text-[#00ff88]/50">galaxy — startup</span>
          </div>

          {/* Output lines */}
          <div className="p-5 font-mono text-xs space-y-1.5 min-h-[140px]">
            {STEPS.slice(0, step + 1).map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{ opacity: i < step ? 0.45 : 1 }}
              >
                {i < step ? (
                  <span className="text-[#00ff88]">✓</span>
                ) : (
                  <span className="inline-block w-3 h-3 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
                )}
                <span className={i < step ? "text-gray-600" : "text-[#00ff88]"}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div className="mt-4 text-center">
          <span className="font-mono text-xs text-gray-700">
            Gal<span className="text-[#00ff88]">axy</span> · DFIR
          </span>
        </div>
      </div>
    </div>
  );
}
