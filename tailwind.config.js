/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--foreground)",
        "primary-foreground": "var(--background)",
        ring: "#a78bfa",
        input: "#e5e7eb",
        accent: "#f3f4f6",
        "accent-foreground": "#111827",
      },
    },
  },
  plugins: [],
};
