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
        elder: {
          bg: "#F9FAFB",
          surface: "#FFFFFF",
          primary: "#1D4ED8",
          primaryHover: "#1E40AF",
          accent: "#0D9488",
          urgent: "#DC2626",
          warning: "#D97706",
          success: "#16A34A",
          text: "#111827",
          subtext: "#4B5563",
          border: "#E5E7EB",
        },
      },
      fontSize: {
        'elder-base': ['1.25rem', { lineHeight: '1.75rem' }],
        'elder-lg': ['1.5rem', { lineHeight: '2rem' }],
        'elder-xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'elder-2xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
    },
  },
  plugins: [],
};
export default config;
