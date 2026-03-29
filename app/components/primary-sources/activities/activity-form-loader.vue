<script setup lang="ts">
import { computed } from "vue";
import { ActivityType } from "@/lib/types/activity-types";
import { getActivityTypeConfig } from "@/shared/config/activity-types-config";
import type { BaseActivityFormProps } from "./forms";
import ActivityFormRenderer from "./activity-form-renderer.vue";

type Props = BaseActivityFormProps & {
  activityType: ActivityType | string | null;
};

const props = withDefaults(defineProps<Props>(), {
  context: "assignment",
});

const config = computed(() =>
  props.activityType ? getActivityTypeConfig(props.activityType as ActivityType) : null,
);
</script>

<template>
  <ActivityFormRenderer
    v-if="props.activityType && config"
    :activity-type="props.activityType"
    :on-submit-success="props.onSubmitSuccess"
    :on-cancel="props.onCancel"
    :default-values="props.defaultValues"
    :context="props.context"
    :on-submit="props.onSubmit"
  />

  <div v-else-if="props.activityType" class="rounded-2xl border border-red-200 bg-red-50 p-6">
    <h3 class="font-semibold text-red-800">Form configuration missing</h3>
    <p class="mt-2 text-sm text-red-700">
      This activity type is not registered in the activity type config.
    </p>
  </div>
</template>
