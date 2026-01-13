import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111113",
        bone: "#f7f3ee",
        sand: "#efe7dc",
        teal: "#0f766e",
        amber: "#d97706",
        slate: "#475569"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Space Grotesk'", "sans-serif"]
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        glow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out",
        glow: "glow 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
