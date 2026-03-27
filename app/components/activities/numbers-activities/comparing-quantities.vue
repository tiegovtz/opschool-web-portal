<script setup lang="ts">
// @ts-nocheck
import ComparingQuantitiesActivity from "~/components/primary-sources/activities/numbers-activities/comparing-quantities.vue";
import type { FeedbackType } from "~/types/activity-types";

type Props = {
  questions: {
    title: string;
    questions: {
      answer: "First" | "Second";
      leftNumber: number;
      leftImage: string;
      rightNumber: number;
    }[];
  };
  feedback: FeedbackType;
};

const props = defineProps<Props>();
</script>

<template>
  <ComparingQuantitiesActivity v-bind="props" />
</template>
