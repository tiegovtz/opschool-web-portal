<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref } from "vue";

const input = ref("");
const chat = new Chat({});

// Local state to show typing loader
const isTyping = ref(false);

const handleSubmit = (message: string) => {
  if (!message.trim()) return;

  isTyping.value = true; // Show loader immediately
  chat.sendMessage({ text: message }).finally(() => {
    isTyping.value = false; // Hide loader when done
  });
  input.value = "";
};
</script>

<template>
  <NuxtLayout name="home-layout">
    <!-- Page Header -->
    <AiTeacherHeader />

    <!-- Chat Messages Area -->
    <main role="main" aria-label="AI Teacher conversation">
      <AiTeacherMessages :messages="chat.messages" :isTyping="isTyping" role="log" aria-live="polite"
        aria-relevant="additions text" />
    </main>

    <!-- Message Input -->
    <footer role="contentinfo">
      <AiTeacherInput :chat="chat" @sendMessage="handleSubmit" aria-label="Type a message to the AI teacher" />
    </footer>
  </NuxtLayout>
</template>

