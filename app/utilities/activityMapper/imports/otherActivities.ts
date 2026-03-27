import dynamic from "next/dynamic";

const loadActivity = (fn: () => Promise<any>) =>
  dynamic(fn, { ssr: false });

export const MultipleChoiceWithNotes = loadActivity(
  () => import("@/components/activities/multiple-choice-with-notes.vue")
);

export const ComprehensionJunior = loadActivity(
  () => import("@/components/activities/comprehension-junior.vue")
);

export const PictureOrStoryFollowedByQuestionsTrueFalseActivity = loadActivity(
  () =>
    import(
      "@/components/activities/picture-or-story-followed-by-questions-true-false.vue"
    )
);

export const PictureOrStoryFollowedByQuestionsActivity = loadActivity(
  () =>
    import("@/components/activities/picture-or-story-followed-by-questions.vue")
);

export const MatchingWithLettersActivity = loadActivity(
  () => import("@/components/activities/matching-with-letters.vue")
);

export const CompleteParagraphWithCluesJunior = loadActivity(
  () => import("@/components/activities/complete-paragraph-with-clues-junior.vue")
);

export const CompleteParagraphWithoutClues = loadActivity(
  () => import("@/components/activities/complete-paragraph-without-clues.vue")
);

export const RearrangeStepsVerticallyActivity = loadActivity(
  () => import("@/components/activities/rearrange-steps-vertically.vue")
);

export const RearrangeTheSteps = loadActivity(
  () => import("@/components/activities/rearrange-the-steps.vue")
);

export const ArrangeStepsActivity = loadActivity(
  () => import("@/components/activities/arrange-steps.vue")
);

export const CompleteMatrix = loadActivity(
  () => import("@/components/activities/complete-matrix.vue")
);

export const TableCheckBoxes = loadActivity(
  () => import("@/components/activities/table-check-boxes.vue")
);

export const TableCheckBoxesFilling = loadActivity(
  () => import("@/components/activities/table-checkbox-filling.vue")
);

export const ItemsLabellingActivity = loadActivity(
  () => import("@/components/activities/items-labelling.vue")
);

export const LabelTheDiagram = loadActivity(
  () => import("@/components/activities/label-the-diagram.vue")
);

export const MatchingItemsPictureTextActivity = loadActivity(
  () => import("@/components/activities/matching-items-picture-text.vue")
);

export const HiddenWords = loadActivity(
  () => import("@/components/activities/hidden-words.vue")
);

export const CountingObjectsActivity = loadActivity(
  () => import("@/components/activities/numbers-activities/counting-objects.vue")
);

export const AdditionSubtractionObjectsActivity = loadActivity(
  () =>
    import(
      "@/components/activities/numbers-activities/addition-subtraction-objects.vue"
    )
);

export const CountingMixedObjectsActivity = loadActivity(
  () => import("@/components/activities/counting-mixed-objects.vue")
);

export const MissingValuesActivity = loadActivity(
  () => import("@/components/activities/missing-values.vue")
);

export const MissingValuesJuniorActivity = loadActivity(
  () => import("@/components/activities/missing-values-junior.vue")
);

export const NumberMatrixActivity = loadActivity(
  () => import("@/components/activities/number-matrix.vue")
);

export const AbacusActivity = loadActivity(
  () => import("@/components/activities/abacus-activity.vue")
);

export const AbacusReverseActivity = loadActivity(
  () => import("@/components/activities/reverse-abacus-activity.vue")
);

export const PlaceValuesMatrixActivity = loadActivity(
  () => import("@/components/activities/place-values-matrix.vue")
);

export const ShapesRenderingActivity = loadActivity(
  () => import("@/components/activities/shapes-rendering.vue")
);

export const CrosswordActivity = loadActivity(
  () => import("@/components/activities/crossword-puzzle.vue")
);

export const SingleCheckTable = loadActivity(
  () => import("@/components/activities/single-check-table.vue")
);

export const ComparingQuantitiesDraggingActivity = loadActivity(
  () =>
    import(
      "@/components/activities/numbers-activities/comparingQuantitiesDragging.vue"
    )
);

export const ComparingQuantities = loadActivity(
  () =>
    import("@/components/activities/numbers-activities/comparing-quantities.vue")
);

export const ComparingQuantitiesLessMoreWithPics = loadActivity(
  () =>
    import(
      "@/components/activities/numbers-activities/comparing-quantities-less-more-with-pics.vue"
    )
);

export const RearrangeLettersInWords = loadActivity(
  () => import("@/components/activities/rearrange-letters-in-words.vue")
);

export const MissingLettersWords = loadActivity(
  () => import("@/components/activities/missing-letters-words.vue")
);

export const StrikeOutOddOneActivity = loadActivity(
  () => import("@/components/activities/strike-out-odd-one.vue")
);

export const OpenEndedQuestions = loadActivity(
  () => import("@/components/activities/open-ended-questions.vue")
);

export const PatternMatchingActivity = loadActivity(
  () => import("@/components/activities/pattern-matching.vue")
);
