import { nonceValue } from "~/utilities/controlls"

// plugins/nonce.client.ts
export default defineNuxtPlugin(() => {
    nonceValue.value = (window as any).__APP_NONCE__ || null
  })
  