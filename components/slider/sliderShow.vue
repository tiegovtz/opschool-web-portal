<script setup lang="ts">
const containerRef = ref(null)
const slides = [
  "/images/8.TIE-Interactive.webp",
  "/images/1.TIE-Interactive.jpg",
  "/images/9.TIE-Interactive.webp",
  "/images/7.TIE-Interactive.webp",
  "/images/6.TIE-Interactive.webp",
  "/images/5.TIE-Interactive.webp",
  "/images/3.TIE-Interactive.webp",
  "/images/2.TIE-Interactive.jpg",
]
const swiper = useSwiper(containerRef, {
  effect: 'fade',
  pagination: {
    clickable: true,
  },
  loop: true,
  autoplay: {
    delay: 5000,
  },
})

</script>

<template>
  <ClientOnly>
    <swiper-container v-trusted ref="containerRef" :init="false" class="w-full h-full max-h-[550px] overflow-hidden">
      <swiper-slide  v-for="(slide, idx) in slides" :key="idx">
        <!-- Slide {{ idx + 1 }} -->
        <NuxtImg :src="`${slide}`" alt="Slider Image" class="object-cover w-full h-full rounded-md" />
      </swiper-slide>
    </swiper-container>
  </ClientOnly>
</template>