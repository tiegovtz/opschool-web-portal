<template>
  <div
    ref="containerRef"
    class="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-white"
  >
    <!-- Script display area -->
    <div
      v-if="currentScriptLine"
      class="mb-6 p-4 bg-blue-50 border-l-4 border-oceanBlue rounded-r-lg"
    >
      <div class="text-xs text-gray-600 mb-1">Current Script Line</div>
      <div class="text-base font-medium text-gray-800">
        {{ currentScriptLine.text }}
      </div>
      <div class="text-xs text-gray-500 mt-2">
        Speaker: {{ currentScriptLine.speaker }} | Line {{ currentLineIndex + 1 }} of {{ totalLines }}
      </div>
    </div>

    <!-- Messages -->
    <div
      v-for="(message, index) in messages"
      :key="message.id || index"
      :class="[
        'flex items-start gap-3',
        message.speaker === 'student1' ? 'justify-start' : 'justify-end'
      ]"
    >
      <!-- Avatar -->
      <EnglishPracticeAvatar
        :name="getAvatarName(message.speaker)"
        :type="message.speaker === 'ai' ? 'ai' : 'student'"
        :position="message.speaker === 'student1' ? 'left' : 'right'"
        :is-active="message.speaker === currentTurn"
        :is-speaking="message.speaker === currentTurn && isRecording"
        :is-waiting="message.speaker !== currentTurn && !isRecording"
      />

      <!-- Message bubble -->
      <EnglishPracticeMessageBubble
        :script-text="message.scriptText"
        :transcript="message.transcript"
        :highlighted-word="message.speaker === currentTurn ? highlightedWord : undefined"
        :position="message.speaker === 'student1' ? 'left' : 'right'"
        :type="message.speaker"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
        <Icon
          name="heroicons:chat-bubble-left-right"
          class="w-10 h-10 text-oceanBlue"
        />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-2">
        Ready to Practice
      </h2>
      <p class="text-gray-500 text-sm max-w-md">
        Click the microphone to start speaking. Words will light up as you speak!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import type { SpeakerType } from '~/types/script.interface';
import type { ScriptLine } from '~/types/script.interface';

interface Message {
  id: string;
  speaker: SpeakerType;
  scriptText?: string;
  transcript?: string;
}

interface Props {
  messages: Message[];
  currentScriptLine?: ScriptLine;
  currentLineIndex: number;
  totalLines: number;
  currentTurn?: SpeakerType;
  isRecording: boolean;
  highlightedWord?: string;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLElement | null>(null);

const getAvatarName = (speaker: SpeakerType): string => {
  const normalized = String(speaker || '').trim();
  if (!normalized) return 'Speaker';
  if (normalized === 'ai') return 'Speaker';
  return normalized;
};

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight;
  }
};

onMounted(() => {
  scrollToBottom();
});
</script>
