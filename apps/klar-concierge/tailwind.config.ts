import type { Config } from "tailwindcss";

// Brand tokens mirror the CSS variables in globals.css. Hex literals are used
// here so Tailwind opacity modifiers (e.g. text-foreground/60) work.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f9fc",
        foreground: "#071f4a",
        surface: "#ffffff",
        "surface-muted": "#eef3fa",
        "surface-deep": "#e8eef8",
        line: "#d8e0ec",
        brand: {
          DEFAULT: "#082b67",
          strong: "#061f4b",
          soft: "#e7eef9",
        },
        accent: {
          DEFAULT: "#f51f2b",
          strong: "#c91520",
          soft: "#fde9eb",
        },
        success: {
          DEFAULT: "#237a52",
          soft: "#e5f3eb",
        },
        warning: {
          DEFAULT: "#9b6718",
          soft: "#fbf1dd",
        },
        danger: "#c62828",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
