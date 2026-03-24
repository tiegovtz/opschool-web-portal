import dynamic from "next/dynamic";

export const MultipleChoiceGameActivity = dynamic(
  () => import("@/components/activities/game-activities/multiple-choice"),
);
export const MissingDefinitionsGameActivity = dynamic(
  () => import("@/components/activities/game-activities/missing-definitions"),
);
export const ShortAnswerQuestionsGame = dynamic(
  () =>
    import("@/components/activities/game-activities/short-answer-questions"),
);
export const ArrangeAlphabetGameActivity = dynamic(
  () => import("@/components/activities/game-activities/arrange-alphabet"),
);
export const AscendingOrderGameActivity = dynamic(
  () => import("@/components/activities/game-activities/ascending-order-game"),
);
