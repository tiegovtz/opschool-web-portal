<template>
  <div class="vidstack-wrapper">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <ClientOnly v-else>
      <media-player ref="playerRef" :title="title" :src="src" @play="handlePlay">
        <media-provider />
        <media-video-layout />
      </media-player>
    </ClientOnly>
  </div>
</template>


<script setup>
import { onMounted, ref } from 'vue'

const error = ref(null)
const playerRef = ref(null)

onMounted(async () => {
  try {
    await import('vidstack/bundle')
  } catch (err) {
    console.error('Failed to load vidstack:', err)
    error.value = 'Failed to load video player. Please try again later.'
  }
})

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' },
  autoFullscreenOnPlayMobile: { type: Boolean, default: false },
})

const handlePlay = async () => {
  if (!props.autoFullscreenOnPlayMobile) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!window.matchMedia('(max-width: 768px)').matches) return
  if (document.fullscreenElement) return

  const element = playerRef.value
  if (!element || typeof element.requestFullscreen !== 'function') return
  try {
    await element.requestFullscreen()
  } catch {
    // Ignore fullscreen errors (browser gesture/permission policies).
  }
}
</script>


<style scoped>
.vidstack-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: black;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}
</style>
