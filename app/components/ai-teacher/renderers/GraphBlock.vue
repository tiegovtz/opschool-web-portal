<template>
  <div class="my-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <p v-if="spec.title" class="mb-2 text-center text-sm font-medium text-gray-700">{{ spec.title }}</p>
    <div ref="plotEl" class="w-full overflow-x-auto" />
    <p v-if="error" class="mt-2 text-xs text-red-600">Could not render plot: {{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

interface Annotation { x: number; y: number; label?: string }
interface Spec {
  expressions: string[];
  xRange: [number, number];
  yRange?: [number, number];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  annotations?: Annotation[];
}

const props = defineProps<{ spec: Spec }>();
const plotEl = ref<HTMLElement | null>(null);
const error = ref<string>("");
let resizeObs: ResizeObserver | null = null;
let lastSpecKey = "";
let lastWidth = 0;
let resizeTimer: number | null = null;

const palette = ["#1d4ed8", "#dc2626", "#059669", "#d97706"];

const render = async () => {
  if (!plotEl.value) return;
  const width = Math.min(plotEl.value.clientWidth || 600, 680);
  const specKey = JSON.stringify(props.spec);
  // Skip if nothing meaningful changed — avoids re-render storms during streaming.
  if (specKey === lastSpecKey && Math.abs(width - lastWidth) < 8) return;
  lastSpecKey = specKey;
  lastWidth = width;
  error.value = "";
  try {
    const mod = await import("function-plot");
    const functionPlot = (mod as any).default || mod;
    const height = Math.round(width * 0.55);
    plotEl.value.innerHTML = "";

    const data: any[] = props.spec.expressions.map((raw, i) => ({
      fn: raw.replace(/^\s*(?:y|[a-z]\s*\(\s*x\s*\))\s*=\s*/i, "").trim(),
      color: palette[i % palette.length],
      graphType: "polyline",
    }));

    if (props.spec.annotations?.length) {
      data.push({
        points: props.spec.annotations.map(a => [a.x, a.y]),
        fnType: "points",
        graphType: "scatter",
        color: "#111827",
      });
    }

    functionPlot({
      target: plotEl.value,
      width,
      height,
      xAxis: { domain: props.spec.xRange, label: props.spec.xLabel },
      yAxis: props.spec.yRange ? { domain: props.spec.yRange, label: props.spec.yLabel } : { label: props.spec.yLabel },
      grid: true,
      data,
    });

    // Draw annotation labels
    if (props.spec.annotations?.length) {
      const svg = plotEl.value.querySelector("svg");
      if (svg) {
        for (const a of props.spec.annotations) {
          if (!a.label) continue;
          const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
          title.textContent = a.label;
          svg.appendChild(title);
        }
      }
    }
  } catch (e: any) {
    error.value = e?.message || String(e);
  }
};

onMounted(async () => {
  await nextTick();
  await render();
  if (typeof ResizeObserver !== "undefined" && plotEl.value) {
    resizeObs = new ResizeObserver(() => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { render(); }, 150);
    });
    resizeObs.observe(plotEl.value);
  }
});

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  if (resizeTimer !== null) window.clearTimeout(resizeTimer);
});
watch(() => props.spec, () => { render(); }, { deep: true });
</script>
