import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores lidas do modelo Seravie Campo (dashboard "Bom dia, João!")
        campo: {
          bg: "#14160F",       // fundo principal
          surface: "#191C13",  // cards / painéis
          surface2: "#1F2318", // elevado / hover / cabeçalho de tabela
          border: "#2C2F22",   // borda sutil (oliva-escuro)
        },
        // Verde-oliva (texto claro -> verdes do gráfico)
        forest: {
          50: "#F2F4EC",
          100: "#E7E9DB",  // títulos / texto cream do modelo
          200: "#C7D2A8",
          300: "#9DB36F",
          400: "#7CA049",
          500: "#5F8537",
          600: "#4F7A35",
          700: "#3E5E2A",
          800: "#314A22",
          900: "#28331E",
        },
        // Dourado/brass do modelo (logo CAMPO, botão, ícones, linha do gráfico)
        gold: {
          DEFAULT: "#C2A878",
          light: "#D4BD8C",
          dark: "#9E895C",
        },
        // Verde vibrante (setas de alta, "Programada", fatia maior do donut)
        leaf: {
          DEFAULT: "#6FA63F",
          light: "#8FBE5E",
          dark: "#4F7A35",
        },
        // Acentos do donut / status
        khaki: "#9A9A66",
        cream: "#C9BE93",
        flame: "#D9772D", // laranja "Em separação"
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
    },
  },
  plugins: [],
};

export default config;
