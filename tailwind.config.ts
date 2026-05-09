import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        brand: ["Rajdhani", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "hsl(45 100% 51%)",
          dark: "hsl(35 100% 45%)",
          light: "hsl(45 100% 65%)",
        },
        "dark-bg": "#0f0f0f",
        "dark-card": "#1a1a1a",
        "dark-header": "#0a0a0a",
        discount: "#FF6B1A",
        gaming: {
          yellow: "#FFD200",
          orange: "#FF6B35",
          purple: "#7B2FBE",
          blue: "#2563EB",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "card-hover": "0 8px 25px rgba(0,0,0,0.12)",
        "bottom-cta": "0 -4px 20px rgba(0,0,0,0.08)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "bounce-soft": "bounce 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
