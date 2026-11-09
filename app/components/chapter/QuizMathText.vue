<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ text: string }>();

// Mathpix stores TeX without \(...\) delimiters. Leave ordinary prose alone.
const isDelimited = computed(() => /^\s*(?:\\\(|\\\[|\$\$?)/.test(props.text));
const hasTex = computed(() => isDelimited.value || /\\(?:[a-zA-Z]+|[;,! ])|\^\s*\{/.test(props.text));
const isEnvironment = computed(() => /\\begin\{/.test(props.text));
const chunks = computed(() => {
  // Mathpix uses spacing commands between clauses. Only split at those commands
  // outside braces so a command and its argument (for example \mathrm { ... })
  // always stay in the same MathJax expression.
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  const source = props.text;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\" && index + 1 < source.length) {
      const next = source[index + 1];
      if (depth === 0 && (next === ";" || next === ",")) {
        if (current.trim()) parts.push(current.trim());
        current = "";
        index += 1;
        continue;
      }
      current += char + next;
      index += 1;
    } else {
      if (char === "{") depth += 1;
      if (char === "}") depth = Math.max(0, depth - 1);
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
});
</script>

<template>
  <span v-if="!hasTex" class="quiz-math-text">{{ text }}</span>
  <span v-else :key="text" v-mathjax="text" class="quiz-math-text quiz-math-content">
    <template v-if="isDelimited">{{ text }}</template>
    <template v-else-if="isEnvironment">\[{{ text }}\]</template>
    <template v-else>
      <span v-for="(chunk, index) in chunks" :key="index" class="quiz-math-chunk">\({{ chunk }}\) </span>
    </template>
  </span>
</template>

<style scoped>
.quiz-math-text { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.quiz-math-content { display: inline; }
.quiz-math-chunk { display: inline-block; max-width: 100%; overflow-x: auto; overflow-y: hidden; vertical-align: baseline; }
.quiz-math-content :deep(mjx-container) { max-width: 100%; }
.quiz-math-content :deep(mjx-container[display="true"]) { overflow-x: auto; overflow-y: hidden; }
</style>
