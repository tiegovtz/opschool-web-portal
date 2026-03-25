import { defineAsyncComponent } from "vue";

export const MultipleChoiceGameActivity = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/game-activities/multiple-choice"),
);
export const MissingDefinitionsGameActivity = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/game-activities/missing-definitions"),
);
export const ShortAnswerQuestionsGame = defineAsyncComponent(
  () =>
    import("@/components/primary-sources/activities/game-activities/short-answer-questions"),
);
export const ArrangeAlphabetGameActivity = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/game-activities/arrange-alphabet"),
);
export const AscendingOrderGameActivity = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/game-activities/ascending-order-game"),
);
