import { ActivityType } from "../../app/types/activity-types";
import { type ServerQuestionType } from "../../app/types/activity-props";
// Transpilers
///////////////////////////////////////////////////
import completeMatrixTranspiler from "./complex-matrix";
import tableCheckBoxesTranspiler from "./table-check-boxes";
import arrangeStepsTranspiler from "./arrange-steps";
import { connectionWallTranspiler } from "./connection-wall";
import dialogDifferencesPropsTranspiler from "./dialog-differences";
import { matchingWithLettersTranspiler } from "./matching-with-letters";
import { comprehensionJuniorPropsTranspiler } from "./comprehension-junior";
import { multipleChoiceWithNotesTranspiler } from "./multiple-choice-with-notes";
import { rearrangeStepsVerticallyTranspiler } from "./rearrange-steps-vertically";
import { completeParagraphWithCluesJuniorTranspiler } from "./complete-paragraph-with-clues-junior";
import completeSentencesByClickingTranspiler from "./complete-sentences/complete-sentences-by-clicking";
import pictureOrStoryFollowedByQuestionsActivityTranspiler from "./picture-or-story-followed-by-questions";
import completeSentencesBySelectingCorrectOnesTranspiler from "./complete-sentences-by-selecting-correct-ones";
import completeSentencesWithTwoClausesTranspiler from "./complete-sentences/complete-sentences-with-two-clauses";
import completesentencesbydraggingcluesTranspiler from "./complete-sentences/complete-sentences-by-dragging-clues";
import { completeSentencesByRephrasingPropsTranspiler } from "./complete-sentences/complete-sentences-by-rephrasing";
import completeSentencesBySelectingCluesTranspiler from "./complete-sentences/complete-sentences-by-selecting-clues";
import completeSentencesWithThreeClausesTranspiler from "./complete-sentences/complete-sentences-with-three-clauses";
import completeSentencesByClickingSpecificsTranspiler from "./complete-sentences/complete-sentences-by-clicking-specifics";
import pictureOrStoryFollowedByQuestionsTrueFalseActivityTranspiler from "./picture-or-story-followed-by-questions-true-false";
import {
  inWhichBoxPropsTranspiler,
  inWhichBoxThreeBoxesPropsTranspiler,
} from "./in-which-box";
import completeSentenceRearrangeDraggingTranspiler from "./complete-sentences/complete-sentence-rearrange-dragging";
import itemsLabellingTranspiler from "./items-labelling";
import rearrangeTheStepsTranspiler from "./rearrange-the-steps";
import matchingItemsPictureTextTranspiler from "./matching-items-picture-text";
import hiddenWordsTranspiler from "./hidden-words";
import CountingMixedObjectsTranspiler from "./counting-mixed-objects";
import missingValuesTranspiler from "./missing-values";
import NumberMatrixTranspiler from "./number-matrix";
import missingValuesJuniorTranspiler from "./missing-values-junior";
import abacusActivityTranspiler from "./abacus-activity";
import placeValuesMatrixTranspiler from "./place-values-matrix";
import shapesRenderingTranspiler from "./shapes-rendering";
import CrosswordsTranspiler from "./crosswords";
import { labelTheDiagramTranspiler } from "./labelTheDiagramTranspiler";
import { labelTheDiagramCheckboxTranspiler } from "./labelTheDiagramCheckboxTranspiler";
import singleCheckTableTranspiler from "./single-check-table";
import tableCheckboxFillingTranspiler from "./table-checkbox-filling";
import multipleChoiceGameTranspiler from "./games-transpiler/multiple-choice";
import missingDefinitionsGameTranspiler from "./games-transpiler/missing-definitions";
import shortAnswerQuestionsGameTranspiler from "./games-transpiler/short-answer-questions";
import arrangeAlphabetGameTranspiler from "./games-transpiler/arrange-alphabet";
import ascendingOrderGameTranspiler from "./games-transpiler/ascending-order-game";
import comparingQuantitiesDraggingTranspiler from "./numerical-transpilers/comparing-quantities-dragging";
import additionSubtractionObjectsTranspiler from "./numerical-transpilers/addition-subtraction-objects";
import strikeOutOddOneTranspiler from "./strike-out-odd-one";
import { openEndedQuestionsTranspiler } from "./open-ended-questions/open-ended-questions";
import rearrangeLettersInWordsTranspiler from "./rearrange-letters-in-words";
import missingLettersWordsTranspiler from "./missing-letters-words";
import fractionOperationTranspiler from "./fraction-operation";
import twoUnitsOperationTranspiler from "./two-units-operation";
import magicSquareTranspiler from "./magic-square";
import { patternMatchingTranspiler } from "./pattern-matching";
///////////////////////////////////////////////////

export type ActivityTranspilerProps = {
  isMobile?: boolean;
  summary: string | null;
  algorithm: ActivityType;
  titleDescription: string;
  summaryPath: string | null;
  serverQuestions: ServerQuestionType[];
  setWrongQuestionsFormat: (value: boolean) => void;
};

type ActivityTranspilerMapper = {
  [key in ActivityType]?: (params: ActivityTranspilerProps) => any;
};

