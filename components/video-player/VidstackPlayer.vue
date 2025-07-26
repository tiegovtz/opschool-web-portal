<template>
  <div class="vidstack-wrapper">
    <ClientOnly>
      <media-player :title="title" .src="src">
        <media-provider />
        <media-video-layout />
      </media-player>
    </ClientOnly>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  await import('vidstack/bundle');

})

defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' }
});

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
