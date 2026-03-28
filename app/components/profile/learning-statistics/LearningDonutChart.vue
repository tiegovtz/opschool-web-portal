<script setup lang="ts">
import { computed } from "vue";

type DonutSegment = {
  label: string;
  value: number;
  strokeClass: string;
};

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[];
    total?: number;
    centerPrimary: string;
    centerSecondary?: string;
    size?: number;
    thickness?: number;
  }>(),
  {
    total: undefined,
    centerSecondary: "",
    size: 176,
    thickness: 16,
  },
);

const radius = computed(() => 50 - props.thickness / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

const resolvedTotal = computed(() => {
  const fallbackTotal = props.segments.reduce(
    (sum, segment) => sum + Math.max(segment.value, 0),
    0,
  );

  return Math.max(props.total ?? fallbackTotal, 0);
});

const arcSegments = computed(() => {
  const total = resolvedTotal.value;
  let cumulative = 0;

  return props.segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const fraction = total > 0 ? segment.value / total : 0;
      const dash = fraction * circumference.value;
      const offset = circumference.value * (1 - cumulative / Math.max(total, 1));

      cumulative += segment.value;

      return {
        ...segment,
        dashArray: `${dash} ${Math.max(circumference.value - dash, 0)}`,
        dashOffset: offset,
      };
    });
});
</script>

<template>
  <div class="relative flex items-center justify-center">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      class="-rotate-90 overflow-visible drop-shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="thickness"
        class="stroke-slate-100"
      />

      <circle
        v-for="segment in arcSegments"
        :key="segment.label"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        stroke-linecap="round"
        :stroke-width="thickness"
        :stroke-dasharray="segment.dashArray"
        :stroke-dashoffset="segment.dashOffset"
        :class="segment.strokeClass"
      />
    </svg>

    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
      <span class="text-3xl font-semibold tracking-tight text-slate-900">
        {{ centerPrimary }}
      </span>
      <span
        v-if="centerSecondary"
        class="mt-1 text-xs font-semibold tracking-[0.24em] uppercase text-slate-500"
      >
        {{ centerSecondary }}
      </span>
    </div>
  </div>
</template>
