/**
 * Complete Sentences Activity Components
 *
 * Exports the reusable QuestionRenderer component and utilities
 * for rendering questions with KaTeX support, blanks, and highlighted text.
 */

export { QuestionRenderer } from "./question-renderer";
export type { QuestionRendererProps, QuestionRendererMode } from "./question-renderer";

export { parseQuestionSegments, calculateBlankWidth } from "./question-renderer-utils";
export type { QuestionSegment } from "./question-renderer-utils";
