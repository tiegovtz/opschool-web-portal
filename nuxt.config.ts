// https://nuxt.com/docs/api/configuration/nuxt-config
import { vite as vidstack } from 'vidstack/plugins';

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  debug: false,

  // Add Vuetify styles here along with your existing CSS
  css: ["~/assets/css/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('media-'),
    },
  },

  plugins: [
    { src: "~/plugins/mathjax.client.js", mode: "client" },
    { src: "~/plugins/mathjax-directive.client.js", mode: "client" },
    { src: "~/plugins/block-navigation.client.ts", mode: "client" },
    { src: "~/plugins/init-chapter-progress.client.js", mode: "client" },
  ],

  modules: [
    "@nuxtjs/google-fonts",
    "@nuxt/image",
    "@nuxt/icon",
    "nuxt-swiper",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],

  image: {
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

  // devServer: {
  //   host: '192.168.0.12',
  //   port: 3000
  // },

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    css: {
      preprocessorOptions: {
        sass: {
          // additionalData: '@use "vuetify/styles" as *;',
        },
      },
    },
    plugins: [vidstack()],
  },

  app: {
    head: {
      meta: [{ name: "generator", content: "" }],
    },
  },
});

//
// // https://nuxt.com/docs/api/configuration/nuxt-config
//
// export default defineNuxtConfig({
//   compatibilityDate: "2024-11-01",
//   devtools: { enabled: false },
//   debug: false,
//   css: ["~/assets/css/main.css"],
//
//   postcss: {
//     plugins: {
//       tailwindcss: {},
//       autoprefixer: {},
//     },
//   },
//
//   plugins: [
//     { src: '~/plugins/mathjax.client.js', mode: 'client' },
//     { src: '~/plugins/mathjax-directive.client.js', mode: 'client' },
//     { src: '~/plugins/block-navigation.client.ts', mode: 'client' },
//     {src: '~/plugins/init-chapter-progress.client.js', mode: 'client'},
//   ],
//
//   modules: [
//     "@nuxtjs/google-fonts",
//     "@nuxt/image",
//     "@nuxt/icon",
//     "nuxt-swiper",
//     '@pinia/nuxt',
//     'pinia-plugin-persistedstate/nuxt',
//   ],
//
//   image: {
//     // dir: "assets/images",
//     // dirPublic: "public/images",
//     quality: 80,
//     format: ["webp"],
//     densities: [1],
//     screens: {
//       xs: 320,
//       sm: 640,
//       md: 768,
//       lg: 1024,
//       xl: 1280,
//       xxl: 1536,
//       "2xl": 2560,
//     },
//   },
//   devServer: {
//     host: ' 192.168.0.12 ',
//     port: 3000
//   },
//
// app:{
//   head:{
//     meta:[
//       { name: 'generator', content: '' },
//     ]
//   }
// }
//
// });
