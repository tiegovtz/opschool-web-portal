import { ActivityType } from "@/types/activity-types";
import { type ActivityTranspilerProps } from "~~/shared/transpilerMapper";
import examMultipleChoiceTranspiler from "~~/shared/transpilerMapper/games-transpiler/multiple-choice";

import { rearrangeStepsVerticallyTranspiler } from "~~/shared/transpilerMapper/rearrange-steps-vertically";
import { comprehensionJuniorPropsTranspiler } from "~~/shared/transpilerMapper/comprehension-junior";
import tableCheckBoxesTranspiler from "~~/shared/transpilerMapper/table-check-boxes";
import { completeSentencesByRephrasingPropsTranspiler } from "~~/shared/transpilerMapper/complete-sentences/complete-sentences-by-rephrasing";
import { examStrikeOutOddOneTranspiler } from "~~/shared/transpilerMapper/exam-transpilers/exam-strike-out-odd-one";
import { completeParagraphWithCluesJuniorTranspiler } from "~~/shared/transpilerMapper/complete-paragraph-with-clues-junior";
import openEndedQuestionsTranspiler from "~~/shared/transpilerMapper/open-ended-questions/open-ended-questions";
import { matchingWithLettersTranspiler as examMatchingWithLettersTranspiler } from "~~/shared/transpilerMapper/matching-with-letters";
import ExamStrikeOutOddOne from "~/components/primary-sources/activities/exam-activities/exam-strike-out-odd-one";
import ExamTableCheckBoxes from "~/components/primary-sources/activities/exam-activities/exam-table-check-boxes";
import ExamRearrangeStepsVertically from "~/components/primary-sources/activities/exam-activities/exam-rearrange-steps-vertically";
import ExamComprehensionJuniorOne from "~/components/primary-sources/activities/exam-activities/exam-comprehension-junior-one";
import ExamCompleteParagraphWithoutClues from "~/components/primary-sources/activities/exam-activities/exam-complete-paragraph-without-clues";
import ExamOpenEndedQuestions from "~/components/primary-sources/activities/exam-activities/exam-open-ended-questions";
import ExamCompleteSentencesByRephrasing from "~/components/primary-sources/activities/exam-activities/exam-complete-sentences-by-rephrasing";
import ExamMatchingWithLetters from "~/components/primary-sources/activities/exam-activities/exam-matching-with-letters";
import ExamMultipleChoice from "~/components/primary-sources/activities/exam-activities/exam-multiple-choice";

export const examActivityComponents = {
  "Multiple choice game": ExamMultipleChoice,
  "Matching with letters": ExamMatchingWithLetters,
  [ActivityType.CompleteSentenceByRephrasingWithChoices]:
    ExamCompleteSentencesByRephrasing,
  [ActivityType.CompleteSentencesByRephrasing]:
    ExamCompleteSentencesByRephrasing,
  [ActivityType.CompleteSentencesTwoFieldsNoClues]:
    ExamCompleteSentencesByRephrasing,
  [ActivityType.CompleteSentencesByRephrasingTwoFields]:
    ExamCompleteSentencesByRephrasing,
  [ActivityType.OpenEndedQuestions]: ExamOpenEndedQuestions,
  [ActivityType.CompleteParagraphWithoutClues]:
    ExamCompleteParagraphWithoutClues,
  [ActivityType.ComprehensionJuniorOne]: ExamComprehensionJuniorOne,
  [ActivityType.RearrangeStepsVertically]: ExamRearrangeStepsVertically,
  [ActivityType.RearrangeStepsVerticallyEightRows]:
    ExamRearrangeStepsVertically,
  [ActivityType.TableCheckBoxes]: ExamTableCheckBoxes,
  [ActivityType.StrikeOutOddOne]: ExamStrikeOutOddOne,
};

export type ExamActivityType = keyof typeof examActivityComponents;

export const examQuestionsTranspilerMapper: {
  [key in ActivityType]?: (
    params: ActivityTranspilerProps,
    examMode?: boolean,
  ) => any;
} = {
  [ActivityType.MultipleChoiceGameActivity]: examMultipleChoiceTranspiler,
  [ActivityType.MatchingWithLetters]: examMatchingWithLettersTranspiler,
  [ActivityType.CompleteSentenceByRephrasingWithChoices]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesByRephrasing]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesTwoFieldsNoClues]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesByRephrasingTwoFields]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.OpenEndedQuestions]: openEndedQuestionsTranspiler,
  [ActivityType.CompleteParagraphWithoutClues]:
    completeParagraphWithCluesJuniorTranspiler,
  [ActivityType.ComprehensionJuniorOne]: comprehensionJuniorPropsTranspiler,
  [ActivityType.RearrangeStepsVertically]: rearrangeStepsVerticallyTranspiler,
  [ActivityType.RearrangeStepsVerticallyEightRows]:
    rearrangeStepsVerticallyTranspiler,
  [ActivityType.TableCheckBoxes]: tableCheckBoxesTranspiler,
  [ActivityType.StrikeOutOddOne]: examStrikeOutOddOneTranspiler,
};
