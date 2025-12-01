<template>
  <div
    class="p-6 space-y-5 h-[calc(100vh-280px)] max-h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white"
  >
    <div
      v-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <div
        class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4"
      >
        <Icon
          name="heroicons:chat-bubble-left"
          class="w-10 h-10 text-oceanBlue"
        />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-2">
        How can I help you today?
      </h2>
      <p class="text-gray-500 text-sm max-w-md">
        Ask me anything about your learning journey, assignments, or any
        questions you have.
      </p>
    </div>

    <div
      v-for="(m, index) in messages"
      :key="m.id ? m.id : index"
    >
      <AiTeacherMessageUser
        v-if="m.role === 'user'"
        :message="m"
      />
      <AiTeacherMessageAI
        v-else
        :message="m"
      />
    </div>

    <!-- Chat Loader -->
    <div
      v-if="isTyping"
      class="flex items-center space-x-2"
    >
      <div
        class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-0"
      ></div>
      <div
        class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"
      ></div>
      <div
        class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-400"
      ></div>
      <span class="text-gray-500 text-sm ml-2">AI is typing...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ messages: any[]; isTyping?: boolean }>();
</script>

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
