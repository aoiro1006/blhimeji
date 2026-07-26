import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1d5bbf",
          dark: "#1247a0",
          light: "#3b82f6",
          pale: "#eff6ff",
        },
        accent: {
          DEFAULT: "#e63946",
          dark: "#c1121f",
          light: "#ff6b6b",
          pale: "#fff1f2",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "Hiragino Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(29, 91, 191, 0.12)",
        "card-hover": "0 8px 28px -4px rgba(230, 57, 70, 0.18)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1247a0 0%, #1d5bbf 45%, #e63946 100%)",
        "stripe": "repeating-linear-gradient(90deg, #1d5bbf 0px, #1d5bbf 8px, #e63946 8px, #e63946 16px)",
      },
    },
  },
  plugins: [],
};

export default config;
