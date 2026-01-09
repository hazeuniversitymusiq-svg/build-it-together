import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Aurora spectrum colors
        aurora: {
          blue: "hsl(var(--aurora-blue))",
          purple: "hsl(var(--aurora-purple))",
          pink: "hsl(var(--aurora-pink))",
          teal: "hsl(var(--aurora-teal))",
          cyan: "hsl(var(--aurora-cyan))",
        },
        flow: {
          scanner: "hsl(var(--flow-scanner-frame))",
          biometric: "hsl(var(--flow-biometric))",
          glow: "hsl(var(--flow-glow))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        'float': '0 8px 32px -8px hsla(0, 0%, 0%, 0.12)',
        'float-lg': '0 12px 40px -12px hsla(0, 0%, 0%, 0.15), 0 0 0 1px hsla(0, 0%, 0%, 0.03)',
        'glow-blue': '0 0 30px -8px hsla(211, 100%, 50%, 0.5)',
        'glow-purple': '0 0 30px -8px hsla(271, 91%, 65%, 0.5)',
        'glow-aurora': '0 0 30px -10px hsla(211, 100%, 50%, 0.4), 0 0 60px -20px hsla(271, 91%, 65%, 0.3)',
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
        "aurora-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float-pulse": {
          "0%, 100%": { 
            transform: "translateY(0)",
            boxShadow: "0 8px 32px -8px hsla(0, 0%, 0%, 0.12)"
          },
          "50%": { 
            transform: "translateY(-2px)",
            boxShadow: "0 12px 40px -8px hsla(0, 0%, 0%, 0.18)"
          },
        },
        "scan-line": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.8" },
          "50%": { transform: "translateY(240px)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "aurora": "aurora-flow 8s ease-in-out infinite",
        "float": "float-pulse 3s ease-in-out infinite",
        "scan-line": "scan-line 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
