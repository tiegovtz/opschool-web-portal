<template>
  <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
    <div class="flex flex-col items-center gap-3">
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
import { computed } from 'vue';
import type { SpeakerType } from '~/types/script.interface';

interface Props {
  isRecording: boolean;
  currentTurn?: SpeakerType;
  currentSpeakerName?: string;
  canRecord?: boolean;
  isSpeechSupported?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canRecord: true,
  isSpeechSupported: true,
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
</script>
