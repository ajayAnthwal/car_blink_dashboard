import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: "#FF7A1A",
          "orange-dark": "#F26B00",
          navy: "#0B1739",
          "navy-light": "#111C44",
        },
        secondary: {
          blue: "#2563EB",
        },
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#FACC15",
        neutral: {
          bg: "#F9FAFB",
          muted: "#9CA3AF",
          dark: "#1F2937",
          white: "#FFFFFF",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(to right, #FF7A1A, #F26B00)",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
