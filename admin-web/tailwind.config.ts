import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101714",
        forest: "#0f3d33",
        pine: "#0b2d25",
        gold: "#d4a15c",
        sand: "#f7f2e9",
        cloud: "#efe4d4",
        slate: "#5a6b63"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
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
