export default function AnnouncementBar() {
  return (
    <div className="w-full bg-dark-800/70 backdrop-blur-sm border-b border-neon-blue/10">
      <div className="max-w-7xl mx-auto px-4 py-[7px] flex items-center justify-center gap-2.5">
        {/* Live pulse dot */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon-green" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green shadow-[0_0_6px_#00ff88]" />
        </span>

        <p className="text-[11px] font-mono text-gray-500 text-center leading-none tracking-wide">
          Built for{" "}
          <span className="text-neon-blue font-semibold tracking-normal">FIND EVIL!</span>
          {" "}by{" "}
          <span className="text-gray-300">SANS Institute</span>
          <span className="mx-2 text-gray-700">—</span>
          <span className="text-gray-400">Autonomous Incident Response Hackathon 2026</span>
        </p>
      </div>
    </div>
  );
}
