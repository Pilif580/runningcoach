/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0C",
        surface: "#141416",
        card: "#1E1E20",
        primary: "#39FF14",
        text: "#FFFFFF",
        weak: "#B3B3B3",
      },
      borderRadius: {
        xl: "24px",
        md: "16px",
      },
    },
  },
  plugins: [],
};
