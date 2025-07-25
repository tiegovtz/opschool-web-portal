// plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Import Vuetify styles
import 'vuetify/styles'

// You can customize your theme here if you want
const vuetify = createVuetify({
    components,
    directives,
    // theme: { ... } // optional theme config
})

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(vuetify)
})
