// https://nuxt.com/docs/api/configuration/nuxt-config
import { vite as vidstack } from "vidstack/plugins";
import { clearServiceWorker } from "./scripts/clear-service-worker.mjs";

const imageDomains = [
  process.env.VITE_API_BASE_URL,
  process.env.NUXT_PUBLIC_IMAGE_FETCH_ORIGIN,
  process.env.NUXT_PUBLIC_UPLOADS_BASE_URL,
  "http://41.59.251.166",
  "https://opschool.tie.go.tz",
].flatMap((value) => {
  try {
    return value ? [new URL(value).host] : [];
  } catch {
    return [];
  }
});

export default defineNuxtConfig({
  compatibilityDate: '2026-10-31',
  devtools: { enabled: true },
  debug: false,
  srcDir: "app/",
  typescript: {
    typeCheck:true
  },
  experimental: {
    // Bundling Vue avoids a recursive peer-dependency symlink tree in Nitro's output.
    externalVue: false,
  },
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
    // Preserve the build-time .env value in production; NUXT_CSRF_ENABLED can
    // still override it in the running server's environment.
    csrfEnabled: process.env.NUXT_CSRF_ENABLED?.trim().toLowerCase() !== "false",
    public: {
      localInboxDemo: process.env.NODE_ENV !== "production" && process.env.INBOX_DEMO_ENABLED === "true",
      imageFetchOrigin: process.env.NUXT_PUBLIC_IMAGE_FETCH_ORIGIN || "",
      // Base origin for relative "uploads/..." paths embedded in chapter
      // content (models, experiments, inline audio). Derived from the API
      // base URL so each environment resolves its own uploads correctly,
      // rather than content being frozen to whichever environment it was
      // authored/copied from.
      // Falls back to "/api" (gateway-relative, not an absolute host) so
      // environments that leave VITE_API_BASE_URL unset still resolve
      // uploads against their own gateway instead of a hardcoded host.
      uploadsBaseUrl: process.env.NUXT_PUBLIC_UPLOADS_BASE_URL || (process.env.VITE_API_BASE_URL || "/api/v1").replace(/\/v\d+\/?$/, ""),
    },
    backendApiBaseUrl: process.env.VITE_API_BASE_URL || "https://opschool.tie.go.tz:5001/v1",
    supportApiBaseUrl: "",
    adtStoreBaseUrl: "",
    adtStoreApiKey: "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    // Insights (textbook RAG). No default: an unset URL is reported as
    // "textbook search unavailable" instead of silently using plain HTTP.
    // Can also be set at runtime with NUXT_RAG_API_BASE_URL / NUXT_INSIGHTS_API_KEY.
    ragApiBaseUrl: process.env.RAG_API_BASE_URL || "",
    insightsApiKey: process.env.INSIGHTS_API_KEY || "",
  },

  plugins: [
    { src: "~/plugins/mathjax.client.js", mode: "client" },
    { src: "~/plugins/mathjax-directive.client.js", mode: "client" },
    { src: "~/plugins/block-navigation.client.ts", mode: "client" },
    { src: "~/plugins/init-chapter-progress.client.js", mode: "client" },
  ],

  modules: ["@nuxtjs/google-fonts", "@nuxt/image", "@nuxt/icon", "@vite-pwa/nuxt", "nuxt-mathjax"],

  // nuxt-mathjax types omit valid MathJax loader options and the mhchem package map.
  MathJax: {
    component: "tex-mml-chtml",
    mathjax: {
      tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        processEscapes: true,
        processEnvironments: true,
        packages: { "[+]": ["mhchem"] },
      },
      loader: { load: ["[tex]/mhchem"] },
      options: { skipHtmlTags: ["script", "noscript", "style"] },
    },
  } as any,

  // Self-host the fonts (download: true, the module default) instead of a
  // render-blocking @import to fonts.googleapis.com/fonts.gstatic.com.
  googleFonts: {
    display: "swap",
    families: {
      "PT Serif": { wght: [400, 700], ital: [400, 700] },
      Poppins: {
        wght: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        ital: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      },
    },
  },

  // Existing installations must fetch the worker that unregisters the old PWA.
  routeRules: {
    "/sw.js": { headers: { "cache-control": "no-store" } },
  },
  // Content-hashed build output can keep its normal immutable HTTP cache.
  $production: {
    routeRules: {
      "/_nuxt/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/images/**": { headers: { "cache-control": "public, max-age=2592000" } },
      "/font/**": { headers: { "cache-control": "public, max-age=2592000" } },
      "/pwa-*.png": { headers: { "cache-control": "public, max-age=2592000" } },
      "/apple-touch-icon.png": { headers: { "cache-control": "public, max-age=2592000" } },
      "/favicon.ico": { headers: { "cache-control": "public, max-age=2592000" } },
    },
  },
  $development: {
    routeRules: {
      "/_nuxt/**": { headers: { "cache-control": "no-store" } },
    },
  },

  hooks: {
    'imports:extend'(imports) {
      for (let index = imports.length - 1; index >= 0; index--) {
        const entry = imports[index]
        if (entry?.from.endsWith('/types/interactive-video.interface.ts') &&
            (entry.name === 'QuizOption' || entry.name === 'VideoInteraction')) {
          imports.splice(index, 1)
        }
      }
    },
  },

  // Keep the integration disabled; public/sw.js retires existing installations.
  pwa: {
    disable: true,
    manifest: false,
    injectRegister: false,
    client: { registerPlugin: false },
    devOptions: { enabled: false },
  },

  image: {
    domains: [...new Set(imageDomains)],
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
      include: [
        "ai",
        "pinia",
        "pinia-plugin-persistedstate",
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
        'chart.js/auto',
        'function-plot'
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
      script: [{
        key: "clear-service-worker",
        tagPriority: "critical",
        innerHTML: `(${clearServiceWorker.toString()})().catch(error => console.warn('Service worker cleanup failed:', error));`,
      }],
      meta: [
        { name: "generator", content: "" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0a7ac8" },
      ],
    },
  },
});
