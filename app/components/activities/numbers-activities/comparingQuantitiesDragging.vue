<script setup lang="ts">
// @ts-nocheck
import ComparingQuantitiesDraggingActivity from "~/components/primary-sources/activities/numbers-activities/comparing-quantities-dragging.vue";
import type { FeedbackType } from "~/types/activity-types";

type Props = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      leftAnswer: string;
      leftImage: string;
      rightNumber: number;
      rightAnswer: string;
      rightImage: string;
    }[];
  };
  feedback: FeedbackType;
};

defineProps<Props>();
</script>

<template>
  <ComparingQuantitiesDraggingActivity
    :questions="questions"
    :feedback-type="feedback"
    v-bind="$attrs"
  />
</template>
