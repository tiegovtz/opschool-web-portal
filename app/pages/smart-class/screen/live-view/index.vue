<template>
  <NuxtLayout  :name="$router.currentRoute.value.fullPath.includes('header-less') ?'normal':'home-layout'">
    <a class="skip-link" href="#main-content" @click.prevent="focusMain">Skip to main content</a>
  <div id="main-content" class="iframe-screen" role="main" tabindex="-1" aria-label="Live view main content">
    <div class="header">
      <h1 class="title">Now Streaming</h1>
      <p class="subtitle">Enjoy your scheduled live class</p>
    </div>
    <div class="iframe-wrapper" role="region" aria-label="Live stream video" tabindex="0">
      <ClientOnly>
        <template v-if="streamUrl">
<!--          <VidstackPlayer-->
<!--              v-if="streamUrl"-->
<!--              :src="streamUrl"-->
<!--              title="Live Class"-->
<!--          />-->
<!--          -->
          <VidstackPlayer
             id="main-container" tabindex="-1"
              v-if="streamUrl"
              ref="playerRef"
              :src="streamUrl"
              title="Live Class"
              aria-label="Live class video player"
          />
        </template>
        <template v-else>
          <div class="no-class-msg" role="status" aria-live="polite">
            No class is currently scheduled. Please check back later.
          </div>
        </template>
      </ClientOnly>
    </div>
    <div class="sr-only" aria-live="polite" aria-atomic="true">{{ streamStatus }}</div>
  </div>
  </NuxtLayout>
</template>



<script setup>
import { onMounted, ref, watch, nextTick } from 'vue'
import VidstackPlayer from '~/components/video-player/VidstackPlayer.vue'
import apiDocs from '~/utilities/apiDocs'

const token = useCookie('signInAccessToken').value
const headers = {
  accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const fallbackStream = 'https://tv.somakwanza.tz/hls/stream.m3u8'
const streamUrl = ref(fallbackStream)
const playerRef = ref(null)
const streamStatus = ref('')

const recordedHostUrl = apiDocs.baseURL.replace(/\/v1\/?$/, '')

const setStreamFromStored = () => {
  const stored = localStorage.getItem('classData')
  if (stored) {
    try {
      const classData = JSON.parse(stored)
      if (classData?.meet_link) {
        streamUrl.value = classData.meet_link
        return
      }
    } catch (e) {
      console.error('Failed to parse classData:', e)
    }
  }
  streamUrl.value = streamUrl.value || fallbackStream
}

const resolveActiveStreamingLink = (payload) => {
  if (!payload) return null
  const items = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? []
  const active = (Array.isArray(items) ? items : []).find(link => link?.is_active || link?.isActive)
  return active?.url ?? active?.streamUrl ?? active?.link ?? active?.streamingUrl
}

const loadStreamingLink = async () => {
  try {
    const response = await $fetch(`${apiDocs.liveClassrooms.streamingLinks}`, {
      headers,
    })
    const link = resolveActiveStreamingLink(response)
    if (link) {
      streamUrl.value = link
      return
    }
  } catch (error) {
    console.error('Failed to load streaming link:', error)
  }

  setStreamFromStored()
}

onMounted(() => {
  loadStreamingLink()
})

// Announce stream availability and focus the wrapper when streamUrl changes
watch(streamUrl, (newVal) => {
  streamStatus.value = newVal ? 'Live stream available' : 'No live stream'
  nextTick(() => {
    const wrapper = document.querySelector('.iframe-wrapper')
    if (wrapper && typeof wrapper.focus === 'function') wrapper.focus()
  })
})

const focusMain = () => {
  nextTick(() => {
    const el = document.getElementById('main-content')
    if (el) el.focus()
  })
}
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
  background-clip: text;
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

/* make wrapper focusable outline visible */
.iframe-wrapper:focus {
  outline: 3px solid #667eea;
  outline-offset: 4px;
}

/* Screen-reader only helper */
.sr-only { 
  position: absolute !important; 
  height: 1px; width: 1px; 
  overflow: hidden; 
  clip: rect(1px, 1px, 1px, 1px); 
  white-space: nowrap; 
  border: 0; 
  padding: 0; 
  margin: -1px; 
}

/* Skip link - hidden but visible on focus */
.skip-link {
  position: absolute;
  left: -999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  background: #fff;
  color: #111;
  z-index: 2000;
  border-radius: 4px;
  text-decoration: none;
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
