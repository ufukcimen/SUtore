/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#07111f",
          panel: "#0d1b2a",
          accent: "#00d1b2",
          glow: "#5eead4",
          gold: "#f6c453",
          mist: "#d8f5ef",
        },
      },
      boxShadow: {
        float: "0 24px 80px rgba(7, 17, 31, 0.24)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

