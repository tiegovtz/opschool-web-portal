<template>
  <div class="vidstack-wrapper">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <ClientOnly v-else>
      <media-player :title="title" :src="src">
        <media-provider />
        <media-video-layout />
      </media-player>
    </ClientOnly>
  </div>
</template>


<script setup>
import { onMounted, ref } from 'vue'

const error = ref(null)

onMounted(async () => {
  try {
    await import('vidstack/bundle')
  } catch (err) {
    console.error('Failed to load vidstack:', err)
    error.value = 'Failed to load video player. Please try again later.'
  }
})

defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' }
})
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
