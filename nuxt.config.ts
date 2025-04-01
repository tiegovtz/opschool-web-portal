import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';
import apiDocs from "./utilities/api-docs";
// import '@google/model-viewer';

// https://nuxt.com/docs/api/configuration/nuxt-config
const isProd = process.env.NODE_ENV?.toString().toLowerCase() === 'production';
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
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

  devServer: {
    host: ' 192.168.0.12 ',
    port: 3001
  },
  runtimeConfig: {
    public: {
      enableSecurity: isProd // ✅ Control security dynamically
    }
  },
  security: {
    strict: false,
    enabled: isProd,
    hidePoweredBy: true,
    removeLoggers: true,

    headers: {
      contentSecurityPolicy: {
        'base-uri': ["'none'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': [
          "'self'", 'https:', "'unsafe-inline'",
          "'strict-dynamic'", "'nonce-{{nonce}}'"
        ],
        'upgrade-insecure-requests': true
      },

      crossOriginResourcePolicy: 'same-origin',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginEmbedderPolicy: 'credentialless',
      originAgentCluster: '?1',
      referrerPolicy: 'no-referrer',
      strictTransportSecurity: {
        maxAge: 15552000, // 180 days
        includeSubdomains: true
      },
      xContentTypeOptions: 'nosniff',
      xDNSPrefetchControl: 'off',
      xDownloadOptions: 'noopen',
      xFrameOptions: 'SAMEORIGIN',
      xPermittedCrossDomainPolicies: 'none',
      xXSSProtection: '0'
    },

    requestSizeLimiter: {
      maxRequestSizeInBytes: 2000000,
      maxUploadFileRequestInBytes: 8000000,
      throwError: true
    },
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 300000,
      headers: false,
      driver: { name: 'lruCache' },
      throwError: true
    },

    corsHandler: {
      origin: apiDocs.baseURL,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      preflight: { statusCode: 204 }
    },

    allowedMethodsRestricter: {
      methods: '*',
      throwError: true
    },

    xssValidator: {
      throwError: true
    },

    csrf: true,
    nonce: true,
    sri: true,

    ssg: {
      meta: true,
      hashScripts: true,
      hashStyles: false,
      nitroHeaders: true,
      exportToPresets: true
    }
  } // 🔹 Disable security in development
});