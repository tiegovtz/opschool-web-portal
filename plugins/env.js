// plugins/env.js

import { _BASE_API_URL } from "~/utilities/controlls.js"

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig()
    _BASE_API_URL.value = config.public.BASE_API_URL
    // Provide the BASE_API_URL to the entire app
    nuxtApp.provide('BASE_API_URL', config.public.BASE_API_URL)
  })
  