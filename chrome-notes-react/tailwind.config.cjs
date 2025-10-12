/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // Auto-detect system preference
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          light: "#60a5fa",
        },
        dark: {
          bg: "#1f1f1f",
          text: "#f0f0f0",
          border: "#3a3a3a",
          hover: "#2f2f2f",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
