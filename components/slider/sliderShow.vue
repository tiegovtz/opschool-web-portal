<script setup lang="ts">
const containerRef = ref(null)
const slides = ref(Array.from({ length: 10 }))
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
    <swiper-container ref="containerRef" :init="false" class="w-full h-full overflow-hidden">
      <swiper-slide
        v-for="(slide, idx) in slides"
        :key="idx"
      >
        <!-- Slide {{ idx + 1 }} -->
        <NuxtImg :src="`https://picsum.photos/200/30${idx}`" alt="Slider Image" class="rounded-md w-full h-full object-cover" />
      </swiper-slide>
    </swiper-container>
  </ClientOnly>
</template>

<!-- styles -->