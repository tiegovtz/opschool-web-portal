<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref } from "vue";

const input = ref("");
const chat = new Chat({});

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  chat.sendMessage({ text: input.value });
  input.value = "";
};
</script>

<template>
  <NuxtLayout name="home-layout">
    <AiTeacherHeader/>
    <AiTeacherMessages :messages="chat.messages"/>
    <AiTeacherInput :chat="chat" @sendMessage="chat.sendMessage({ text: $event })"/>
  </NuxtLayout>
</template>
