<script setup lang="ts">
import type { VideoInteraction } from '~/types/interactive-video.interface'

interface Props {
  interaction: VideoInteraction
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
})

const emit = defineEmits<{
  click: [interaction: VideoInteraction]
}>()

const position = computed(() => props.interaction)
const ariaLabel = computed(() => props.interaction || props.interaction || 'Hotspot')

const handleClick = () => {
  emit('click', props.interaction)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <button :style="{
    left: `${position}%`,
    top: `${position}%`,
  }" class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto
           w-12 h-12 bg-primary rounded-full flex items-center justify-center
           hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
           animate-pulse" :tabindex="0" @click="handleClick" @keydown="handleKeyDown">
    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  </button>
</template>
