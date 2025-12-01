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
    <AiTeacherHeader />
    <AiTeacherMessages
      :messages="chat.messages"
      :isTyping="isTyping"
    />
    <AiTeacherInput
      :chat="chat"
      @sendMessage="handleSubmit"
    />
  </NuxtLayout>
</template>
