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
          border: "#2D1F5E",
          hot: "#FF4D6D",
          trending: "#F59E0B",
          glow: "#A855F7",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
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
      },
    },
  },
  plugins: [],
};

export default config;
