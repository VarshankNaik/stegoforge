/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Catppuccin Mocha color palette — hacker dark theme
      colors: {
        ctp: {
          base:     "#1e1e2e",
          mantle:   "#181825",
          crust:    "#11111b",
          surface0: "#313244",
          surface1: "#45475a",
          surface2: "#585b70",
          overlay0: "#6c7086",
          overlay1: "#7f849c",
          overlay2: "#9399b2",
          subtext0: "#a6adc8",
          subtext1: "#bac2de",
          text:     "#cdd6f4",
          lavender: "#b4befe",
          blue:     "#89b4fa",
          sapphire: "#74c7ec",
          sky:      "#89dceb",
          teal:     "#94e2d5",
          green:    "#a6e3a1",
          yellow:   "#f9e2af",
          peach:    "#fab387",
          maroon:   "#eba0ac",
          red:      "#f38ba8",
          mauve:    "#cba6f7",
          pink:     "#f5c2e7",
          flamingo: "#f2cdcd",
          rosewater:"#f5e0dc",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
