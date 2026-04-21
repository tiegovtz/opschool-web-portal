<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActivityType } from "@/lib/types/activity-types";
import ActivityMetadataForm from "./activity-metadata-form.vue";
import type { ActivityMetadata, BaseActivityFormProps, ActivityFormSubmission } from "./forms";
import { defaultActivityMetadata } from "./forms";
import { getActivityTypeConfig } from "@/shared/config/activity-types-config";

type Props = BaseActivityFormProps & {
  activityType: ActivityType | string | null;
  metadata?: ActivityMetadata;
};

const props = withDefaults(defineProps<Props>(), {
  context: "assignment",
});

const metadata = ref<ActivityMetadata>(defaultActivityMetadata(props.metadata));
const configurationText = ref("{}");
const parseError = ref("");
const isSubmitting = ref(false);
const instructionsId = "activity-form-renderer-instructions";
const statusId = "activity-form-renderer-status";
const keyboardStatusMessage = ref("");

const config = computed(() =>
  props.activityType ? getActivityTypeConfig(props.activityType as ActivityType) : null,
);

watch(
  () => props.metadata,
  (value) => {
    metadata.value = defaultActivityMetadata(value);
  },
  { deep: true, immediate: true },
);

watch(
  () => [props.defaultValues, props.activityType] as const,
  ([value, activityType]) => {
    const source = (value as Record<string, unknown> | undefined) || {};
    const configuration =
      (source.configuration as Record<string, unknown> | undefined) ||
      (source.questions as Record<string, unknown> | undefined) ||
      {
        title: config.value?.title || String(activityType || ""),
        questions: [],
      };

    configurationText.value = JSON.stringify(configuration, null, 2);
  },
  { deep: true, immediate: true },
);

const contextCopy = computed(() =>
  props.context === "platform"
    ? "This activity will be available on the platform. Keep the metadata and JSON clean enough for reuse."
    : "This activity will be used inside assignments. You can keep the metadata and JSON focused on one class or lesson.",
);

const handleMetadataSubmit = (value: ActivityMetadata) => {
  metadata.value = value;
};

const handleSubmit = async () => {
  if (!props.activityType) return;

  try {
    parseError.value = "";
    isSubmitting.value = true;

    const configuration = JSON.parse(configurationText.value || "{}") as Record<string, unknown>;
    const payload: ActivityFormSubmission = {
      activityType: props.activityType,
      metadata: metadata.value,
      configuration,
    };

    await props.onSubmit?.(payload);
    props.onSubmitSuccess?.(payload);
    keyboardStatusMessage.value = "Activity form saved.";
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : "Invalid JSON configuration.";
    keyboardStatusMessage.value = parseError.value;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="props.activityType && config" class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>{{ config.title }}</CardTitle>
        <CardDescription>{{ config.description }}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-slate-600">{{ contextCopy }}</p>
      </CardContent>
    </Card>
    <p :id="instructionsId" class="sr-only">
      Edit the activity metadata and raw JSON configuration. Use the Tab key to move through the
      form fields, then choose save when you are ready.
    </p>
    <p :id="statusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <ActivityMetadataForm
      :default-values="metadata"
      :hide-actions="true"
      :on-submit="handleMetadataSubmit"
    />

    <Card>
      <CardHeader>
        <CardTitle>Activity Configuration</CardTitle>
        <CardDescription>
          Edit the raw activity payload. This replaces the missing legacy per-activity React forms with a Vue-safe JSON editor.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert>
          <AlertTitle>Expected shape</AlertTitle>
          <AlertDescription>
            Use the same structure the activity component expects, usually an object with `title` and `questions`.
          </AlertDescription>
        </Alert>

        <Textarea
          v-model="configurationText"
          class="min-h-[420px] font-mono text-sm"
          :aria-describedby="`${instructionsId} ${statusId}`"
          aria-label="Activity JSON configuration"
          placeholder="{&#10;  &quot;title&quot;: &quot;My Activity&quot;,&#10;  &quot;questions&quot;: []&#10;}"
        />

        <Alert v-if="parseError" variant="destructive">
          <AlertTitle>Invalid JSON</AlertTitle>
          <AlertDescription>{{ parseError }}</AlertDescription>
        </Alert>

        <div class="flex justify-end gap-3">
          <Button v-if="props.onCancel" variant="outline-brand" @click="props.onCancel">
            Cancel
          </Button>
          <Button :disabled="isSubmitting" :aria-describedby="`${instructionsId} ${statusId}`" @click="handleSubmit">
            {{ isSubmitting ? "Saving..." : "Save Activity Form" }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
