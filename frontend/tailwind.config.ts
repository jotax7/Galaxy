import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00ff88",
          blue: "#00d4ff",
          purple: "#a855f7",
          red: "#ff3366",
          orange: "#ff6b35",
        },
        dark: {
          900: "#05050f",
          800: "#0a0a1a",
          700: "#0f0f24",
          600: "#151530",
          500: "#1a1a3a",
          400: "#252545",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
        "typewriter": "typewriter 0.1s steps(1) forwards",
        "grid-flow": "grid-flow 20s linear infinite",
        "dash": "dash 1.5s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #00ff88, 0 0 10px #00ff88" },
          "100%": { boxShadow: "0 0 20px #00ff88, 0 0 40px #00ff88" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "grid-flow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100px" },
        },
        dash: {
          to: { strokeDashoffset: "0" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "grid": "50px 50px",
      },
    },
  },
  plugins: [],
};

export default config;
