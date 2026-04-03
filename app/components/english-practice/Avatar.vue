<template>
  <div
    :class="[
      'practice-avatar flex items-center gap-3 transition-all duration-300',
      position === 'left' ? 'flex-row' : 'flex-row-reverse',
      isActive && 'scale-105'
    ]"
  >
    <div
      :class="[
        'relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
        isActive ? 'ring-4 ring-oceanBlue ring-opacity-50' : '',
        isSpeaking ? 'animate-pulse bg-oceanBlue' : 'bg-gray-200',
        type === 'ai' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : ''
      ]"
    >
      <Icon
        v-if="type === 'student'"
        name="heroicons:user"
        class="w-8 h-8 text-gray-700"
      />
      <Icon
        v-else-if="type === 'ai'"
        name="heroicons:sparkles"
        class="w-8 h-8 text-white"
      />
      
      <!-- Speaking indicator -->
      <div
        v-if="isSpeaking"
        class="absolute inset-0 rounded-full bg-oceanBlue opacity-20 animate-ping"
      ></div>
    </div>
    
    <div
      :class="[
        'practice-avatar__meta text-sm font-medium',
        position === 'left' ? 'text-left' : 'text-right'
      ]"
    >
      <div class="text-gray-800">{{ name }}</div>
      <div
        v-if="isActive"
        class="text-oceanBlue text-xs mt-1"
      >
        {{ isSwahili ? 'Zamu yako' : 'Your turn' }}
      </div>
      <div
        v-else-if="isWaiting"
        class="text-gray-500 text-xs mt-1"
      >
        {{ isSwahili ? 'Subiri...' : 'Waiting...' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  type: 'student' | 'ai';
  position: 'left' | 'right';
  isActive?: boolean;
  isSpeaking?: boolean;
  isWaiting?: boolean;
  uiLanguage?: 'en' | 'sw';
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isSpeaking: false,
  isWaiting: false,
  uiLanguage: 'en',
});

const isSwahili = computed(() => props.uiLanguage === 'sw');
</script>

<style scoped>
@media (max-width: 639px) and (orientation: portrait) {
  .practice-avatar {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .practice-avatar__meta {
    text-align: center;
  }
}
</style>
