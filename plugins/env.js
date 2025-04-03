// plugins/env.js

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig()
    nuxtApp.provide('BASE_API_URL', config.public.BASE_API_URL)
  })
  