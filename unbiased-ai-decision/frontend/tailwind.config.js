/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020817",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
