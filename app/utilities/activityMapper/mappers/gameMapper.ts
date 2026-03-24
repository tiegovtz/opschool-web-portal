import { ActivityType } from "@/lib/types/activity-types";
import {
  MultipleChoiceGameActivity,
  MissingDefinitionsGameActivity,
  ShortAnswerQuestionsGame,
  ArrangeAlphabetGameActivity,
  AscendingOrderGameActivity,
} from "../imports";

export const gameMapper = {
  [ActivityType.MultipleChoiceGameActivity]: MultipleChoiceGameActivity,
  [ActivityType.MissingDefinitionsGameActivity]: MissingDefinitionsGameActivity,
  [ActivityType.ShortAnswerQuestionsGame]: ShortAnswerQuestionsGame,
  [ActivityType.ArrangeAlphabet]: ArrangeAlphabetGameActivity,
  [ActivityType.AscendingOrderGame]: AscendingOrderGameActivity,
};
