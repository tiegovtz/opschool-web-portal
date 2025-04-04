import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: process.env.NUXT_DEV_TOOLS === 'true' },
  css: ["~/assets/css/main.css"],

  plugins: [
    { src: '~/plugins/mathjax.client.js', mode: 'client' },
    { src: '~/plugins/mathjax-directive.client.js', mode: 'client' }
  ],

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
    'nuxt-security'
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

  runtimeConfig: {
    public: {
      BASE_API_URL: process.env.NUXT_API_BASE_URL || 'https://apitie.ekima.africa/v1',
    },
  },

  devServer: {
    host: process.env.NUXT_LOCAL_NETWORK_IP || 'localhost',
    port: process.env.NUXT_RUNNING_PORT ? parseInt(process.env.NUXT_RUNNING_PORT) : 3000,
  },

  security: {
    strict: false,
    enabled: process.env.NUXT_ENABLE_SECURITY === 'true',
    hidePoweredBy: true,
    removeLoggers: true,

    headers: {
      contentSecurityPolicy: {
        'script-src': process.env.NUXT_CSP_SCRIPT_SRC?.split(" ") || ["'self'", 'https:', "'unsafe-inline'", 'https://www.google-analytics.com'],
        'style-src': process.env.NUXT_CSP_STYLE_SRC?.split(" ") || ["'self'", 'https:', "'unsafe-inline'"],
        'img-src': process.env.NUXT_CSP_IMG_SRC?.split(" ") || ["'self'", 'data:', 'https://apitie.ekima.africa', 'http://41.59.102.150:3000', 'blob:'],
        'media-src': ["'self'", 'https://apitier.ekima.africa', 'http://41.59.102.150:3000', 'blob:'],
        'object-src': process.env.NUXT_CSP_OBJECT_SRC || "'none'",
        'form-action': process.env.NUXT_CSP_FORM_ACTION || "'self'",
        'frame-ancestors': process.env.NUXT_CSP_FRAME_ANCESTORS || "'self'",
        'font-src': process.env.NUXT_CSP_FONT_SRC?.split(" ") || ["'self'", 'https:', 'data:'],
        'connect-src': process.env.NUXT_CORS_ALLOWED_ORIGIN?.split(",").map(domain => domain.trim()) || ['self'],
        'upgrade-insecure-requests': process.env.NUXT_CSP_UPGRADE_INSECURE_REQUESTS === 'true',
      },

      crossOriginResourcePolicy: 'same-origin',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginEmbedderPolicy: 'credentialless',
      originAgentCluster: '?1',
      referrerPolicy: 'no-referrer',
      strictTransportSecurity: {
        maxAge: 15552000,
        includeSubdomains: true,
      },
      xContentTypeOptions: 'nosniff',
      xDNSPrefetchControl: 'off',
      xDownloadOptions: 'noopen',
      xFrameOptions: 'SAMEORIGIN',
      xPermittedCrossDomainPolicies: 'none',
      xXSSProtection: '0',
    },

    requestSizeLimiter: {
      maxRequestSizeInBytes: parseInt(process.env.NUXT_MAX_REQUEST_SIZE || '2000000'),
      maxUploadFileRequestInBytes: parseInt(process.env.NUXT_MAX_UPLOAD_SIZE || '8000000'),
      throwError: true,
    },

    rateLimiter: {
      tokensPerInterval: parseInt(process.env.NUXT_RATE_LIMIT_TOKENS_PER_INTERVAL || '150'),
      interval: parseInt(process.env.NUXT_RATE_LIMIT_INTERVAL || '300000'),
      headers: false,
      driver: { name: 'lruCache' },
      throwError: true,
    },

    corsHandler: {
      origin: process.env.NUXT_CORS_ALLOWED_ORIGIN || '*',
      methods: process.env.NUXT_CORS_ALLOWED_METHODS?.split(',') || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      preflight: { statusCode: parseInt(process.env.NUXT_CORS_PREFLIGHT_STATUS || '204') },
    },

    allowedMethodsRestricter: {
      methods: '*',
      throwError: true,
    },

    xssValidator: {
      throwError: true,
    },

    csrf: process.env.NUXT_CSRF === 'true',
    nonce: process.env.NUXT_NONCE === 'true',
    sri: process.env.NUXT_SRI === 'true',
  },
});
