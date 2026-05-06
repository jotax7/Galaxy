import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-[#05050f] flex items-center justify-center overflow-hidden px-4">
      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "8%",  left: "12%",  size: 2, opacity: 0.6 },
          { top: "15%", left: "78%",  size: 1, opacity: 0.4 },
          { top: "22%", left: "45%",  size: 1, opacity: 0.3 },
          { top: "31%", left: "90%",  size: 2, opacity: 0.5 },
          { top: "40%", left: "5%",   size: 1, opacity: 0.5 },
          { top: "55%", left: "60%",  size: 2, opacity: 0.4 },
          { top: "65%", left: "25%",  size: 1, opacity: 0.3 },
          { top: "72%", left: "85%",  size: 1, opacity: 0.6 },
          { top: "80%", left: "38%",  size: 2, opacity: 0.4 },
          { top: "88%", left: "70%",  size: 1, opacity: 0.5 },
          { top: "5%",  left: "55%",  size: 1, opacity: 0.3 },
          { top: "48%", left: "92%",  size: 2, opacity: 0.5 },
          { top: "93%", left: "18%",  size: 1, opacity: 0.4 },
          { top: "60%", left: "48%",  size: 1, opacity: 0.3 },
          { top: "18%", left: "30%",  size: 2, opacity: 0.5 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDuration: `${2 + (i % 3)}s`,
              animationDelay: `${(i * 0.4) % 2}s`,
            }}
          />
        ))}
        {/* Nebula glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00d4ff]/3 rounded-full blur-3xl" />
      </div>

      {/* Terminal card */}
      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-xl overflow-hidden border border-[#00ff88]/20 bg-black/80 backdrop-blur-md shadow-2xl shadow-black/60">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-black/60 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs font-mono text-[#00ff88]/60">
              galaxy — scrutinizer · evidence lookup
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-6 font-mono text-sm space-y-1">
            <div className="text-gray-500">$ galaxy lookup --finding 404</div>
            <div className="text-gray-600">Querying evidence index...</div>
            <div className="h-2" />
            <div className="text-red-400 font-bold text-base">
              ERROR: FINDING NOT FOUND
            </div>
            <div className="h-2" />
            <div className="text-gray-500 text-xs">
              Stage 02 · Provenance check returned no results.
            </div>
            <div className="text-gray-500 text-xs">
              The requested artifact does not exist in any evidence image.
            </div>
            <div className="h-2" />
            <div className="text-gray-700 text-xs">
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
            <div className="text-gray-600 text-xs">
              VERDICT: <span className="text-red-400 font-bold">BLOCK</span>
              {"  "}Confidence: 0.00
            </div>
            <div className="text-gray-600 text-xs">
              Reason: path not found in filesystem
            </div>
            <div className="h-4" />
            <div className="text-[#00ff88]/60 text-xs cursor-blink" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-bold text-sm hover:bg-[#00ff88]/90 transition-all"
          >
            Return to base
          </Link>
          <Link
            href="/#scrutinizer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 font-medium text-sm border border-white/10 hover:border-white/20 transition-all"
          >
            View scrutinizer pipeline
          </Link>
        </div>
      </div>
    </main>
  );
}
