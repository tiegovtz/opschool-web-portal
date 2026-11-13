<script setup lang="ts">
import { computed } from "vue";
import { splitMathJaxText } from "~/utilities/parsers/mathJaxText";

const props = defineProps<{ text: string }>();
const segments = computed(() => splitMathJaxText(props.text));
</script>

<template>
  <template v-for="(segment, index) in segments" :key="`${text}-${index}`">
    <span v-if="segment.kind === 'text'" class="min-w-0 max-w-full [overflow-wrap:anywhere]">{{ segment.value }}</span>
    <span
      v-else
      v-mathjax="segment.value"
      class="inline-block min-w-0 max-w-full align-baseline [overflow-wrap:anywhere] [&_mjx-container]:!max-w-full [&_mjx-container]:!text-left [&_mjx-container[display=true]]:!my-1 [&_mjx-container[display=true]]:overflow-x-auto [&_mjx-container[display=true]]:overflow-y-hidden"
    >{{ segment.value }}</span>
  </template>
</template>
