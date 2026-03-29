import type { ActivityType } from "@/lib/types/activity-types";

export type ActivityMetadata = {
  activityName: string;
  summary?: string;
  subTopic: string;
  gradeId: string;
  subjectId: string;
  topicId: string;
  isPremium?: boolean;
  summaryPath?: string;
};

export type ActivityFormSubmission = {
  activityType: ActivityType | string;
  metadata: ActivityMetadata;
  configuration: Record<string, unknown>;
};

export type BaseActivityFormProps = {
  onSubmitSuccess?: (payload?: unknown) => void;
  onCancel?: () => void;
  defaultValues?: Record<string, unknown>;
  context?: "assignment" | "platform";
  onSubmit?: (payload: ActivityFormSubmission) => void | Promise<void>;
};

export const defaultActivityMetadata = (
  values?: Partial<ActivityMetadata>,
): ActivityMetadata => ({
  activityName: "",
  summary: "",
  subTopic: "",
  gradeId: "",
  subjectId: "",
  topicId: "",
  isPremium: false,
  summaryPath: "",
  ...values,
});

