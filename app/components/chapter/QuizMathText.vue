<script setup lang="ts">
import { computed } from "vue";
import { normalizeQuizMath } from "~/utilities/parsers/normalizeQuizMath";

const props = defineProps<{ text: string }>();
const normalizedText = computed(() => normalizeQuizMath(props.text));

// Mathpix stores TeX without \(...\) delimiters. Leave ordinary prose alone.
const isDelimited = computed(() => /^\s*(?:\\\(|\\\[|\$\$?)/.test(props.text));
const hasTex = computed(() => isDelimited.value || /\\(?:[a-zA-Z]+|[;,! ])|\^\s*\{/.test(props.text));
const isEnvironment = computed(() => /\\begin\{/.test(props.text));
const chunks = computed(() => {
  // MathJax treats an entire inline expression as one unbreakable box. Split at
  // top-level spacing and operators, while keeping braced commands intact.
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  const source = normalizedText.value;
  const flush = () => {
    if (current.trim()) parts.push(current.trim());
    current = "";
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\" && index + 1 < source.length) {
      const next = source[index + 1] || '';
      if (depth === 0) {
        const prose = source.slice(index).match(/^\\text\{([^{}]+)\}/);
        if (prose) {
          flush();
          for (const word of prose[1]?.split(/\s+/).filter(Boolean) ?? []) {
            parts.push(`\\text{${word}}`);
          }
          index += prose[0].length - 1;
          continue;
        }
      }
      if (depth === 0 && next && /[;,!: ]/.test(next)) {
        flush();
        index += 1;
        continue;
      }
      const command = source.slice(index).match(/^\\[a-zA-Z]+/);
      if (depth === 0 && command && /^(\\star|\\diamond|\\bigtriangleup|\\triangle|\\times|\\cdot)$/.test(command[0])) {
        flush();
        parts.push(command[0]);
        index += command[0].length - 1;
        continue;
      }
      current += char + next;
      index += 1;
    } else {
      if (depth === 0 && (char === "~" || char === "=" || char === "+" || char === "−")) {
        flush();
        if (char !== "~") parts.push(char);
        continue;
      }
      if (char === "{") depth += 1;
      if (char === "}") depth = Math.max(0, depth - 1);
      current += char;
    }
  }
  flush();
  return parts;import { feedbackSupportPaths } from '../../../app/utilities/apiDocs';
});
</script>

<template>
  <span v-if="!hasTex" class="quiz-math-text">{{ text }}</span>
  <span v-else :key="text" v-mathjax="normalizedText" class="quiz-math-text quiz-math-content">
    <template v-if="isDelimited">{{ normalizedText }}</template>
    <template v-else-if="isEnvironment">\[{{ normalizedText }}\]</template>
    <template v-else>
      <span v-for="(chunk, index) in chunks" :key="index" class="quiz-math-chunk">\({{ chunk }}\) </span>
    </template>
  </span>
</template>

<style scoped>
.quiz-math-text { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.quiz-math-content { display: inline; }
.quiz-math-chunk { display: inline; }
.quiz-math-content :deep(mjx-container[display="true"]) { max-width: 100%; overflow-x: auto; overflow-y: hidden; }
</style>
