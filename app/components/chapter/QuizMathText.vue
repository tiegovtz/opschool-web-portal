<script setup lang="ts">
import { computed } from "vue";
import { normalizeQuizMath } from "~/utilities/parsers/normalizeQuizMath";
import { splitQuizMath } from "~/utilities/parsers/splitQuizMath";

const props = defineProps<{ text: string }>();
const normalizedText = computed(() => normalizeQuizMath(props.text));

// Mathpix stores TeX without \(...\) delimiters. Leave ordinary prose alone.
const isDelimited = computed(() => /^\s*(?:\\\(|\\\[|\$\$?)/.test(props.text));
const hasMathSpacing = computed(() => /~/.test(props.text) && /[=+\-−*/^]/.test(props.text));
const hasTex = computed(() => isDelimited.value || hasMathSpacing.value || /\\(?:[a-zA-Z]+|[;,! ])|\^\s*\{/.test(props.text));
const isEnvironment = computed(() => /\\begin\{/.test(props.text));
const inlineBody = computed(() => {
  if (isEnvironment.value) return null;
  const source = normalizedText.value.trim();
  const wrapped = source.match(/^\\\(([\s\S]*)\\\)$/) || source.match(/^\$([^$]*)\$$/);
  return wrapped?.[1] ?? (isDelimited.value ? null : source);
});
const chunks = computed(() => inlineBody.value === null ? [] : splitQuizMath(inlineBody.value));
</script>

<template>
  <span v-if="!hasTex" class="quiz-math-text">{{ text }}</span>
  <span v-else :key="text" v-mathjax="normalizedText" class="quiz-math-text quiz-math-content">
    <template v-if="inlineBody !== null">
      <span v-for="(chunk, index) in chunks" :key="index" class="quiz-math-chunk">\({{ chunk }}\) </span>
    </template>
    <template v-else-if="isEnvironment">\[{{ normalizedText }}\]</template>
    <template v-else>{{ normalizedText }}</template>
  </span>
</template>

<style scoped>
.quiz-math-text { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.quiz-math-content { display: inline; }
.quiz-math-chunk { display: inline-block; max-width: 100%; vertical-align: baseline; }
.quiz-math-content :deep(mjx-container[display="true"]) {
  max-width: 100%;
  margin: 0.25em 0 !important;
  text-align: left !important;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
