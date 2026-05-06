"use client";

import { useEffect, useRef, useState } from "react";

const metrics = [
  { value: 5, suffix: "ms", label: "Max Latency", sublabel: "per financial tool call", color: "text-neon-green" },
  { value: 0, suffix: "", label: "LLM Calls", sublabel: "fully deterministic", color: "text-neon-blue" },
  { value: 7, suffix: "", label: "Attack Scenarios", sublabel: "covered in live demo", color: "text-yellow-400" },
];

function AnimatedNumber({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1200;
          const steps = 40;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayed(value);
              clearInterval(timer);
            } else {
              setDisplayed(Number(current.toFixed(1)));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  const formatted = Number.isInteger(value) ? Math.round(displayed) : displayed.toFixed(1);

  return (
    <div ref={ref} className={`text-4xl sm:text-5xl font-black font-mono ${color}`}>
      {formatted}{suffix}
    </div>
  );
}

export default function Metrics() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-dark-800/50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent" />

      {/* Glow orbs */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl" />
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-mono">
            By The Numbers
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Deterministic.{" "}
            <span className="gradient-text">No LLM. No guessing.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {metrics.map(({ value, suffix, label, sublabel, color }) => (
            <div
              key={label}
              className="glass-card p-6 border border-white/5 hover:border-neon-green/20 transition-all group text-center"
            >
              <AnimatedNumber value={value} suffix={suffix} color={color} />
              <div className="mt-2 font-semibold text-white text-sm">{label}</div>
              <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
