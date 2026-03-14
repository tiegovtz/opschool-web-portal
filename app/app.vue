<script setup lang="ts">
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  isGreaterToXS,
  screenWidth
} from './utilities/controlls'
import GlobalLauncher from '@/components/assistant/GlobalLauncher.vue'
import TieAiTeacherModalHost from '@/components/assistant/TieAiTeacherModalHost.vue'
import TiePreloader from '@/components/included/TiePreloader.vue'

const route = useRoute()
const PRELOADER_DONE_KEY = 'tie-preloader-done'

// Show preloader by default on landing so it's in the initial HTML (first paint)
const isLandingPath = () => route.path === '/' || route.path === '/home'
const showLandingPreloader = ref(isLandingPath())

function checkShowPreloader() {
  if (import.meta.client && isLandingPath()) {
    const done = sessionStorage.getItem(PRELOADER_DONE_KEY)
    showLandingPreloader.value = !done
  }
}

function onPreloaderDone() {
  if (import.meta.client) {
    sessionStorage.setItem(PRELOADER_DONE_KEY, '1')
    showLandingPreloader.value = false
  }
}

watch(() => route.path, checkShowPreloader, { immediate: true })
onMounted(checkShowPreloader)

// Resize state
const widthGreater1280 = computed(() => screenWidth.value >= 1280)
const widthGreater1024 = computed(() => screenWidth.value >= 1024 && screenWidth.value < 1280)
const widthGreater768 = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
const widthGreater640 = computed(() => screenWidth.value >= 640 && screenWidth.value < 768)
const widthGreater320 = computed(() => screenWidth.value >= 320 && screenWidth.value < 640)

const handleResize = () => {
  screenWidth.value = window.innerWidth
  isGreaterToXL.value = widthGreater1280.value
  isGreaterToLG.value = widthGreater1024.value
  isGreaterToMD.value = widthGreater768.value
  isGreaterToSM.value = widthGreater640.value
  isGreaterToXS.value = widthGreater320.value
}

onMounted(async () => {
  screenWidth.value = window.innerWidth
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
});

</script>

<template>
  <NuxtLayout>
    <TiePreloader v-if="showLandingPreloader" @done="onPreloaderDone" />
    <NuxtLoadingIndicator color="#56ade8" errorColor="#f00" />
    <NuxtPage @contextmenu.prevent />
    <GlobalLauncher />
    <TieAiTeacherModalHost />
  </NuxtLayout>
</template>
