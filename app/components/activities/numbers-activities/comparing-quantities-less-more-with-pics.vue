<script setup lang="ts">
import ComparingQuantitiesLessMoreWithPicsActivity from "~/components/primary-sources/activities/numbers-activities/comparing-quantities-less-more-with-pics.vue";

defineProps<{
  questions: {
    title: string;
    questions: Array<{
      leftNumber: number;
      rightNumber: number;
      leftImage: string;
      answer: ">" | "<" | "=";
    }>;
  };
  feedback: any;
}>();
</script>

<template>
  <ComparingQuantitiesLessMoreWithPicsActivity :questions="questions" :feedback="feedback" v-bind="$attrs" />
</template>
