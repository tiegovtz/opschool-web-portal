<template>
  <div
    :class="[
      'px-4 py-3 rounded-2xl shadow-md max-w-[80%] transition-all duration-200',
      position === 'left' ? 'rounded-tl-sm bg-oceanBlue text-white' : 'rounded-tr-sm bg-white text-gray-800 border border-gray-200',
      type === 'ai' && 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
    ]"
  >
    <!-- Script text display -->
    <div
      v-if="scriptText"
      :class="[
        'text-sm mb-2 pb-2 border-b',
        position === 'left' ? 'border-white/30 text-white/90' : 'border-gray-300 text-gray-600'
      ]"
    >
      <span class="font-semibold">Script: </span>
      <span>{{ scriptText }}</span>
    </div>

    <!-- Spoken transcript with word highlighting -->
    <div
      v-if="transcript"
      class="text-base leading-relaxed"
    >
      <span
        v-for="(word, index) in words"
        :key="index"
        :class="[
          'transition-all duration-150',
          highlightedWord === word.toLowerCase().replace(/[.,!?]/g, '') ? 'bg-yellow-300 text-gray-900 font-semibold px-1 rounded' : ''
        ]"
      >
        {{ word }}{{ index < words.length - 1 ? ' ' : '' }}
      </span>
    </div>

    <!-- Show placeholder if no transcript yet -->
    <div
      v-else-if="scriptText"
      class="text-sm text-gray-400 italic"
    >
      Waiting for speech...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  scriptText?: string;
  transcript?: string;
  highlightedWord?: string;
  position: 'left' | 'right';
  type: 'student1' | 'student2' | 'ai';
}

const props = defineProps<Props>();

const words = computed(() => {
  if (!props.transcript) return [];
  return props.transcript.trim().split(/\s+/);
});
</script>

