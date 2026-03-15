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
    <NuxtLoadingIndicator color="#56ade8" errorColor="#f00" />
    <NuxtPage @contextmenu.prevent />
    <GlobalLauncher />
    <TieAiTeacherModalHost />
  </NuxtLayout>
</template>
