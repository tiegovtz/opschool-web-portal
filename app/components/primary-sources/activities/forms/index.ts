// Export all shared activity form components

export { default as MatchingWithLettersForm } from "./matching-with-letters-form";
export { default as HiddenWordsForm } from "./hidden-words-form";
export { default as MultipleChoiceWithNotesForm } from "./multiple-choice-with-notes-form";
export { default as DialogActivityForm } from "./dialog-activity-form";
export { default as MatchingItemsForm } from "./matching-items-form";
export { default as CompleteSentencesRephrasingForm } from "./complete-sentences-rephrasing-form";
export { default as InWhichBoxForm } from "./in-which-box-form";
export { default as CompleteParagraphForm } from "./complete-paragraph-form";
export { default as RearrangeStepsVerticallyForm } from "./rearrange-steps-vertically-form";
export { default as ComprehensionJuniorForm } from "./comprehension-junior-form";
export { default as CompleteSentencesDraggingCluesForm } from "./complete-sentences-dragging-clues-form";
// TODO: Add more forms as they are created
// export { default as TableCheckBoxesForm } from "./table-checkboxes-form";
// export { default as MissingValuesForm } from "./missing-values-form";

// Common activity metadata interface - aligned with backend Activity model
export interface ActivityMetadata {
  // Maps to activity_name in backend
  activityName: string;
  // Maps to summary in backend - shown in "Learn More" section
  summary?: string;
  // Maps to sub_topic in backend
  subTopic?: string;
  // Curriculum code (e.g., "NECTA", "KYN", "CAMB")
  curriculumCode?: string;
  // Used for filtering (not stored directly on activity)
  gradeId: string;
  // Used for filtering (not stored directly on activity)
  subjectId: string;
  // Maps to topic_id in backend
  topicId: string;
  // Premium content flag
  isPremium?: boolean;
}

// Common question interface with image support
export interface QuestionWithImage {
  id: string;
  text: string;
  image?: File | string | null;
  notes?: string;
}

// Enhanced base form props with common activity fields
export interface BaseActivityFormProps<T = any> {
  onSubmitSuccess?: (activityId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<T & ActivityMetadata>;
  context?: "assignment" | "platform";
  onSubmit?: (data: T & Partial<ActivityMetadata>) => Promise<void>;
  metadata?: ActivityMetadata;
  // Edit mode support
  isEditMode?: boolean;
  activityId?: number;
}
