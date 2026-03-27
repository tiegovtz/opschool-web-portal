import { defineAsyncComponent } from "vue";

export const MultipleChoiceWithNotes = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/multiple-choice-with-notes"),
);

export const ComprehensionJunior = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/comprehension-junior.vue"),
);

export const PictureOrStoryFollowedByQuestionsTrueFalseActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/picture-or-story-followed-by-questions-true-false"
    ),
);

export const PictureOrStoryFollowedByQuestionsActivity = defineAsyncComponent(
  () =>
    import("~/components/primary-sources/activities/picture-or-story-followed-by-questions"),
);

export const MatchingWithLettersActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/matching-with-letters"),
);

export const CompleteParagraphWithCluesJunior = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/complete-paragraph-with-clues-junior"),
);

export const CompleteParagraphWithoutClues = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/complete-paragraph-without-clues"),
);

export const RearrangeStepsVerticallyActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/rearrange-steps-vertically.vue"),
);

export const RearrangeTheSteps = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/rearrange-the-steps"),
);

export const ArrangeStepsActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/arrange-steps"),
);

export const CompleteMatrix = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/complete-matrix"),
);

export const TableCheckBoxes = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/table-check-boxes"),
);

export const TableCheckBoxesFilling = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/table-checkbox-filling"),
);

export const ItemsLabellingActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/items-labelling.vue"),
);

export const LabelTheDiagram = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/label-the-diagram"),
);

export const MatchingItemsPictureTextActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/matching-items-picture-text.vue"),
);

export const HiddenWords = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/hidden-words.vue"),
);

export const CountingObjectsActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/numbers-activities/counting-objects"),
);

export const AdditionSubtractionObjectsActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/numbers-activities/addition-subtraction-objects"
    ),
);

export const CountingMixedObjectsActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/counting-mixed-objects"),
);

export const MissingValuesActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/missing-values"),
);

export const MissingValuesJuniorActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/missing-values-junior"),
);

export const NumberMatrixActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/number-matrix"),
);

export const AbacusActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/abacus-activity.vue"),
);

export const AbacusReverseActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/reverse-abacus-activity.vue"),
);

export const PlaceValuesMatrixActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/place-values-matrix.vue"),
);

export const ShapesRenderingActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/shapes-rendering"),
);

export const CrosswordActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/crossword-puzzle.vue"),
);

export const SingleCheckTable = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/single-check-table"),
);

export const ComparingQuantitiesDraggingActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/numbers-activities/comparingQuantitiesDragging"
    ),
);

export const ComparingQuantities = defineAsyncComponent(
  () =>
    import("~/components/primary-sources/activities/numbers-activities/comparing-quantities"),
);

export const ComparingQuantitiesLessMoreWithPics = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/numbers-activities/comparing-quantities-less-more-with-pics"
    ),
);

export const RearrangeLettersInWords = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/rearrange-letters-in-words.vue"),
);

export const MissingLettersWords = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/missing-letters-words"),
);

export const StrikeOutOddOneActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/strike-out-odd-one"),
);

export const OpenEndedQuestions = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/open-ended-questions.vue"),
);

export const PatternMatchingActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/pattern-matching.vue"),
);
