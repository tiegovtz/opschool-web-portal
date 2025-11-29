<script setup lang="ts">
import type { SwiperContainer } from 'swiper/element'

const containerRef = ref<SwiperContainer | null>(null)
const slides = [
  {
    image: "/images/1.TIE-Interactive.webp",
    alt: "A student demonstrates work on a desktop computer to a former prime minister Kassimu Majaliwa in a school computer lab, while other officials and students watch from rows of computers in the background.",
  },
  {
    image: "/images/9.TIE-Interactive.webp",
    alt: "Minister of Education Adolf Mkenda and the Director General of the Tanzania Institute of Education Anneth Komba stand with other officials under a tent, looking at textbooks and learning materials displayed on tables while a presenter explains them.",
  },
  {
    image: "/images/7.TIE-Interactive.webp",
    alt: "A female student in a white T-shirt leans over a laptop, typing or adjusting settings, while other students sit at the same table watching in a classroom.",
  },
  {
    image: "/images/6.TIE-Interactive.webp",
    alt: "Student in a white T-shirt writes in a notebook at a computer desk, with desktop monitors and other students working in the background.",
  },
  {
    image: "/images/5.TIE-Interactive.webp",
    alt: "Students in blue school uniforms sit in a computer lab, working at desktop computers in a row while a teacher assists in the background.",
  },
  {
    image: "/images/3.TIE-Interactive.webp",
    alt: "Students in blue uniforms work together at a science lab bench, using a multimeter and wires to test an electronics setup while classmates watch and take notes.",
  },
  {
    image: "/images/2.TIE-Interactive.webp",
    alt: "Student in a computer lab uses a desktop computer to build a Scratch-style coding program, with other students working at nearby machines in the background.",
  },
  {
    image: "/images/10.TIE-Interactive.webp",
    alt: "Minister of Education Adolf Mkenda, the Director General of the Tanzania Institute of Education Anneth Komba, a former prime minister kassim majaliwa, and other officials stand on a stage holding a large ‘Kitabu kimoja mwanafunzi mmoja campaign display during the launch event celebrating 50 years of the Tanzania Institute of Education.",
  },
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
      width: "38px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0077c599",
      color: "white",
      padding: "5px 0px",
      borderRadius: "5px",
      cursor: "pointer",
      opacity: "0",
      transition: "all .5s ease-in-out"
    };

    containerRef.value.addEventListener('mouseover', () => {
      prevEl.style.opacity = "1"
      nextEl.style.opacity = "1"
    })

    containerRef.value.addEventListener('mouseout', () => {
      prevEl.style.opacity = "0"
      nextEl.style.opacity = "0"
    })

    Object.assign(prevEl.style, buttonStyles);
    Object.assign(nextEl.style, buttonStyles);
  }
})

</script>

<template>
  <ClientOnly>
    <section class="relative w-full h-full max-h-[550px] overflow-hidden"
      aria-label="Featured interactive learning content">
      <swiper-container ref="containerRef" :init="false" class="w-full h-full max-h-[550px] overflow-hidden"
        role="region" aria-roledescription="carousel" aria-label="Image slider">
        <swiper-slide v-for="(slide, idx) in slides" :key="idx" role="group" aria-roledescription="slide"
          :aria-label="`Slide ${idx + 1} of ${slides.length}`" :aria-describedby="`slide-desc-${idx}`"
          :tabindex="idx">
          <NuxtImg :src="slide.image" :alt="slide.alt" class="object-cover w-full h-full rounded-md" />

          <!-- Hidden description for SR -->
          <p class="sr-only" :id="`slide-desc-${idx}`">
            {{ slide.alt }}
          </p>
        </swiper-slide>
      </swiper-container>
    </section>
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