const activityPropsTranspiler: ActivityTranspilerMapper = {
  // Dialog Transpilers
  [ActivityType.DialogDifferences]: dialogDifferencesPropsTranspiler,
  [ActivityType.DialogOneSideFixed]: dialogDifferencesPropsTranspiler,

  // In Which Box Transpilers
  [ActivityType.InWhichBox]: inWhichBoxThreeBoxesPropsTranspiler,
  [ActivityType.InWhichBoxPics]: inWhichBoxThreeBoxesPropsTranspiler,
  [ActivityType.InWhichBoxMixedTwoBoxesSixItems]: inWhichBoxPropsTranspiler,
  [ActivityType.InWhichBoxMixedThreeBoxes]: inWhichBoxThreeBoxesPropsTranspiler,
  [ActivityType.InWhichBoxTwoBoxes]: inWhichBoxPropsTranspiler,
  [ActivityType.InWhichBoxPicsTwoBoxes]: inWhichBoxPropsTranspiler,
  [ActivityType.InWhichBoxPicsTwoBoxesSixItems]: inWhichBoxPropsTranspiler,

  // Comprehension Junior and alikes Transpilers
  [ActivityType.ComprehensionJuniorOne]: comprehensionJuniorPropsTranspiler,
  [ActivityType.ComprehensionJuniorTwo]: comprehensionJuniorPropsTranspiler,
  [ActivityType.PictureOrStoryFollowedByQuestionsTrueFalse]:
    pictureOrStoryFollowedByQuestionsTrueFalseActivityTranspiler,
  [ActivityType.PictureOrStoryFollowedByQuestions]:
    pictureOrStoryFollowedByQuestionsActivityTranspiler,

  // Connection Wall Transpilers
  [ActivityType.ConnectionWall]: connectionWallTranspiler,
  [ActivityType.ConnectionWallPic]: connectionWallTranspiler,
  [ActivityType.ConnectionWallPicText]: connectionWallTranspiler,
  [ActivityType.ConnectionWallThreeRows]: connectionWallTranspiler,
  [ActivityType.ConnectionWallGames]: connectionWallTranspiler,
  // Rearranging Steps Transpilers
  [ActivityType.RearrangeStepsVertically]: rearrangeStepsVerticallyTranspiler,
  [ActivityType.RearrangeStepsVerticallyEightRows]:
    rearrangeStepsVerticallyTranspiler,
  [ActivityType.ArrangeSteps]: arrangeStepsTranspiler,
  [ActivityType.RearrangeTheSteps]: rearrangeTheStepsTranspiler,

  // Complete Matrix Transpilers
  [ActivityType.CompleteMatrix]: completeMatrixTranspiler,
  [ActivityType.CompleteMatrixTwoRows]: completeMatrixTranspiler,

  // Complete Sentences
  [ActivityType.CompleteSentenceByRephrasingWithChoices]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesByRephrasing]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesTwoFieldsNoClues]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesByRephrasingTwoFields]:
    completeSentencesByRephrasingPropsTranspiler,
  [ActivityType.CompleteSentencesBySelectingCorrectOnes]:
    completeSentencesBySelectingCorrectOnesTranspiler,
  [ActivityType.CompleteSentencesByDraggingClues]:
    completesentencesbydraggingcluesTranspiler,
  [ActivityType.CompleteSentencesByDraggingCluesPics2]:
    completesentencesbydraggingcluesTranspiler,
  [ActivityType.CompleteSentencesByDraggingCluesPics]:
    completesentencesbydraggingcluesTranspiler,
  [ActivityType.CompleteSentenceByDraggingCluesWithNotes]:
    completesentencesbydraggingcluesTranspiler,
  [ActivityType.CompleteSentencesWithTwoClauses]:
    completeSentencesWithTwoClausesTranspiler,
  [ActivityType.CompleteSentencesByClickingSpecifics]:
    completeSentencesByClickingSpecificsTranspiler,
  [ActivityType.CompleteSentencesByClicking]:
    completeSentencesByClickingTranspiler,
  [ActivityType.CompleteSentencesWithThreeClauses]:
    completeSentencesWithThreeClausesTranspiler,
  [ActivityType.CompleteSentencesWithFourClauses]:
    completeSentencesWithThreeClausesTranspiler,
  [ActivityType.CompleteSentencesBySelectingClues]:
    completeSentencesBySelectingCluesTranspiler,
  [ActivityType.CompleteSentencesByRearrangingDragging]:
    completeSentenceRearrangeDraggingTranspiler,
  [ActivityType.CompleteSentencesByRearrangingDraggingJunior]:
    completeSentenceRearrangeDraggingTranspiler,
  [ActivityType.CompleteSentencesByRearranging]:
    completeSentenceRearrangeDraggingTranspiler,

  // Items labelling Transpilers
  [ActivityType.LabelTheDiagram]: labelTheDiagramTranspiler,
  [ActivityType.LabelTheDiagramCheckbox]: labelTheDiagramCheckboxTranspiler,
  [ActivityType.ItemsLabelingWithoutClues]: itemsLabellingTranspiler,
  [ActivityType.ItemsLabelingWithoutCluesGame]: itemsLabellingTranspiler,
  [ActivityType.ItemsLabelingWithClues]: itemsLabellingTranspiler,

  // Matching Items Transpilers
  [ActivityType.PictureTextMatching]: matchingItemsPictureTextTranspiler,
  [ActivityType.TextTextMatching]: matchingItemsPictureTextTranspiler,
  [ActivityType.PicturePictureMatching]: matchingItemsPictureTextTranspiler,
  [ActivityType.PictureTextMatchingSixItems]:
    matchingItemsPictureTextTranspiler,
  [ActivityType.TextTextMatchingSixItems]: matchingItemsPictureTextTranspiler,
  [ActivityType.PicturePictureMatchingSixItems]:
    matchingItemsPictureTextTranspiler,
  [ActivityType.MatchingItemsGame]: matchingItemsPictureTextTranspiler,
  [ActivityType.MatchingItemsPicturesGame]: matchingItemsPictureTextTranspiler,

  // Maths Transpilers
  [ActivityType.CountingObjects]: abacusActivityTranspiler,
  [ActivityType.AdditionSubtractionObjects]:
    additionSubtractionObjectsTranspiler,

  // Fraction Operation Transpiler
  [ActivityType.FractionOperation]: fractionOperationTranspiler,

  // Two Units Operation Transpiler
  [ActivityType.TwoUnitsOperation]: twoUnitsOperationTranspiler,

  // Other Transpilers
  [ActivityType.HiddenWords]: hiddenWordsTranspiler,
  [ActivityType.HiddenWordsGame]: hiddenWordsTranspiler,
  [ActivityType.CrosswordsWithPics]: CrosswordsTranspiler,
  [ActivityType.CrosswordWordsGame]: CrosswordsTranspiler,
  [ActivityType.TableCheckBoxes]: tableCheckBoxesTranspiler,
  [ActivityType.TableCheckBoxesFilling]: tableCheckboxFillingTranspiler,
  [ActivityType.TableCheckBoxesFillingPic]: tableCheckboxFillingTranspiler,
  [ActivityType.MultipleChoiceWithNotes]: multipleChoiceWithNotesTranspiler,
  [ActivityType.MatchingWithLetters]: matchingWithLettersTranspiler,
  [ActivityType.CompleteParagraphWithCluesJunior]:
    completeParagraphWithCluesJuniorTranspiler,
  [ActivityType.CompleteParagraphWithoutClues]:
    completeParagraphWithCluesJuniorTranspiler,
  [ActivityType.CountingMixedObjects]: CountingMixedObjectsTranspiler,
  [ActivityType.MissingValues]: missingValuesTranspiler,
  [ActivityType.MissingValuesJunior]: missingValuesJuniorTranspiler,
  [ActivityType.NumberMatrix]: NumberMatrixTranspiler,
  [ActivityType.AbacusActivity]: abacusActivityTranspiler,
  [ActivityType.AbacusReverse]: abacusActivityTranspiler,
  [ActivityType.PlaceValuesMatrix]: placeValuesMatrixTranspiler,
  [ActivityType.ShapesRendering]: shapesRenderingTranspiler,
  [ActivityType.FractionShapes]: shapesRenderingTranspiler,
  [ActivityType.Crosswords]: CrosswordsTranspiler,
  [ActivityType.SingleCheckTable]: singleCheckTableTranspiler,
  [ActivityType.ComparingQuantities]: comparingQuantitiesDraggingTranspiler,
  [ActivityType.ComparingQuantitiesDragging]:
    comparingQuantitiesDraggingTranspiler,
  [ActivityType.ComparingQuantitiesLessMoreWithPics]:
    comparingQuantitiesDraggingTranspiler,
  [ActivityType.RearrangeLettersInWords]: rearrangeLettersInWordsTranspiler,
  [ActivityType.RearrangeLettersInWordsGame]: rearrangeLettersInWordsTranspiler,
  [ActivityType.MissingLettersWords]: missingLettersWordsTranspiler,

  // Strike Out Transpilers
  [ActivityType.StrikeOutOddOne]: strikeOutOddOneTranspiler,

  // Open Ended Questions Transpilers
  [ActivityType.OpenEndedQuestions]: openEndedQuestionsTranspiler,

  // Game Transpilers
  [ActivityType.MultipleChoiceGameActivity]: multipleChoiceGameTranspiler,
  [ActivityType.MissingDefinitionsGameActivity]:
    missingDefinitionsGameTranspiler,
  [ActivityType.ShortAnswerQuestionsGame]: shortAnswerQuestionsGameTranspiler,
  [ActivityType.ArrangeAlphabet]: arrangeAlphabetGameTranspiler,
  [ActivityType.AscendingOrderGame]: ascendingOrderGameTranspiler,

  // Magic Square Transpilers
  [ActivityType.MagicSquare]: magicSquareTranspiler,
  [ActivityType.MagicSquare4x4]: magicSquareTranspiler,

  // Pattern Matching Transpilers
  [ActivityType.PatternMatching]: patternMatchingTranspiler,
};

export default activityPropsTranspiler;
