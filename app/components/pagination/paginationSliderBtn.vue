<script setup lang="ts">
import useEmblaCarousel from 'embla-carousel-vue'
import { PaginationBtn } from '#components'

const props = defineProps({
  pages: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['sendSliderPageNumber', 'sendSliderCurrentPageNumber'])

const [emblaRef, emblaApi] = useEmblaCarousel({
  align: 'center',
  containScroll: 'trimSnaps',
  dragFree: true,
})

function invokeEmbla(api: any, primaryMethod: string, fallbackMethod: string, ...args: any[]) {
  const method = api?.[primaryMethod] ?? api?.[fallbackMethod]

  if (typeof method === 'function') {
    return method.apply(api, args)
  }

  return undefined
}

watch(
  () => props.currentPage,
  (currentPage) => {
    const api = emblaApi.value as any

    if (!api) {
      return
    }

    invokeEmbla(api, 'goTo', 'scrollTo', Math.max(currentPage - 1, 0), true)
  },
  { immediate: true },
)
</script>

<template>
  <div class="embla w-full">
    <div ref="emblaRef" class="embla__viewport">
      <div class="embla__container max-w-[200px] mx-auto">
        <div
          v-for="page in pages"
          :key="page"
          class="embla__slide"
        >
          <PaginationBtn
            :page-number="page"
            :is-active="page === currentPage"
            :disabled="page === currentPage"
            @send-page-number="($event) => {
              emit('sendSliderPageNumber', $event)
              emit('sendSliderCurrentPageNumber', page)
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.embla__viewport {
  overflow: hidden;
}

.embla__container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  touch-action: pan-y pinch-zoom;
}

.embla__slide {
  flex: 0 0 auto;
  min-width: 0;
}
</style>
