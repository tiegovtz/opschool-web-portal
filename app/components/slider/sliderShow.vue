<script setup lang="ts">
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-vue'
import type { LanguageSupport } from '~/types/language.interface'

type SliderVariant = 'primary' | 'secondary' | 'landing'

const props = withDefaults(
  defineProps<{ educationLevel?: string, language?: LanguageSupport, variant?: SliderVariant }>(),
  {
    language: 'english',
    variant: 'secondary',
  },
)

const slides = computed(() => {
  if (props.variant === 'secondary') {
    return [
      {
        image: '/images/1.TIE-Interactive.webp',
        alt: 'A student demonstrates work on a desktop computer to a former prime minister Kassimu Majaliwa in a school computer lab, while other officials and students watch from rows of computers in the background.',
      },
      {
        image: '/images/9.TIE-Interactive.webp',
        alt: 'Minister of Education Adolf Mkenda and the Director General of the Tanzania Institute of Education Anneth Komba stand with other officials under a tent, looking at textbooks and learning materials displayed on tables while a presenter explains them.',
      },
      {
        image: '/images/7.TIE-Interactive.webp',
        alt: 'A female student in a white T-shirt leans over a laptop, typing or adjusting settings, while other students sit at the same table watching in a classroom.',
      },
      {
        image: '/images/6.TIE-Interactive.webp',
        alt: 'Student in a white T-shirt writes in a notebook at a computer desk, with desktop monitors and other students working in the background.',
      },
      {
        image: '/images/5.TIE-Interactive.webp',
        alt: 'Students in blue school uniforms sit in a computer lab, working at desktop computers in a row while a teacher assists in the background.',
      },
      {
        image: '/images/3.TIE-Interactive.webp',
        alt: 'Students in blue uniforms work together at a science lab bench, using a multimeter and wires to test an electronics setup while classmates watch and take notes.',
      },
      {
        image: '/images/2.TIE-Interactive.webp',
        alt: 'Student in a computer lab uses a desktop computer to build a Scratch-style coding program, with other students working at nearby machines in the background.',
      },
      {
        image: '/images/10.TIE-Interactive.webp',
        alt: 'Minister of Education Adolf Mkenda, the Director General of the Tanzania Institute of Education Anneth Komba, a former prime minister kassim majaliwa, and other officials stand on a stage holding a large ‘Kitabu kimoja mwanafunzi mmoja campaign display during the launch event celebrating 50 years of the Tanzania Institute of Education.',
      },
    ]
  }

  if (props.variant === 'primary') {
    return [
      {
        image: '/images/primary-01.png',
        alt: '',
      },
      {
        image: '/images/primary-02.png',
        alt: '',
      },
    ]
  }

  if (props.variant === 'landing') {
    return [
      {
        image: '/images/primary-01.png',
        alt: '',
      },
      {
        image: '/images/primary-02.png',
        alt: '',
      },
      {
        image: '/images/kids.png',
        alt: '',
      },
      {
        image: '/images/science-lab.png',
        alt: '',
      },
    ]
  }

  return []
})

const options = computed(() => ({
  loop: slides.value.length > 1,
  duration: 35,
}))

const autoplay = Autoplay({
  delay: 5000,
})

const [emblaRef, emblaApi] = useEmblaCarousel(options, [autoplay])
const scrollSnaps = ref<number[]>([])
const selectedSnap = ref(0)

function invokeEmbla(api: any, primaryMethod: string, fallbackMethod: string, ...args: any[]) {
  const method = api?.[primaryMethod] ?? api?.[fallbackMethod]

  if (typeof method === 'function') {
    return method.apply(api, args)
  }

  return undefined
}

function syncEmblaState(api: any) {
  scrollSnaps.value = invokeEmbla(api, 'snapList', 'scrollSnapList') ?? []
  selectedSnap.value = invokeEmbla(api, 'selectedSnap', 'selectedScrollSnap') ?? 0
}

function getLoopedIndex(index: number, total: number) {
  if (!total) {
    return 0
  }

  return (index + total) % total
}

function getSlideVisualClass(index: number) {
  const total = slides.value.length

  if (!total) {
    return 'embla__slide__inner--idle'
  }

  const activeIndex = selectedSnap.value
  const prevIndex = getLoopedIndex(activeIndex - 1, total)
  const nextIndex = getLoopedIndex(activeIndex + 1, total)

  if (index === activeIndex) {
    return 'embla__slide__inner--active'
  }

  if (index === prevIndex) {
    return 'embla__slide__inner--prev'
  }

  if (index === nextIndex) {
    return 'embla__slide__inner--next'
  }

  return 'embla__slide__inner--idle'
}

function restartAutoplay() {
  const api = emblaApi.value as any
  api?.plugins?.().autoplay?.reset?.()
  api?.plugins?.().autoplay?.play?.()
}

function goTo(index: number) {
  const api = emblaApi.value as any
  invokeEmbla(api, 'goTo', 'scrollTo', index)
  restartAutoplay()
}

function goToPrev() {
  const api = emblaApi.value as any
  invokeEmbla(api, 'goToPrev', 'scrollPrev')
  restartAutoplay()
}

function goToNext() {
  const api = emblaApi.value as any
  invokeEmbla(api, 'goToNext', 'scrollNext')
  restartAutoplay()
}

let removeEmblaListeners: (() => void) | undefined

