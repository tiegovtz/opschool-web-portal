<template>
  <div class="my-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <p v-if="spec.title" class="mb-2 text-center text-sm font-medium text-gray-700">{{ spec.title }}</p>
    <canvas ref="canvasEl" class="!max-w-full" />
    <p v-if="error" class="mt-2 text-xs text-red-600">Could not render chart: {{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

interface Dataset { label?: string; data: Array<number | { x: number; y: number }> }
interface Spec {
  chartType: "bar" | "line" | "pie" | "scatter";
  labels?: string[];
  datasets: Dataset[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

const props = defineProps<{ spec: Spec }>();
const canvasEl = ref<HTMLCanvasElement | null>(null);
const error = ref<string>("");
let chart: any = null;
let lastSpecKey = "";

const palette = ["#1d4ed8", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2"];

const render = async () => {
  if (!canvasEl.value) return;
  const specKey = JSON.stringify(props.spec);
  if (specKey === lastSpecKey) return;
  lastSpecKey = specKey;
  error.value = "";
  try {
    const mod = await import("chart.js/auto");
    const Chart = (mod as any).default || mod;
    chart?.destroy();
    const datasets = props.spec.datasets.map((d, i) => ({
      label: d.label ?? "",
      data: d.data as any,
      backgroundColor: props.spec.chartType === "pie"
        ? palette
        : palette[i % palette.length] + (props.spec.chartType === "bar" ? "cc" : "33"),
      borderColor: palette[i % palette.length],
      borderWidth: 2,
      fill: props.spec.chartType === "line" ? false : true,
    }));
    const scales = props.spec.chartType === "pie" ? undefined : {
      x: { title: props.spec.xLabel ? { display: true, text: props.spec.xLabel } : undefined },
      y: { title: props.spec.yLabel ? { display: true, text: props.spec.yLabel } : undefined, beginAtZero: true },
    };
    chart = new Chart(canvasEl.value, {
      type: props.spec.chartType,
      data: { labels: props.spec.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.8,
        plugins: { legend: { position: "top" } },
        scales,
      },
    });
  } catch (e: any) {
    error.value = e?.message || String(e);
  }
};

onMounted(async () => { await nextTick(); render(); });
onBeforeUnmount(() => { chart?.destroy(); });
watch(() => props.spec, () => { render(); }, { deep: true });
</script>
