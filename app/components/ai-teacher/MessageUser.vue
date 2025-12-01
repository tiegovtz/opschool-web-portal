<template>
  <div class="flex justify-end animate-fade-in">
    <div
      class="max-w-[80%] bg-oceanBlue text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-lg"
    >
      <div
        v-for="(part, idx) in message.parts"
        :key="idx"
      >
        <div
          v-if="part.type === 'text'"
          class="text-sm leading-relaxed"
        >
          {{ part.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: any }>();
</script>
