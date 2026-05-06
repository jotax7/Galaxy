export default function StatsBar() {
  const stats = [
    {
      value: "5",
      unit: "",
      label: "deterministic stages",
      sub: "zero probabilistic steps in the verifier",
      accent: "text-neon-green",
    },
    {
      value: "0",
      unit: "",
      label: "LLMs in the verifier",
      sub: "all 5 stages are pure deterministic logic",
      accent: "text-neon-blue",
    },
    {
      value: "SHA-256",
      unit: "",
      label: "audit chain",
      sub: "every verdict is hash-chained and tamper-evident",
      accent: "text-neon-purple",
    },
    {
      value: "MIT",
      unit: "",
      label: "licensed",
      sub: "open source, auditable, forkable",
      accent: "text-yellow-400",
    },
  ];

  return (
    <div className="relative border-y border-white/5">
      <div className="absolute inset-0 bg-dark-800/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/3 via-transparent to-neon-blue/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {stats.map(({ value, label, sub, accent }) => (
            <div
              key={label}
              className="bg-dark-800/80 px-6 py-8 flex flex-col items-center text-center gap-1 hover:bg-dark-700/60 transition-colors"
            >
              <div className={`text-3xl sm:text-4xl font-black font-mono ${accent} tracking-tight`}>
                {value}
              </div>
              <div className="text-sm font-semibold text-white mt-1">{label}</div>
              <div className="text-xs text-gray-600 leading-snug max-w-[140px]">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
