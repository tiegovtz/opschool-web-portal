<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <h1 class="text-lg sm:text-xl md:text-2xl text-center mb-4 text-picton-blue-700">
    {{ title }}
  </h1>
</template>