import { defineAsyncComponent } from "vue";

export const MultipleChoiceGameActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/game-activities/multiple-choice.vue"),
);
export const MissingDefinitionsGameActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/game-activities/missing-definitions.vue"),
);
export const ShortAnswerQuestionsGame = defineAsyncComponent(
  () =>
    import("~/components/primary-sources/activities/game-activities/short-answer-questions.vue"),
);
export const ArrangeAlphabetGameActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/game-activities/arrange-alphabet.vue"),
);
export const AscendingOrderGameActivity = defineAsyncComponent(
  () => import("~/components/primary-sources/activities/game-activities/ascending-order-game.vue"),
);
