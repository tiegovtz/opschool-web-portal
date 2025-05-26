<script setup>
import { isGreaterToXL, isGreaterToLG, isGreaterToMD, isGreaterToSM, isGreaterToXS, screenWidth } from './utilities/controlls';


 if(import.meta.client){
     screenWidth.value = window.innerWidth
// various screen dimensions
const widthGreater1280 = computed(() => screenWidth.value >=  1280)
const widthGreater1024 = computed(() => screenWidth.value >= 1024 && screenWidth.value < 1280)
const widthGreater768 = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
const widthGreater640 = computed(() => screenWidth.value >= 640 && screenWidth.value < 768)
const widthGreater320 = computed(() => screenWidth.value >= 320 && screenWidth.value < 640)


// function for resizing
const handleResize = () => {
  screenWidth.value = window.innerWidth
  isGreaterToXL.value  = widthGreater1280.value
  isGreaterToLG.value = widthGreater1024.value
  isGreaterToMD.value  = widthGreater768.value
  isGreaterToSM.value = widthGreater640.value
  isGreaterToXS.value = widthGreater320.value
}

onMounted(() => {

window.addEventListener('resize', handleResize) //resizing window
window.addEventListener('load', handleResize) // resize on loading
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('load', handleResize) // resize on loading
})
 }
  // console.log(disableshots)
</script>
<template>

  <NuxtLayout >
    <NuxtLoadingIndicator color="#56ade8" errorColor="#f00"/>
    <NuxtPage @contextmenu.prevent  />
  </NuxtLayout>

</template>
