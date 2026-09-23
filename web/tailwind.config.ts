import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & Accent
        "apple-primary": "#0066cc",
        "apple-primary-focus": "#0071e3",
        "apple-primary-dark": "#2997ff",

        // Surface
        "apple-canvas": "#ffffff",
        "apple-parchment": "#f5f5f7",
        "apple-pearl": "#fafafc",
        "apple-tile-1": "#272729",
        "apple-tile-2": "#2a2a2c",
        "apple-tile-3": "#252527",
        "apple-black": "#000000",
        "apple-chip": "#d2d2d7",

        // Text
        "apple-ink": "#1d1d1f",
        "apple-ink-muted-80": "#333333",
        "apple-ink-muted-48": "#7a7a7a",
        "apple-body-on-dark": "#ffffff",
        "apple-body-muted": "#cccccc",

        // Hairlines & Borders
        "apple-divider": "#f0f0f0",
        "apple-hairline": "#e0e0e0",
      },
      fontFamily: {
        "sf-display": [
          "SF Pro Display",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        "sf-text": [
          "SF Pro Text",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      fontSize: {
        // Display
        "hero-display": ["56px", { lineHeight: "1.07", letterSpacing: "-0.28px" }],
        "display-lg": ["40px", { lineHeight: "1.1", letterSpacing: "0" }],
        "display-md": ["34px", { lineHeight: "1.47", letterSpacing: "-0.374px" }],

        // Lead
        lead: ["28px", { lineHeight: "1.14", letterSpacing: "0.196px" }],
        "lead-airy": ["24px", { lineHeight: "1.5", letterSpacing: "0" }],

        // Tagline
        tagline: ["21px", { lineHeight: "1.19", letterSpacing: "0.231px" }],

        // Body
        "body-strong": ["17px", { lineHeight: "1.24", letterSpacing: "-0.374px" }],
        body: ["17px", { lineHeight: "1.47", letterSpacing: "-0.374px" }],
        "dense-link": ["17px", { lineHeight: "2.41", letterSpacing: "0" }],

        // Caption
        caption: ["14px", { lineHeight: "1.43", letterSpacing: "-0.224px" }],
        "caption-strong": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px" }],

        // Button
        "button-large": ["18px", { lineHeight: "1.0", letterSpacing: "0" }],
        "button-utility": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px" }],

        // Fine Print
        "fine-print": ["12px", { lineHeight: "1.0", letterSpacing: "-0.12px" }],
        "micro-legal": ["10px", { lineHeight: "1.3", letterSpacing: "-0.08px" }],
        "nav-link": ["12px", { lineHeight: "1.0", letterSpacing: "-0.12px" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        semibold: "600",
        bold: "700",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "17px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
        "5xl": "110px",
      },
      borderRadius: {
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
      },
      maxWidth: {
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
        "3xl": "48rem",
        "4xl": "56rem",
        "5xl": "64rem",
        "6xl": "72rem",
        "7xl": "80rem",
      },
      boxShadow: {
        "apple-product": "rgba(0, 0, 0, 0.22) 3px 5px 30px 0",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        ".rounded-pill": {
          borderRadius: "9999px",
        },
      });
    },
  ],
};

export default config;
