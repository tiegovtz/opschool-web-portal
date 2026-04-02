<script setup lang="ts">
import { computed } from "vue";

type DistributionSegment = {
  label: string;
  value: number;
  colorClass: string;
  badgeClass?: string;
};

const props = defineProps<{
  title?: string;
  segments: DistributionSegment[];
  total?: number;
  itemLabel?: string;
}>();

const normalizedSegments = computed(() => {
  const resolvedTotal =
    props.total ??
    props.segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);

  return props.segments.map((segment) => ({
    ...segment,
    width:
      resolvedTotal > 0
        ? Math.max(0, (Math.max(segment.value, 0) / resolvedTotal) * 100)
        : 0,
  }));
});

const totalLabel = computed(() => props.itemLabel ?? "items");
</script>

<template>
  <div>
    <div
      v-if="title"
      class="flex items-center justify-between gap-3"
    >
      <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
        {{ title }}
      </p>
      <p class="text-xs text-slate-500">
        {{ total ?? segments.reduce((sum, segment) => sum + segment.value, 0) }} {{ totalLabel }}
      </p>
    </div>

    <div class="flex h-3 mt-3 overflow-hidden rounded-full bg-slate-100">
      <div
        v-for="segment in normalizedSegments"
        :key="segment.label"
        :class="segment.colorClass"
        :style="{ width: `${segment.width}%` }"
      ></div>
    </div>

    <div class="flex flex-wrap gap-2 mt-3">
      <span
        v-for="segment in normalizedSegments"
        :key="`${segment.label}-badge`"
        class="inline-flex items-center gap-2 px-2.5 py-1 text-xs rounded-full"
        :class="segment.badgeClass ?? 'bg-slate-100 text-slate-700'"
      >
        <span>{{ segment.label }}</span>
        <span class="font-semibold">{{ segment.value }}</span>
      </span>
    </div>
  </div>
</template>
