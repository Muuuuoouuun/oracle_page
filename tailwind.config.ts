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
        oracle: {
          purple: "#7C3AED",
          violet: "#6D28D9",
          dark: "#0F0A1E",
          card: "#1A1030",
          surface: "#1E1340",
          border: "#2D1F5E",
          hot: "#FF4D6D",
          trending: "#F59E0B",
          glow: "#A855F7",
          muted: "#64748b",
          success: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto)", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "'Noto Sans KR'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2.5s linear infinite",
        "slide-up": "slideUp 0.25s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "spin-slow": "spin 10s linear infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "gradient-x": "gradientX 4s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #A855F7, 0 0 10px #A855F7" },
          "100%": { boxShadow: "0 0 10px #A855F7, 0 0 20px #A855F7, 0 0 30px #A855F7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundSize: {
        "200%": "200% 100%",
        "300%": "300% 300%",
      },
      boxShadow: {
        "oracle": "0 4px 20px rgba(124, 58, 237, 0.25)",
        "oracle-lg": "0 8px 32px rgba(124, 58, 237, 0.4)",
        "glow-sm": "0 0 10px rgba(168, 85, 247, 0.4)",
        "glow-md": "0 0 20px rgba(168, 85, 247, 0.5)",
        "hot-sm": "0 0 10px rgba(255, 77, 109, 0.4)",
        "trending-sm": "0 0 10px rgba(245, 158, 11, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
