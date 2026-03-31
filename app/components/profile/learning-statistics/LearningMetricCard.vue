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
    class="flex flex-col gap-3 p-4 bg-white border shadow-sm rounded-3xl border-slate-200 sm:flex-row sm:items-start"
    :class="cardClass"
  >
    <div
      class="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0 sm:w-12 sm:h-12"
      :class="iconWrapperClass"
    >
      <Icon
        :name="icon"
        class="w-5 h-5 sm:w-6 sm:h-6"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
        {{ label }}
      </p>
      <p
        class="mt-1.5 text-xl font-semibold tracking-tight sm:mt-2 sm:text-2xl"
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
