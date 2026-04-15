<script setup lang="ts">
import { computed } from "vue";
import { cn } from "~/utilities/utils";

const props = defineProps<{
  notes?: string;
  image?: string;
  notesLabel?: string;
  imageAlt?: string;
}>();

const notesRegionId = "left-notes-with-images-notes";
const imageRegionId = "left-notes-with-images-image";

const notesWrapperClasses = computed(() =>
  cn("overflow-auto", { "max-h-[300px]": props.image })
);

const containerClasses = computed(() =>
  cn(
    "bg-white flex flex-col justify-between gap-6 w-full h-full rounded-xl p-4 md:p-6",
    { "md:h-[calc(100dvh-200px)]": !props.image }
  )
);

const accessibleNotesLabel = computed(() => props.notesLabel?.trim() || "Story notes");
const accessibleImageAlt = computed(() => props.imageAlt?.trim() || "Activity illustration");

</script>

<template>
  <div v-if="notes" :class="containerClasses">
    <div
      :id="notesRegionId"
      :class="notesWrapperClasses"
      role="region"
      :aria-label="accessibleNotesLabel"
      tabindex="0"
    >
      <p
        class="whitespace-pre-line text-lg tracking-wide text-picton-blue-700 h-full"
        v-html="notes"
      />
    </div>

    <figure
      v-if="image"
      :id="imageRegionId"
      class="rounded-xl p-1 md:h-[250px]"
      role="group"
      :aria-label="accessibleImageAlt"
      tabindex="0"
    >
      <img :src="image" :alt="accessibleImageAlt" class="object-contain mx-auto h-full" />
    </figure>
  </div>
</template>
