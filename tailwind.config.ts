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
        oasis: {
          bgStart: "#D5DDF8",
          bgMid: "#E8EDFC",
          bgEnd: "#A7B6F2",
          cardBg: "rgba(255, 255, 255, 0.85)",
          cardBorder: "rgba(255, 255, 255, 0.9)",
          pillBg: "rgba(255, 255, 255, 0.7)",
          darkBtn: "#171717",
          darkBtnHover: "#000000",
        },
      },
      backdropBlur: {
        xs: "2px",
        '2xl': "24px",
        '3xl': "40px",
      },
      boxShadow: {
        'glass': '0 20px 40px -15px rgba(112, 128, 200, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.7)',
        'glass-hover': '0 25px 50px -12px rgba(99, 102, 241, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9)',
        'glass-card': '0 10px 30px -5px rgba(79, 70, 229, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
      },
    },
  },
  plugins: [],
};
export default config;
