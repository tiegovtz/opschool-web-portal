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

onMounted( async() => {
 await nextTick()

 //find the swiper pagination
 if(containerRef.value) {
   const swiperInstance = containerRef.value.swiper
   const paginationBullets = swiperInstance.pagination.bullets

   // add styles to the active bullet
   swiperInstance.on('paginationUpdate', () => {
     paginationBullets.forEach((bullet: HTMLElement) => {
       bullet.style.width = '10px'
       bullet.style.height = '10px'
       bullet.style.borderRadius = '50%'
       bullet.style.backgroundColor = '#56ade8'
       bullet.style.opacity = '0.8'
       bullet.style.transition = 'all 0.5s ease-in-out'
     })
     const activeBullet = paginationBullets[swiperInstance.realIndex]
     activeBullet.style.width = '20px'
      activeBullet.style.borderRadius = '4px'
      activeBullet.style.opacity = '1'
     activeBullet.style.backgroundColor = '#fff'
   })
   // add styles to the bullets on init
 }
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
