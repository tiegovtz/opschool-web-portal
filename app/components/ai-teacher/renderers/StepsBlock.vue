<template>
  <div class="my-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm">
    <p class="mb-2 text-sm font-semibold text-gray-700">
      {{ title || 'Step-by-step' }}
    </p>
    <ol class="space-y-2 list-decimal list-inside">
      <li v-for="(step, i) in steps" :key="i" class="text-sm text-gray-800">
        <span v-if="step.description" class="font-medium">{{ step.description }}:</span>
        <span
          v-if="step.latex"
          ref="mathRefs"
          class="ml-1 inline-block align-middle"
          v-html="renderLatex(step.latex)"
        />
        <span v-else class="ml-1">{{ step.expression }}</span>
      </li>
    </ol>
    <p v-if="finalLatex" class="mt-3 rounded bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-200">
      Result:
      <span ref="finalRef" class="ml-1" v-html="renderLatex(finalLatex)" />
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";

interface Step { description?: string; expression?: string; latex?: string }
const props = defineProps<{
  steps: Step[];
  title?: string;
  finalLatex?: string;
}>();

const mathRefs = ref<HTMLElement[]>([]);
const finalRef = ref<HTMLElement | null>(null);

const renderLatex = (latex: string) => {
  // Wrap for MathJax to pick up inline math
  return `\\(${latex}\\)`;
};

const runMath = async () => {
  await nextTick();
  if (typeof window === "undefined") return;
  const w = window as any;
  if (!w.MathJaxRender || !w.mathJaxLoaded) return;
  try {
    await w.mathJaxLoaded;
    const nodes: HTMLElement[] = [];
    if (Array.isArray(mathRefs.value)) nodes.push(...mathRefs.value);
    if (finalRef.value) nodes.push(finalRef.value);
    if (nodes.length) await w.MathJaxRender(nodes);
  } catch { /* silent */ }
};

onMounted(() => { runMath(); });
watch(() => [props.steps, props.finalLatex], () => { runMath(); }, { deep: true });
</script>
