<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';

const props = defineProps<{ messages: any[]; isTyping?: boolean }>();

const messagesContainer = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);

// Smooth scroll function
const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value || !shouldAutoScroll.value) return;

  nextTick(() => {
    if (messagesContainer.value) {
      if (smooth) {
        messagesContainer.value.scrollTo({
          top: messagesContainer.value.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    }
  });
};

// Check if user is near bottom (within 100px)
const isNearBottom = () => {
  if (!messagesContainer.value) return true;
  const threshold = 100;
  const distanceFromBottom = messagesContainer.value.scrollHeight -
    messagesContainer.value.scrollTop -
    messagesContainer.value.clientHeight;
  return distanceFromBottom < threshold;
};

// Handle scroll event to determine if user has manually scrolled up
const handleScroll = () => {
  shouldAutoScroll.value = isNearBottom();
};

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages, () => {
  scrollToBottom(true);
}, { deep: true });

// Auto-scroll when typing state changes
watch(() => props.isTyping, (newVal) => {
  if (newVal) {
    scrollToBottom(true);
  } else {
    // Also scroll when typing finishes
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  }
});

// Scroll to bottom on mount if there are messages
onMounted(() => {
  if (props.messages.length > 0) {
    nextTick(() => {
      scrollToBottom(false);
    });
  }
});
</script>

<template>
  <section ref="messagesContainer" @scroll="handleScroll"
    class="p-6 space-y-5 h-[calc(100vh-280px)] max-h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white"
    role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat messages" tabindex="0">
    <!-- Empty state -->
    <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full px-4 text-center"
      role="status" aria-live="polite">
      <div
        class="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100"
        aria-hidden="true">
        <Icon name="heroicons:chat-bubble-left" class="w-10 h-10 text-oceanBlue" aria-hidden="true" />
      </div>

      <h2 class="mb-2 text-xl font-semibold text-gray-800">
        How can I help you today?
      </h2>

      <p class="max-w-md text-sm text-gray-500">
        Ask me anything about your learning journey, assignments, or any
        questions you have.
      </p>
    </div>

    <!-- Messages -->
    <ul v-else role="list" class="space-y-5">
      <li v-for="(m, index) in messages" :key="m.id ? m.id : index" role="listitem">
        <AiTeacherMessageUser v-if="m.role === 'user'" :message="m" />
        <AiTeacherMessageAI v-else :message="m" />
      </li>
    </ul>

    <!-- Typing indicator -->
    <div v-if="isTyping" class="flex items-center space-x-2" role="status" aria-live="polite" aria-label="AI is typing">
      <div class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-0" aria-hidden="true"></div>
      <div class="w-3 h-3 delay-200 bg-gray-400 rounded-full animate-bounce" aria-hidden="true"></div>
      <div class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-400" aria-hidden="true"></div>

      <span class="ml-2 text-sm text-gray-500">
        AI is typing…
      </span>
    </div>
  </section>
</template>

<style>
/* simple bounce animation for loader */
@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}

.delay-0 {
  animation-delay: 0s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-400 {
  animation-delay: 0.4s;
}
</style>
