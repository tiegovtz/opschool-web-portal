/**
 * Complete Sentences Activity Components
 *
 * Exports the reusable QuestionRenderer component and utilities
 * for rendering questions with KaTeX support, blanks, and highlighted text.
 */

export { default as QuestionRenderer } from "./question-renderer.vue";
export type { QuestionRendererProps, QuestionRendererMode } from "./question-renderer.vue";

export { parseQuestionSegments, calculateBlankWidth } from "./question-renderer-utils";
export type { QuestionSegment } from "./question-renderer-utils";
