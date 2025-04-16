// plugins/iconify.ts
import { Icon } from '@iconify/vue'
import { addCollection } from '@iconify/vue'
import solarIcons from '@iconify-json/solar/icons.json'
import mdiIcons from '@iconify-json/mdi/icons.json'
import phIcons from '@iconify-json/ph/icons.json'
import iconamoon from '@iconify-json/iconamoon/icons.json'

addCollection(solarIcons)
addCollection(mdiIcons)
addCollection(phIcons)
addCollection(iconamoon)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Icon', Icon)
})
