import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    // Vue / Nuxt structure
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",

    // TS / React-style paths (keep them if needed)
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      // 🎨 COLORS (merged safely)
      colors: {
        // your existing
        darkBlue: "#282938",
        oceanBlue: "#56ade8",
        deepBlue: "#0077c5",
        normalBlue: "#2405f2",
        normalYellow: "#fcd980",
        textGray: "#6e7178",
        containerGray: "#f3f3f3",
        normalGreen: "#00bf77",
        normalRed: "#f00",
        normalWhite: "#fff",
        normalGreener: "#4db139",
        grayLight: "#f0f0f0",
        paleBrickRed: "#e55637bb",

        // ⚠️ merged primary (keep BOTH styles)
        primary: {
          DEFAULT: "#0a7ac8", // fallback
          dark: "#0866a3",
          foreground: "hsl(var(--primary-foreground))",
        },

        // system colors (from TS config)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

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

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        pending: "var(--pending)",
        active: "var(--active)",
        inactive: "var(--inactive)",

        // ✅ YOUR TARGET (NOW WORKS)
        "picton-blue": {
          50: "#f0f8ff",
          100: "#dff0ff",
          200: "#b8e2ff", // ← bg-picton-blue-200
          300: "#90d5ff",
          400: "#33b4fd",
          500: "#099aee",
          600: "#007acc",
          700: "#0061a5",
          800: "#045388",
          900: "#0a4570",
          950: "#062b4b",
        },

        lemon: {
          50: "#fef6ee",
          100: "#fdebd7",
          200: "#fad3ae",
          300: "#f6b37b",
          400: "#f29253",
          500: "#ed6a22",
          600: "#de5118",
          700: "#b83c16",
          800: "#933119",
          900: "#762b18",
          950: "#40130a",
        },

        green: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#03543F",
        },

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground":
            "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground":
            "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      // 🔤 fonts
      fontFamily: {
        tahoma: ["tahoma", "sans-serif"],
        tahomabd: ["tahomabd", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        ptserif: ["PT Serif", "serif"],
      },

      // 🔠 font sizes
      fontSize: {
        extraLarge: "2.5rem",
        large: "1.5rem",
        medium: "1.1rem",
        small: "1rem",
        extraSmall: "0.8rem",
        smallest: "0.6rem",
      },

      // 🖼 backgrounds
      backgroundImage: {
        optionImage: "url('/images/default.webp')",
        background3: "url('/images/background3.webp')",
        background2: "url('/images/background2.webp')",
        background1: "url('/images/background1.webp')",
      },

      // 🎬 animations (merged)
      animation: {
        "bounce-horizontal": "bounce-horizontal 1s infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      keyframes: {
        "bounce-horizontal": {
          "0%, 100%": { transform: "translateX(-5px)" },
          "50%": { transform: "translateX(5px)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      // 🔲 radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },

    // 📱 breakpoints (kept yours)
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "2000px",
    },
  },

  plugins: [
    require("tailwind-scrollbar"),
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};

export default config;