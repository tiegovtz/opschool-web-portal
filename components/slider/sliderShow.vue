<script setup lang="ts">
import type { SwiperContainer } from 'swiper/element'

const containerRef = ref<SwiperContainer | null>(null)
const slides = [
  "/images/8.TIE-Interactive.webp",
  "/images/1.TIE-Interactive.webp",
  "/images/9.TIE-Interactive.webp",
  "/images/7.TIE-Interactive.webp",
  "/images/6.TIE-Interactive.webp",
  "/images/5.TIE-Interactive.webp",
  "/images/3.TIE-Interactive.webp",
  "/images/2.TIE-Interactive.webp",
  "/images/10.TIE-Interactive.webp",
]

const swiper = useSwiper(containerRef, {
  effect: 'creative',
  loop: true,
  navigation: true,
  grabCursor: true,
  autoplay: {
    delay: 5000,
  },
  speed: 2000,

  creativeEffect: {
    prev: {
      opacity: 0,
      scale: 0.8,
      rotate: [-10, -15, -30],  // leftward bend
      origin: "center",
    },
    next: {
      opacity: 0,
      scale: 1.4,
      rotate: [10, 15, 30],  // rightward bend
      origin: "center",
    },
  },

});


onMounted(async () => {
  await nextTick()

  //find the swiper pagination
  if (containerRef.value) {
    const swiperInstance = containerRef.value.swiper
    const navigationBtn = swiperInstance.navigation

    const prevEl = navigationBtn.prevEl
    const nextEl = navigationBtn.nextEl

    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 18.5l7.265 2.463c.196.077.42.032.57-.116a.55.55 0 0 0 .134-.572L12 3L4.03 20.275c-.07.2-.017.424.135.572c.15.148.374.193.57.116z"/></svg>`

    prevEl.innerHTML = svgIcon
    nextEl.innerHTML = svgIcon

    prevEl.style.rotate = "-90deg"
    nextEl.style.rotate = "90deg"

    // Shared styles
    const buttonStyles: Partial<CSSStyleDeclaration> = {
      width: "48px",
      height: "42px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0077c5",
      color: "white",
      padding: "5px 0px",
      borderRadius: "5px",
      cursor: "pointer",
      bottom: "10px",
      top: "unset",
    };

    Object.assign(prevEl.style, buttonStyles);
    Object.assign(nextEl.style, buttonStyles);
  }
})

</script>

<template>
  <ClientOnly>
    <swiper-container ref="containerRef" :init="false" class="w-full h-full max-h-[550px] overflow-hidden">
      <swiper-slide v-for="(slide, idx) in slides" :key="idx">
        <!-- Slide {{ idx + 1 }} -->
        <NuxtImg :src="`${slide}`" alt="Slider Image" class="object-cover w-full h-full rounded-md" />
      </swiper-slide>
    </swiper-container>
  </ClientOnly>
</template>

<style scoped>
::v-deep(.swiper-pagination-bullet) {
  height: 10px !important;
  width: 10px !important;
  border-radius: 50%;
  background-color: white !important;
  transition: all 0.5s ease-in-out;
}

::v-deep(.swiper-pagination-bullet-active) {
  height: 14px !important;
  background-color: var(--color-oceanBlue) !important;
}
</style>
