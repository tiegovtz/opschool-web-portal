/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
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
        paleBrickRed:"#e55637bb"

      },
      
      fontFamily: {
        tahoma: ["tahoma", "sans-serif"],
        tahomabd: ["tahomabd", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        ptserif: ["PT Serif", "serif"],
      },

      fontSize: {
        extraLarge: "2.5rem", // 40px
        large: "1.5rem",      // 24px
        medium: "1.1rem",     // 18px
        small: "1rem",        // 16px
        extraSmall: "0.8rem", // 14px
        smallest: "0.6rem",   // 12px
      },

      backgroundImage: {
        // OptionImage
        'optionImage': "url('/images/default.webp')",
        
        // BackGround
        'background3': "url('/public/images/background3.webp')",
        'background2': "url('/public/images/background2.webp')",
        'background1': "url('/public/images/background1.webp')",
      },

      animation: {
        "bounce-horizontal": "bounce-horizontal 1s infinite",
      },

      keyframes: {
        "bounce-horizontal": {
          "0%, 100%": { transform: "translateX(-5px)" },
          "50%": { transform: "translateX(5px)" },
        },
      },
    },
    
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
  plugins: [require("tailwind-scrollbar")],
};