watch(
  emblaApi,
  (apiRef) => {
    removeEmblaListeners?.()

    const api = apiRef as any

    if (!api) {
      scrollSnaps.value = []
      selectedSnap.value = 0
      return
    }

    const onSync = () => syncEmblaState(api)

    onSync()
    api.plugins?.().autoplay?.play?.()

    const events = ['select', 'reinit', 'reInit']
    events.forEach((eventName) => api.on?.(eventName, onSync))

    removeEmblaListeners = () => {
      events.forEach((eventName) => api.off?.(eventName, onSync))
    }
  },
  { immediate: true },
)

watch(
  () => slides.value.length,
  (slideCount) => {
    const api = emblaApi.value as any

    if (!api) {
      return
    }

    if (slideCount > 1) {
      api.plugins?.().autoplay?.play?.()
      return
    }

    api.plugins?.().autoplay?.stop?.()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  removeEmblaListeners?.()
})
</script>

<template>
  <section
    class="group relative w-full h-full max-h-[550px]"
    aria-label="Featured interactive learning content"
  >
    <div class="embla relative h-full">
      <div
        ref="emblaRef"
        class="embla__viewport h-full overflow-hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Image slider"
      >
        <div class="embla__container h-full">
          <div
            v-for="(slide, idx) in slides"
            :key="idx"
            class="embla__slide"
            role="group"
            aria-roledescription="slide"
            :aria-label="`Slide ${idx + 1} of ${slides.length}`"
            :aria-describedby="`slide-desc-${idx}`"
          >
              <div
                :class="[
                  'embla__slide__inner h-full',
                  getSlideVisualClass(idx),
                ]"
              >
              <NuxtImg
                :src="slide.image"
                :alt="slide.alt"
                :class="[
                  'object-cover w-full h-full',
                  variant === 'landing' ? 'rounded-3xl' : 'rounded-md',
                ]"
              />
            </div>

            <p class="sr-only" :id="`slide-desc-${idx}`">
              {{ slide.alt }}
            </p>
          </div>
        </div>
      </div>

      <button
        v-if="slides.length > 1"
        type="button"
        class="embla__nav embla__nav--prev"
        aria-label="Previous slide"
        @click="goToPrev"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m12 18.5l7.265 2.463c.196.077.42.032.57-.116a.55.55 0 0 0 .134-.572L12 3L4.03 20.275c-.07.2-.017.424.135.572c.15.148.374.193.57.116z"
          />
        </svg>
      </button>

      <button
        v-if="slides.length > 1"
        type="button"
        class="embla__nav embla__nav--next"
        aria-label="Next slide"
        @click="goToNext"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m12 18.5l7.265 2.463c.196.077.42.032.57-.116a.55.55 0 0 0 .134-.572L12 3L4.03 20.275c-.07.2-.017.424.135.572c.15.148.374.193.57.116z"
          />
        </svg>
      </button>

      <div v-if="scrollSnaps.length > 1" class="embla__dots">
        <button
          v-for="(_, idx) in scrollSnaps"
          :key="idx"
          type="button"
          :class="[
            'embla__dot',
            idx === selectedSnap ? 'embla__dot--selected' : '',
          ]"
          :aria-label="`Go to slide ${idx + 1}`"
          :aria-pressed="idx === selectedSnap"
          @click="goTo(idx)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.embla__viewport {
  cursor: grab;
}

.embla__viewport:active {
  cursor: grabbing;
}

.embla__container {
  display: flex;
  height: 100%;
  touch-action: pan-y pinch-zoom;
}

.embla__slide {
  flex: 0 0 100%;
  min-width: 0;
}

.embla__slide__inner {
  height: 100%;
  transform-origin: center;
  transition:
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity, filter;
}

.embla__slide__inner--active {
  opacity: 1;
  filter: blur(0);
  transform: perspective(1200px) rotate(0deg) scale(1);
}

.embla__slide__inner--prev {
  opacity: 0.12;
  filter: blur(1px);
  transform: perspective(1200px) rotate(-12deg) scale(0.82);
}

.embla__slide__inner--next {
  opacity: 0.12;
  filter: blur(1px);
  transform: perspective(1200px) rotate(12deg) scale(1.14);
}

.embla__slide__inner--idle {
  opacity: 0;
  filter: blur(2px);
  transform: perspective(1200px) rotate(0deg) scale(0.9);
}

.embla__nav {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  height: 32px;
  width: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background-color: rgb(0 119 197 / 60%);
  color: white;
  opacity: 0;
  transform: translateY(-50%);
  transition: all 0.5s ease-in-out;
}

.group:hover .embla__nav,
.group:focus-within .embla__nav {
  opacity: 1;
}

.embla__nav--prev {
  left: 12px;
}

.embla__nav--next {
  right: 12px;
}

.embla__nav--prev svg {
  rotate: -90deg;
}

.embla__nav--next svg {
  rotate: 90deg;
}

.embla__dots {
  position: absolute;
  bottom: 18px;
  left: 50%;
  z-index: 10;
  display: flex;
  gap: 10px;
  transform: translateX(-50%);
}

.embla__dot {
  height: 10px;
  width: 10px;
  border-radius: 9999px;
  background-color: white;
  transition: all 0.5s ease-in-out;
}

.embla__dot--selected {
  height: 14px;
  background-color: var(--color-oceanBlue);
}
</style>
