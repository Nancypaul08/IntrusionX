/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#030712",
          panel: "#08101f",
          panelAlt: "#0c172b",
          line: "#16314d",
          neon: "#3cf2c9",
          blue: "#39a0ff",
          amber: "#f6c65b",
          red: "#f87171"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(60,242,201,0.25), 0 0 30px rgba(57,160,255,0.15)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(57,160,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(57,160,255,0.09) 1px, transparent 1px)"
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
