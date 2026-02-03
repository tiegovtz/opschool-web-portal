<script setup lang="ts">
import { FaInbox } from 'react-icons/fa';


const props = defineProps({
  title: {
    type: String,
    default: "No items yet",
  },
  description: {
    type: String,
    default: "There are currently no items to display. Check back soon.",
  },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
    <span class="text-3xl text-primary border border-dashed border-primary rounded-lg p-4 mb-2">
    </span>
    <p class="text-lg font-semibold text-primary">{{ title }}</p>
    <p class="text-sm text-gray-600">{{ description }}</p>
  </div>
</template>
