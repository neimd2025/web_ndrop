import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7C38ED",
          50: "#F0F9FB",
          100: "#CDD2FB",
          200: "#B4C8FF",
          300: "#9F9DFC",
          400: "#7C38ED",
          500: "#5F0FCD",
          600: "#4A0BA3",
          700: "#350879",
          800: "#20044F",
          900: "#0B0125",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        purple: {
          50: "#F0F9FB",
          100: "#CDD2FB",
          200: "#B4C8FF",
          300: "#9F9DFC",
          400: "#7C38ED",
          500: "#7C38ED",
          600: "#5F0FCD",
          700: "#4A0BA3",
          800: "#350879",
          900: "#20044F",
        },
        blue: {
          500: "#2463EB",
          600: "#1D4ED8",
        },
        red: {
          500: "#DC2626",
          600: "#B91C1C",
        },
        green: {
          500: "#1AA34A",
          600: "#16A34A",
        },
        orange: {
          500: "#FA6B0B",
          600: "#EA580C",
        },
        yellow: {
          500: "#F2FC3",
          600: "#D97706",
        },
        gray: {
          50: "#F0F9FB",
          100: "#F4F4F5",
          200: "#E6E6E9",
          300: "#E6E6E9",
          400: "#A1A8B3",
          500: "#7E858F",
          600: "#7F7F7A",
          700: "#6D5765",
          800: "#1F2937",
          900: "#111827",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        twinkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.2", transform: "scale(0.5)" },
        },
        "shooting-star": {
          "0%": { transform: "translateX(0) translateY(0) rotate(45deg)", opacity: "1" },
          "100%": { transform: "translateX(100vh) translateY(100vh) rotate(45deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-slow": "bounce 2s infinite",
        blob: "blob 7s infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
        "shooting-star": "shooting-star 3s ease-in-out infinite",
      },
      fontFamily: {
        pretendard: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        mobile: "448px", // max-w-md와 동일
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
