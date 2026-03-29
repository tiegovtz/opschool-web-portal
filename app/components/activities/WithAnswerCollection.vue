<template>
  <component
    :is="component"
    v-bind="passThroughProps"
  />
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps({
  component: { type: Object, required: true },

  activityId: Number,
  studentProfileId: Number,
  parentAccountId: Number,
  sessionId: Number,
  autoSaveAnswers: { type: Boolean, default: false },

  onActivityComplete: Function,
  onAnswerRecorded: Function,

  // rest props
  activityProps: { type: Object, default: () => ({}) }
})

const passThroughProps = computed(() => ({
  ...props.activityProps,

  activityId: props.activityId,
  studentProfileId: props.studentProfileId,
  parentAccountId: props.parentAccountId,
  sessionId: props.sessionId,
  autoSaveAnswers: props.autoSaveAnswers,
}))
</script>