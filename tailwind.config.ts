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
          purple:   "#7C3AED",
          violet:   "#6D28D9",
          dark:     "#0F0A1E",
          card:     "#1A1030",
          surface:  "#1E1340",
          border:   "#2D1F5E",
          hot:      "#FF4D6D",
          trending: "#F59E0B",
          glow:     "#A855F7",
          muted:    "#64748b",
          success:  "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto)", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "'Noto Sans KR'", "sans-serif"],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float":        "float 3s ease-in-out infinite",
        "float-deep":   "floatDeep 5s ease-in-out infinite",
        "glow":         "glow 2s ease-in-out infinite alternate",
        "shimmer":      "shimmer 2.5s linear infinite",
        "slide-up":     "slideUp 0.25s ease-out",
        "fade-in":      "fadeIn 0.2s ease-out",
        "fade-in-up":   "fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "scale-in":     "scaleIn 0.2s ease-out",
        "spring-in":    "springIn 0.46s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pop-in":       "popIn 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "fade-slide":   "fadeSlide 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "spin-slow":    "spin 10s linear infinite",
        "bounce-soft":  "bounceSoft 2s ease-in-out infinite",
        "ping-slow":    "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "gradient-x":   "gradientX 4s ease infinite",
        "glow-pulse":   "glowPulse 3.2s ease-in-out infinite",
        "hot-pulse":    "hotGlowPulse 2s ease-in-out infinite",
        "orb-drift":    "orbDrift 14s ease-in-out infinite",
        "shine-sweep":  "shineSweep 0.5s ease-out forwards",
        "ripple":       "ripplePress 0.5s ease-out forwards",
        "progress":     "progressReveal 0.65s cubic-bezier(0.22, 1.1, 0.36, 1) both",
      },
      keyframes: {
        float:        { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        floatDeep:    {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%":       { transform: "translateY(-7px) rotate(2.5deg)" },
          "60%":       { transform: "translateY(-3px) rotate(-1.5deg)" },
          "80%":       { transform: "translateY(-6px) rotate(1deg)" },
        },
        glow:         { "0%": { boxShadow: "0 0 5px #A855F7, 0 0 10px #A855F7" }, "100%": { boxShadow: "0 0 10px #A855F7, 0 0 20px #A855F7, 0 0 30px #A855F7" } },
        shimmer:      { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        slideUp:      { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeInUp:     { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeSlide:    { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn:      { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        springIn:     {
          "0%":   { transform: "scale(0.84) translateY(12px)", opacity: "0" },
          "55%":  { transform: "scale(1.04) translateY(-3px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)",       opacity: "1" },
        },
        popIn:        {
          "0%":   { transform: "scale(0) rotate(-6deg)",    opacity: "0" },
          "60%":  { transform: "scale(1.14) rotate(2deg)",  opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)",     opacity: "1" },
        },
        bounceSoft:   { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-3px)" } },
        gradientX:    { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        glowPulse:    {
          "0%, 100%": { boxShadow: "0 0 8px rgba(168,85,247,0.22), 0 0 20px rgba(168,85,247,0.07)" },
          "50%":       { boxShadow: "0 0 18px rgba(168,85,247,0.55), 0 0 40px rgba(168,85,247,0.20)" },
        },
        hotGlowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255,77,109,0.25)" },
          "50%":       { boxShadow: "0 0 22px rgba(255,77,109,0.62), 0 0 44px rgba(255,77,109,0.18)" },
        },
        orbDrift:     {
          "0%":   { transform: "translate(0px, 0px) scale(1)" },
          "33%":  { transform: "translate(32px, -22px) scale(1.07)" },
          "67%":  { transform: "translate(-20px, 30px) scale(0.93)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        shineSweep:    { "from": { transform: "translateX(-100%)" }, "to": { transform: "translateX(260%)" } },
        ripplePress:   {
          "0%":   { transform: "translate(-50%,-50%) scale(0)",   opacity: "0.55" },
          "100%": { transform: "translate(-50%,-50%) scale(2.8)", opacity: "0" },
        },
        progressReveal: {
          "from": { clipPath: "inset(0 100% 0 0 round 9999px)" },
          "to":   { clipPath: "inset(0 0% 0 0 round 9999px)" },
        },
      },
      backgroundSize: {
        "200%": "200% 100%",
        "300%": "300% 300%",
      },
      boxShadow: {
        "oracle":      "0 4px 20px rgba(124, 58, 237, 0.25)",
        "oracle-lg":   "0 8px 32px rgba(124, 58, 237, 0.4)",
        "glow-sm":     "0 0 10px rgba(168, 85, 247, 0.4)",
        "glow-md":     "0 0 20px rgba(168, 85, 247, 0.5)",
        "hot-sm":      "0 0 10px rgba(255, 77, 109, 0.4)",
        "trending-sm": "0 0 10px rgba(245, 158, 11, 0.4)",
        "inner-light": "inset 0 1px 0 rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
