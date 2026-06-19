import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade Seravie Campo — tema escuro premium
        campo: {
          bg: "#14160f",        // fundo principal
          surface: "#1c1f17",   // cards
          surface2: "#23271d",  // cards elevados
          border: "#33392a",    // bordas sutis
        },
        forest: {
          50: "#f1f5ec",
          100: "#dde7d0",
          200: "#bccfa3",
          300: "#97b275",
          400: "#769454",
          500: "#5a7740",
          600: "#465f33",
          700: "#384b2b",
          800: "#2e3c25",
          900: "#283321",
        },
        gold: {
          DEFAULT: "#c9a86a",
          light: "#d9bd86",
          dark: "#a8884f",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
