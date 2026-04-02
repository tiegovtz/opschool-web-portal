<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: number | null;
    helper?: string;
    accent?: "ocean" | "emerald" | "amber" | "slate";
    emptyStateLabel?: string;
    activeStateLabel?: string;
  }>(),
  {
    helper: "",
    accent: "ocean",
    emptyStateLabel: "Awaiting tracked data",
    activeStateLabel: "Current learning signal",
  },
);

const radius = 42;
const circumference = 2 * Math.PI * radius;

const normalizedValue = computed(() => {
  if (typeof props.value !== "number" || Number.isNaN(props.value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(props.value)));
});

const strokeOffset = computed(() => {
  const value = normalizedValue.value ?? 0;
  return circumference - (value / 100) * circumference;
});

const valueLabel = computed(() =>
  normalizedValue.value === null ? "—" : `${normalizedValue.value}%`,
);

const palette = computed(() => {
  if (props.accent === "emerald") {
    return {
      ring: "stroke-emerald-500",
      track: "stroke-emerald-100",
      halo: "bg-emerald-50",
      text: "text-emerald-700",
    };
  }

  if (props.accent === "amber") {
    return {
      ring: "stroke-amber-500",
      track: "stroke-amber-100",
      halo: "bg-amber-50",
      text: "text-amber-700",
    };
  }

  if (props.accent === "slate") {
    return {
      ring: "stroke-slate-500",
      track: "stroke-slate-200",
      halo: "bg-slate-100",
      text: "text-slate-700",
    };
  }

  return {
    ring: "stroke-oceanBlue",
    track: "stroke-sky-100",
    halo: "bg-sky-50",
    text: "text-oceanBlue",
  };
});
</script>

<template>
  <article class="p-4 bg-white/80 border rounded-3xl border-white/60 shadow-sm sm:p-5">
    <div class="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
      <div
        class="relative flex items-center justify-center w-24 h-24 rounded-full sm:w-28 sm:h-28"
        :class="palette.halo"
      >
        <svg
          class="w-20 h-20 -rotate-90 sm:w-24 sm:h-24"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            :r="radius"
            fill="none"
            stroke-width="10"
            class="transition-colors duration-300"
            :class="palette.track"
          />
          <circle
            cx="50"
            cy="50"
            :r="radius"
            fill="none"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeOffset"
            class="transition-all duration-700 ease-out"
            :class="palette.ring"
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ valueLabel }}
          </span>
        </div>
      </div>

      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
          {{ label }}
        </p>
        <p
          class="mt-2 text-sm font-medium"
          :class="palette.text"
        >
          {{
            normalizedValue === null
              ? emptyStateLabel
              : activeStateLabel
          }}
        </p>
        <p
          v-if="helper"
          class="mt-2 text-sm leading-6 text-slate-600"
        >
          {{ helper }}
        </p>
      </div>
    </div>
  </article>
</template>
