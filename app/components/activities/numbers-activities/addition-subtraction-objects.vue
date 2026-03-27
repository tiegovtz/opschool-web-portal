<script setup lang="ts">
// @ts-nocheck
import AdditionSubtractionObjectsActivity from "~/components/primary-sources/activities/numbers-activities/addition-subtraction-objects.vue";

const props = defineProps<{
  questions: { title: string; questions: { leftNumber: number; rightNumber: number; leftImage: string; rightImage?: string; operator: string; displayAnswer: string; answer: number; isMultiplicationOrDivision?: boolean }[] };
  feedback: any;
}>();
</script>

<template>
  <AdditionSubtractionObjectsActivity :questions="props.questions" :feedback="props.feedback" v-bind="$attrs" />
</template>
