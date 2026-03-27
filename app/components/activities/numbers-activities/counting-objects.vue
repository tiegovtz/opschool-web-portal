<script setup lang="ts">
import CountingObjectsActivity from "~/components/primary-sources/activities/numbers-activities/counting-objects.vue";
import type { FeedbackType } from "~/types/activity-types";

type Props = {
  feedback: FeedbackType;
  questions: {
    title: string;
    questions: { id: number; number: number }[];
  };
};

const props = defineProps<Props>();
</script>

<template>
  <CountingObjectsActivity v-bind="props" />
</template>
