<script setup lang="ts">
import { computed } from "vue";
import { cn } from "~/utilities/utils";

const props = defineProps<{
  notes?: string;
  image?: string;
}>();


const notesWrapperClasses = computed(() =>
  cn("overflow-auto", { "max-h-[300px]": props.image })
);

const containerClasses = computed(() =>
  cn(
    "bg-white flex flex-col justify-between gap-6 w-full h-full rounded-xl p-4 md:p-6",
    { "md:h-[calc(100dvh-200px)]": !props.image }
  )
);

</script>

<template>
  <div v-if="notes" :class="containerClasses">
    <div :class="notesWrapperClasses">
      <p
        class="whitespace-pre-line text-lg tracking-wide text-picton-blue-700 h-full"
        v-html="notes"
      />
    </div>

    <div v-if="image" class="rounded-xl p-1 md:h-[250px]">
      <img src="image" alt="Matching Items" class="object-contain mx-auto h-full" />
    </div>
  </div>
</template>