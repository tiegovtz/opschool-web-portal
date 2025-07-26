<template>
  <div class="iframe-screen">
    <div class="header">
      <h1 class="title">Now Streaming</h1>
      <p class="subtitle">Enjoy your scheduled live class</p>
    </div>
    <div class="iframe-wrapper">
      <ClientOnly>
        <template v-if="streamUrl">
<!--          <VidstackPlayer-->
<!--              v-if="streamUrl"-->
<!--              :src="streamUrl"-->
<!--              title="Live Class"-->
<!--          />-->
<!--          -->
          <VidstackPlayer
              v-if="streamUrl"
              :src="streamUrl"
              title="Live Class"
          />
        </template>
        <template v-else>
          <div class="no-class-msg">
            No class is currently scheduled. Please check back later.
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref } from 'vue'
import VidstackPlayer from '~/components/video-player/VidstackPlayer.vue'

const streamUrl = ref('')  // will be set dynamically

onMounted(() => {
  streamUrl.value = 'https://tv.somakwanza.tz/hls/stream.m3u8'
  const stored = localStorage.getItem('classData')
  if (stored) {
    try {
      const classData = JSON.parse(stored)
      if (classData?.meet_link) {
        streamUrl.value = classData.meet_link
      }
    } catch (e) {
      console.error('Failed to parse classData:', e)
    }
  } else {
    console.log("SOMAKWANZA TV");
    streamUrl.value = 'https://tv.somakwanza.tz'
  }
  console.log("somakwanza : " + streamUrl.value);
})
</script>

<style scoped>
/* keep your existing styles */
.iframe-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
  color: white;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #ffd93d, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.7);
}

.iframe-wrapper {
  width: 100%;
  max-width: 1200px; /* Optional: Limit the max width */
  aspect-ratio: 16 / 9;
  margin: 0 auto; /* ✅ This centers it horizontally */
  background: black;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}



.no-class-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255,255,255,0.6);
  font-size: 1.2rem;
}
</style>
