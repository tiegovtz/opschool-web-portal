import ViteLegacy from '@vitejs/plugin-legacy'
// import '@google/model-viewer';

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {

    head: {
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        },
      ]
    }
  },
  
  plugins: [
    { src: '~/plugins/mathjax.client.js', mode: 'client' },
    { src: '~/plugins/mathjax-directive.client.js', mode: 'client' },
  ],

  vite: {
    plugins: [
      ViteLegacy({
        targets: [
          'defaults',
          'last 2 versions',
          'Firefox ESR',
          'not IE 11',
          'not dead',
          'Chrome >= 49',
          'Safari >= 10',
          'Edge >= 16',
          'iOS >= 10',
          'Android >= 5',
          'Opera >= 36',
          'Chromium >= 49'
        ],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
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
      "2xl": 2560,
    },
  },
  devServer: {
    host: ' 192.168.0.12 ',
    port: 3000
  },
});