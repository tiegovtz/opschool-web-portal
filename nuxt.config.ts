// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import { vite as vidstack } from "vidstack/plugins";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  debug: false,
  srcDir: "app/",

  ignore: [
    ".claude/**",
    "Chunking/**",
    "remotion-lessons/**",
    ".playwright-mcp/**",
  ],
  watchers: {
    chokidar: {
      ignored: [
        "**/.claude/**",
        "**/Chunking/**",
        "**/remotion-lessons/**",
        "**/.playwright-mcp/**",
      ],
    },
  },
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
      isCustomElement: (tag) => tag.startsWith("media-"),
    },
  },

  runtimeConfig: {
    adtStoreBaseUrl: "",
    adtStoreApiKey: "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    ragApiBaseUrl:
      process.env.RAG_API_BASE_URL || "http://opschool.tie.go.tz:5002",
    insightsApiKey: process.env.INSIGHTS_API_KEY || "",
  },

  plugins: [
    { src: "~/plugins/mathjax.client.js", mode: "client" },
    { src: "~/plugins/mathjax-directive.client.js", mode: "client" },
    { src: "~/plugins/block-navigation.client.ts", mode: "client" },
    { src: "~/plugins/init-chapter-progress.client.js", mode: "client" },
  ],

  modules: ["@nuxtjs/google-fonts", "@nuxt/image", "@nuxt/icon", "@vite-pwa/nuxt"],

  pwa: {
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png"],
    manifest: {
      name: "TIE OpSchool",
      short_name: "OpSchool",
      description: "Tanzania Institute of Education online learning platform",
      theme_color: "#0a7ac8",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "any",
      scope: "/",
      start_url: "/",
      lang: "sw",
      categories: ["education"],
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      globPatterns: ["**/_nuxt/**/*.{js,css,woff2}", "pwa-*.png", "apple-touch-icon.png", "favicon.ico"],
      navigateFallback: undefined,
      runtimeCaching: [
        {
          urlPattern: ({ url }: { url: URL }) => url.origin === location.origin
            && /^\/api\/(?:auth|profile|chat|progress|recommendations)(?:\/|$)/.test(url.pathname),
          handler: "NetworkOnly",
        },
        {
          urlPattern: ({ url, request }: { url: URL; request: Request }) => request.method === "GET"
            && url.origin === location.origin && url.pathname.startsWith("/api/library/"),
          handler: "CacheFirst",
          options: {
            cacheName: "opschool-adt-publications",
            expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          urlPattern: ({ url, request }: { url: URL; request: Request }) => request.method === "GET"
            && url.origin === location.origin && url.pathname.startsWith("/api/adt/"),
          handler: "NetworkFirst",
          options: {
            cacheName: "opschool-adt-catalogue",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          urlPattern: ({ url, request }: { url: URL; request: Request }) => request.mode === "navigate"
            && url.origin === location.origin,
          handler: "NetworkFirst",
          options: {
            cacheName: "opschool-pages",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 14 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          urlPattern: ({ request }: { request: Request }) => ["script", "style", "worker", "font"].includes(request.destination),
          handler: "CacheFirst",
          options: {
            cacheName: "opschool-static-resources",
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ request }: { request: Request }) => ["image", "audio", "video"].includes(request.destination),
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "opschool-media",
            expiration: { maxEntries: 750, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ url, request }: { url: URL; request: Request }) => request.method === "GET"
            && url.origin === location.origin,
          handler: "NetworkFirst",
          options: {
            cacheName: "opschool-accessed-content",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 750, maxAgeSeconds: 60 * 60 * 24 * 14 },
            cacheableResponse: { statuses: [200] },
          },
        },
      ],
    },
    devOptions: { enabled: false },
  },

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
  //   // host: "192.168.0.147",
  //   port: 3010,
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
    optimizeDeps: {
      force: true, // Force re-optimization of dependencies
      include: [
        "pinia",
        "pinia-plugin-persistedstate",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "@google/model-viewer",
        "@ai-sdk/vue",
        "bowser",
        "axios",
        "markdown-it",
        "zod/v4/locales",
        "@iconify/vue",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "crypto-js",
        "embla-carousel-autoplay",
        "embla-carousel-vue",
        'jwt-decode',
        '@vueuse/core',
         'page-flip', // CJS
        'pdfjs-dist',
        'pdfjs-dist/build/pdf',
      ],
    },
    server: {
      fs: {
        allow: [".."], // Allow accessing files outside the project root
      },
    },
  },

  app: {
    head: {
      meta: [
        { name: "generator", content: "" },
        { name: "theme-color", content: "#0a7ac8" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "OpSchool" },
      ],
      link: [
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      ],
    },
  },
});
