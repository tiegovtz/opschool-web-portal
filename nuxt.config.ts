import tailwindcss from "@tailwindcss/vite";
// import '@google/model-viewer';

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    "@nuxtjs/google-fonts",
    "@nuxt/image",
    "@nuxt/icon",
    "nuxt-swiper",
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    
  ],


  image: {
    // dir: "assets/images",
    // dirPublic: "public/images",
    quality: 80,
    format: ["webp"],
    densities: [1],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      "2xl": 1536,
    },
  },

  devServer: {
    host: ' 192.168.0.13',
    port: 3000
  }
});