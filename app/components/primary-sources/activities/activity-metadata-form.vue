<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/inputs/input.vue";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityMetadata } from "./forms";
import { defaultActivityMetadata } from "./forms";

type Props = {
  onSubmit?: (metadata: ActivityMetadata) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ActivityMetadata>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  hideActions?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
  isEditMode: false,
  hideActions: false,
});

const metadata = reactive<ActivityMetadata>(defaultActivityMetadata(props.defaultValues));
const statusId = "activity-metadata-form-status";
const keyboardStatusMessage = ref("");

watch(
  () => props.defaultValues,
  (value) => {
    Object.assign(metadata, defaultActivityMetadata(value));
  },
  { deep: true },
);

const handleSubmit = () => {
  keyboardStatusMessage.value = "Metadata submitted.";
  props.onSubmit?.({
    ...metadata,
    summary: metadata.summary?.trim() || "",
  });
};
</script>

<template>
  <Card>
    <p :id="statusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>
    <CardHeader>
      <CardTitle>Activity Metadata</CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="activity-name">Activity Name</label>
          <Input id="activity-name" v-model="metadata.activityName" :aria-describedby="statusId" placeholder="Activity name" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="sub-topic">Sub Topic</label>
          <Input id="sub-topic" v-model="metadata.subTopic" :aria-describedby="statusId" placeholder="Sub topic" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="grade-id">Grade ID</label>
          <Input id="grade-id" v-model="metadata.gradeId" :aria-describedby="statusId" placeholder="e.g. 4" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="subject-id">Subject ID</label>
          <Input id="subject-id" v-model="metadata.subjectId" :aria-describedby="statusId" placeholder="e.g. 12" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="topic-id">Topic ID</label>
          <Input id="topic-id" v-model="metadata.topicId" :aria-describedby="statusId" placeholder="e.g. 38" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-oceanBlue" for="summary-path">Summary Image Path</label>
          <Input id="summary-path" v-model="metadata.summaryPath" :aria-describedby="statusId" placeholder="/uploads/activity-image.png" />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-oceanBlue" for="summary">Summary</label>
        <Textarea id="summary" v-model="metadata.summary" :aria-describedby="statusId" class="min-h-[96px]" placeholder="Optional summary shown in Learn More" />
      </div>

      <label class="flex items-center gap-3 rounded-xl border border-oceanBlue/10 bg-sky-50 px-4 py-3 text-sm text-oceanBlue">
        <input v-model="metadata.isPremium" type="checkbox" :aria-describedby="statusId" class="h-4 w-4">
        Premium activity
      </label>

      <div v-if="!props.hideActions" class="flex justify-end gap-3">
        <Button v-if="props.onCancel" variant="outline-brand" @click="props.onCancel">
          Cancel
        </Button>
        <Button :disabled="props.isSubmitting" @click="handleSubmit">
          {{ props.isEditMode ? "Save Metadata" : "Continue" }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
