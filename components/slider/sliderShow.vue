<script setup lang="ts">
const containerRef = ref(null)
const slides = [
  "https://www.tie.go.tz/uploads/sliders/b262d79305622e44b9792efd49ddae07.jpeg",
  "https://www.tie.go.tz/uploads/sliders/bebb7c4be734635443eb6fff5aa43a91.jpeg",
  "https://www.tie.go.tz/uploads/sliders/292a86ec5ab35282bb386dcedad9bfbf.jpeg",
  "https://www.tie.go.tz/uploads/sliders/37280f550f6b166a65a458589feb44b1.jpeg",
  "https://www.tie.go.tz/uploads/sliders/91aaced44ec49c16d8c028d948473c81.jpeg",
  "https://www.tie.go.tz/uploads/sliders/94d6f99e1e01011e9b647f231e01faa6.jpeg",
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
    <swiper-container ref="containerRef" :init="false" class="w-full h-full overflow-hidden">
      <swiper-slide v-for="(slide, idx) in slides" :key="idx">
        <!-- Slide {{ idx + 1 }} -->
        <NuxtImg :src="`${slide}`" alt="Slider Image" class="rounded-md w-full h-full object-cover" />
      </swiper-slide>
    </swiper-container>
  </ClientOnly>
</template>

<!-- styles -->