<script setup lang="ts">
const containerRef = ref(null)
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
  pagination: {
    clickable: true,
  },
  grabCursor: true,
  autoplay: {
    delay: 5000,
  },
  speed: 800,
  creativeEffect: {
    prev: {
      shadow: true,
      translate: [0, 0, -400],
      scale: 0.8,
    },
    next: {
      translate: ['100%', 0, 0],
    },
  },
})

</script>

<template>
  <ClientOnly>
    <swiper-container v-trusted ref="containerRef" :init="false" class="w-full h-full max-h-[550px] overflow-hidden">
      <swiper-slide v-trusted v-for="(slide, idx) in slides" :key="idx">
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
