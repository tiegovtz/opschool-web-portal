import { ActivityType } from "@/lib/types/activity-types";
import { ActivityTranspilerProps } from "../transpilerMapper";

import ExamMultipleChoice from "@/components/activities/exam-activities/exam-multiple-choice";
import ExamMatchingWithLetters from "@/components/activities/exam-activities/exam-matching-with-letters";
import ExamCompleteSentencesByRephrasing from "@/components/activities/exam-activities/exam-complete-sentences-by-rephrasing";
import ExamOpenEndedQuestions from "@/components/activities/exam-activities/exam-open-ended-questions";
import ExamCompleteParagraphWithoutClues from "@/components/activities/exam-activities/exam-complete-paragraph-without-clues";
import ExamComprehensionJuniorOne from "@/components/activities/exam-activities/exam-comprehension-junior-one";
import ExamRearrangeStepsVertically from "@/components/activities/exam-activities/exam-rearrange-steps-vertically";
import ExamTableCheckBoxes from "@/components/activities/exam-activities/exam-table-check-boxes";
import ExamStrikeOutOddOne from "@/components/activities/exam-activities/exam-strike-out-odd-one";

import examMultipleChoiceTranspiler from "@/shared/transpilerMapper/games-transpiler/multiple-choice";
import { matchingWithLettersTranspiler as examMatchingWithLettersTranspiler } from "@/shared/transpilerMapper/matching-with-letters";
import { openEndedQuestionsTranspiler } from "@/shared/transpilerMapper/open-ended-questions/open-ended-questions";
import { completeParagraphWithCluesJuniorTranspiler } from "@/shared/transpilerMapper/complete-paragraph-with-clues-junior";
import { comprehensionJuniorPropsTranspiler } from "@/shared/transpilerMapper/comprehension-junior";
import { rearrangeStepsVerticallyTranspiler } from "../transpilerMapper/rearrange-steps-vertically";
import tableCheckBoxesTranspiler from "../transpilerMapper/table-check-boxes";
import { completeSentencesByRephrasingPropsTranspiler } from "../transpilerMapper/complete-sentences/complete-sentences-by-rephrasing";
import { examStrikeOutOddOneTranspiler } from "../transpilerMapper/exam-transpilers/exam-strike-out-odd-one";

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
