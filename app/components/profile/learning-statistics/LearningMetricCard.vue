<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    helper?: string;
    icon: string;
    iconWrapperClass?: string;
    valueClass?: string;
    cardClass?: string;
  }>(),
  {
    helper: "",
    iconWrapperClass: "bg-slate-100 text-slate-700",
    valueClass: "text-slate-900",
    cardClass: "",
  },
);
</script>

<template>
  <article
    class="flex gap-4 p-4 bg-white border shadow-sm rounded-3xl border-slate-200"
    :class="cardClass"
  >
    <div
      class="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
      :class="iconWrapperClass"
    >
      <Icon
        :name="icon"
        class="w-6 h-6"
      />
    </div>

    <div class="min-w-0">
      <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
        {{ label }}
      </p>
      <p
        class="mt-2 text-2xl font-semibold tracking-tight"
        :class="valueClass"
      >
        {{ value }}
      </p>
      <p
        v-if="helper"
        class="mt-1 text-xs leading-5 text-slate-500"
      >
        {{ helper }}
      </p>
    </div>
  </article>
</template>
