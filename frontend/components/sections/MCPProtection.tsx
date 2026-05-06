import { Shield, CheckCircle, Zap, Globe, Bot } from "lucide-react";

const mcpCards = [
  {
    icon: <Zap className="w-6 h-6 text-neon-blue" />,
    name: "Stripe MCP",
    description: "Payment processing & subscriptions",
    bg: "bg-neon-blue/10",
    border: "border-neon-blue/20",
  },
  {
    icon: <Globe className="w-6 h-6 text-neon-green" />,
    name: "Coinbase MCP",
    description: "Crypto transfers & conversions",
    bg: "bg-neon-green/10",
    border: "border-neon-green/20",
  },
  {
    icon: <Bot className="w-6 h-6 text-orange-400" />,
    name: "Vercel AI SDK",
    description: "Native integration with any agent on Vercel",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: <Shield className="w-6 h-6 text-purple-400" />,
    name: "Custom MCPs",
    description: "Any custom payment integration",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

export default function MCPProtection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800/50 to-dark-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-mono uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            MCP Protection
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Protects your MCP connections
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            PayGuard wraps every payment tool your Vercel agent calls
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {mcpCards.map((card) => (
            <div
              key={card.name}
              className={`glass-card p-6 space-y-4 border ${card.border} hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className={`inline-flex p-3 rounded-xl ${card.bg} ${card.border} border`}>
                {card.icon}
              </div>
              <div className="space-y-1">
                <div className="text-white font-semibold">{card.name}</div>
                <div className="text-gray-500 text-sm">{card.description}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle className="w-4 h-4 text-neon-green" />
                <span className="text-neon-green text-sm font-mono font-semibold">Protected</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
