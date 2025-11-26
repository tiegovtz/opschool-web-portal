<script setup>
import { PaginationBtn } from "#components"

// Define State
const containerRef = ref(null)

defineProps({
  pages: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
})
   
const emit = defineEmits(['sendSliderPageNumber','sendSliderCurrentPageNumber'])

const swiper = useSwiper(containerRef, {
  effect: 'fade',
  navigation: true,
  loop: true,
})   
</script>

<template>
 <ClientOnly>
    <swiper-container ref="containerRef" :init="false" class="w-full">
     <div class="max-w-[200px] mx-auto flex justify-center gap-2">
         <swiper-slide v-for="(page, idx) in pages" :key="idx">
        <!-- Slide {{ idx + 1 }} -->
        <PaginationBtn
          :page-number="page"
          :is-active="page === currentPage"
          :disabled="page === currentPage"
          @send-page-number="($event)=>{
            emit('sendSliderPageNumber',$event)
            emit('sendSliderCurrentPageNumber',page)
          }"
        />
      </swiper-slide>
     </div>
    </swiper-container>
  </ClientOnly>
</template>