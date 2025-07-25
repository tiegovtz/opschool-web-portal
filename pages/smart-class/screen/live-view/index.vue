<template>
  <div class="iframe-screen">
    <div class="header">
      <h1 class="title">Now Streaming</h1>
      <p class="subtitle">Enjoy your scheduled live class</p>
    </div>

    <div class="iframe-wrapper">
      <iframe
          v-if="iframeSrc"
          :src="iframeSrc"
          frameborder="0"
          allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
          allowfullscreen
      ></iframe>

      <div v-else class="no-class-msg">
        No class is currently scheduled. Please check back later.
      </div>
    </div>
  </div>
</template>
<script>
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";
export default {
  name: "LiveClasses",
  setup() {
    const iframeSrc = ref("https://tv.somakwanza.tz"); // Default fallback

    onMounted(() => {
      const stored = localStorage.getItem('classData');
      if (stored) {
        try {
          const classData = JSON.parse(stored);
          console.log('Received class data:', classData);
          if (classData?.meet_link) {
            iframeSrc.value = classData.meet_link;
            console.log('Received meeting link:', classData.meet_link);
          }
        } catch (e) {
          console.error("Failed to parse classData from localStorage:", e);
        }
      } else {
        console.warn("No classData found in localStorage.");
      }
    });


    return {
      iframeSrc
    };
  }
}
</script>
<style scoped>
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
  max-width: 960px;
  aspect-ratio: 16 / 9;
  background: black;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

iframe {
  width: 100%;
  height: 100%;
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
