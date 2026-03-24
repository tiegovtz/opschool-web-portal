import dynamic from "next/dynamic";

export const MultipleChoiceWithNotes = dynamic(
  () => import("@/components/activities/multiple-choice-with-notes"),
);

export const ComprehensionJunior = dynamic(
  () => import("@/components/activities/comprehension-junior"),
);

export const PictureOrStoryFollowedByQuestionsTrueFalseActivity = dynamic(
  () =>
    import(
      "@/components/activities/picture-or-story-followed-by-questions-true-false"
    ),
);

export const PictureOrStoryFollowedByQuestionsActivity = dynamic(
  () =>
    import("@/components/activities/picture-or-story-followed-by-questions"),
);

export const MatchingWithLettersActivity = dynamic(
  () => import("@/components/activities/matching-with-letters"),
);

export const CompleteParagraphWithCluesJunior = dynamic(
  () => import("@/components/activities/complete-paragraph-with-clues-junior"),
);

export const CompleteParagraphWithoutClues = dynamic(
  () => import("@/components/activities/complete-paragraph-without-clues"),
);

export const RearrangeStepsVerticallyActivity = dynamic(
  () => import("@/components/activities/rearrange-steps-vertically"),
);

export const RearrangeTheSteps = dynamic(
  () => import("@/components/activities/rearrange-the-steps"),
);

export const ArrangeStepsActivity = dynamic(
  () => import("@/components/activities/arrange-steps"),
);

export const CompleteMatrix = dynamic(
  () => import("@/components/activities/complete-matrix"),
);

export const TableCheckBoxes = dynamic(
  () => import("@/components/activities/table-check-boxes"),
);

export const TableCheckBoxesFilling = dynamic(
  () => import("@/components/activities/table-checkbox-filling"),
);

export const ItemsLabellingActivity = dynamic(
  () => import("@/components/activities/items-labelling"),
);

export const LabelTheDiagram = dynamic(
  () => import("@/components/activities/label-the-diagram"),
);

export const MatchingItemsPictureTextActivity = dynamic(
  () => import("@/components/activities/matching-items-picture-text"),
);

export const HiddenWords = dynamic(
  () => import("@/components/activities/hidden-words"),
);

export const CountingObjectsActivity = dynamic(
  () => import("@/components/activities/numbers-activities/counting-objects"),
);

export const AdditionSubtractionObjectsActivity = dynamic(
  () =>
    import(
      "@/components/activities/numbers-activities/addition-subtraction-objects"
    ),
);

export const CountingMixedObjectsActivity = dynamic(
  () => import("@/components/activities/counting-mixed-objects"),
);

export const MissingValuesActivity = dynamic(
  () => import("@/components/activities/missing-values"),
);

export const MissingValuesJuniorActivity = dynamic(
  () => import("@/components/activities/missing-values-junior"),
);

export const NumberMatrixActivity = dynamic(
  () => import("@/components/activities/number-matrix"),
);

export const AbacusActivity = dynamic(
  () => import("@/components/activities/abacus-activity"),
);

export const AbacusReverseActivity = dynamic(
  () => import("@/components/activities/reverse-abacus-activity"),
);

export const PlaceValuesMatrixActivity = dynamic(
  () => import("@/components/activities/place-values-matrix"),
);

export const ShapesRenderingActivity = dynamic(
  () => import("@/components/activities/shapes-rendering"),
);

export const CrosswordActivity = dynamic(
  () => import("@/components/activities/crossword-puzzle"),
);

export const SingleCheckTable = dynamic(
  () => import("@/components/activities/single-check-table"),
);

export const ComparingQuantitiesDraggingActivity = dynamic(
  () =>
    import(
      "@/components/activities/numbers-activities/comparingQuantitiesDragging"
    ),
);

export const ComparingQuantities = dynamic(
  () =>
    import("@/components/activities/numbers-activities/comparing-quantities"),
);

export const ComparingQuantitiesLessMoreWithPics = dynamic(
  () =>
    import(
      "@/components/activities/numbers-activities/comparing-quantities-less-more-with-pics"
    ),
);

export const RearrangeLettersInWords = dynamic(
  () => import("@/components/activities/rearrange-letters-in-words"),
);

export const MissingLettersWords = dynamic(
  () => import("@/components/activities/missing-letters-words"),
);

export const StrikeOutOddOneActivity = dynamic(
  () => import("@/components/activities/strike-out-odd-one"),
);

export const OpenEndedQuestions = dynamic(
  () => import("@/components/activities/open-ended-questions"),
);

export const PatternMatchingActivity = dynamic(
  () => import("@/components/activities/pattern-matching"),
);
