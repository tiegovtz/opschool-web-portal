<template>
  <div class="w-full flex justify-center">
    <div ref="micWrap" class="relative flex w-full max-w-[320px] flex-col items-center gap-3">
      <canvas ref="waveCanvas" class="mic-wave-canvas" aria-hidden="true"></canvas>
      <!-- Mic button -->
      <button
        @click="handleClick"
        :disabled="isMicDisabled"
        :class="[
          'w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform',
          isRecording
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
            : !isMicDisabled
            ? 'bg-oceanBlue hover:bg-deepBlue scale-100 hover:scale-105'
            : 'bg-gray-400 cursor-not-allowed scale-100',
          'focus:outline-none focus:ring-4 focus:ring-oceanBlue focus:ring-opacity-50'
        ]"
        :aria-label="isRecording ? 'Stop recording' : 'Start recording'"
      >
        <Icon
          :name="isRecording ? 'heroicons:stop' : 'heroicons:microphone'"
          class="w-8 h-8 text-white"
        />
      </button>

      <!-- Turn indicator -->
      <div
        v-if="currentTurn"
        class="px-4 py-2 bg-white rounded-full shadow-lg border-2 border-oceanBlue"
      >
        <span class="text-sm font-medium text-gray-800">
          {{ turnMessage }}
        </span>
      </div>

      <!-- Status text -->
      <div class="text-xs text-gray-600 text-center">
        <span v-if="isRecording">Recording... Speak now</span>
        <span v-else-if="!isSpeechSupported">Speech-to-text not supported in this browser</span>
        <span v-else-if="!canRecord">Waiting for turn...</span>
        <span v-else>Click to start speaking</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { SpeakerType } from '~/types/script.interface';

interface Props {
  isRecording: boolean;
  currentTurn?: SpeakerType;
  currentSpeakerName?: string;
  canRecord?: boolean;
  isSpeechSupported?: boolean;
  audioLevel?: number;
}

const props = withDefaults(defineProps<Props>(), {
  canRecord: true,
  isSpeechSupported: true,
  audioLevel: 0,
});

const emit = defineEmits<{
  toggle: [];
}>();

const handleClick = () => {
  if (props.canRecord && props.isSpeechSupported) {
    emit('toggle');
  }
};

const isMicDisabled = computed(() => !props.canRecord || !props.isSpeechSupported);

const turnMessage = computed(() => {
  const name = String(props.currentSpeakerName || '').trim();
  if (!props.currentTurn) return 'Ready to start';
  if (name) return `${name}'s turn`;
  return "Speaker's turn";
});

const waveCanvas = ref<HTMLCanvasElement | null>(null);
const micWrap = ref<HTMLDivElement | null>(null);
let waveRaf: number | null = null;
let wavePhase = 0;
let resizeObserver: ResizeObserver | null = null;

const drawWave = () => {
  const canvas = waveCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const midY = height * 0.55;
  const baseAmp = height * 0.08;
  const amp = baseAmp + props.audioLevel * height * 0.35;
  const freq = (Math.PI * 2) / width * 2.2;

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = midY + Math.sin(x * freq + wavePhase) * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = midY + Math.sin(x * freq * 1.3 + wavePhase * 1.6) * (amp * 0.65);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

const tickWave = () => {
  if (!props.isRecording) return;
  wavePhase += 0.08 + props.audioLevel * 0.2;
  drawWave();
  waveRaf = requestAnimationFrame(tickWave);
};

const stopWave = () => {
  if (waveRaf != null) {
    cancelAnimationFrame(waveRaf);
    waveRaf = null;
  }
  const canvas = waveCanvas.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

const syncCanvasSize = () => {
  const canvas = waveCanvas.value;
  const wrap = micWrap.value;
  if (!canvas || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  const width = Math.max(200, rect.width);
  const height = 60;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
};

onMounted(() => {
  syncCanvasSize();
  if (micWrap.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => syncCanvasSize());
    resizeObserver.observe(micWrap.value);
  }
});

onUnmounted(() => {
  stopWave();
  if (resizeObserver && micWrap.value) {
    resizeObserver.unobserve(micWrap.value);
  }
  resizeObserver = null;
});

watch(
  () => props.isRecording,
  (isRecording) => {
    if (isRecording) {
      syncCanvasSize();
      tickWave();
    } else {
      stopWave();
    }
  }
);
</script>

<style scoped>
.mic-wave {
  position: absolute;
  width: 180px;
  height: 70px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0) 70%),
    radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.5), rgba(56, 189, 248, 0) 65%);
  filter: blur(1px);
  opacity: 0;
  transition: opacity 120ms ease, transform 120ms ease;
  pointer-events: none;
  z-index: 0;
}

.mic-wave-canvas {
  position: absolute;
  bottom: 40px;
  width: 220px;
  height: 60px;
  opacity: 0.9;
  pointer-events: none;
}

.mic-wave + button,
button,
.status-text {
  position: relative;
  z-index: 1;
}

</style>
