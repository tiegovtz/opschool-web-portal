import { ActivityType } from "~/types/activity-types";

export type ActivityAriaLiveBehavior =
  | "selection"
  | "typing"
  | "placement"
  | "matching"
  | "toggle-grid"
  | "abacus"
  | "hybrid";

const selectionActivities = new Set<string>([
  ActivityType.DialogDifferences,
  ActivityType.DialogOneSideFixed,
  ActivityType.InWhichBox,
  ActivityType.InWhichBoxPics,
  ActivityType.InWhichBoxTwoBoxes,
  ActivityType.InWhichBoxPicsTwoBoxes,
  ActivityType.InWhichBoxMixedThreeBoxes,
  ActivityType.InWhichBoxPicsTwoBoxesSixItems,
  ActivityType.InWhichBoxMixedTwoBoxesSixItems,
  ActivityType.ComprehensionJuniorOne,
  ActivityType.ComprehensionJuniorTwo,
  ActivityType.PictureOrStoryFollowedByQuestionsTrueFalse,
  ActivityType.PictureOrStoryFollowedByQuestions,
  ActivityType.CompleteSentencesByClicking,
  ActivityType.CompleteSentencesByClickingSpecifics,
  ActivityType.CompleteSentencesBySelectingClues,
  ActivityType.CompleteSentencesBySelectingCorrectOnes,
  ActivityType.MultipleChoiceWithNotes,
  ActivityType.ComparingQuantities,
  ActivityType.ComparingQuantitiesLessMoreWithPics,
  ActivityType.StrikeOutOddOne,
  ActivityType.MultipleChoiceGameActivity,
  ActivityType.MissingDefinitionsGameActivity,
]);

const typingActivities = new Set<string>([
  ActivityType.CompleteSentencesByRephrasing,
  ActivityType.CompleteSentenceByRephrasingWithChoices,
  ActivityType.CompleteSentencesWithTwoClauses,
  ActivityType.CompleteSentencesWithThreeClauses,
  ActivityType.CompleteSentencesWithFourClauses,
  ActivityType.CompleteSentencesTwoFieldsNoClues,
  ActivityType.CompleteSentencesByRephrasingTwoFields,
  ActivityType.CompleteParagraphWithCluesJunior,
  ActivityType.CompleteParagraphWithoutClues,
  ActivityType.MissingValues,
  ActivityType.MissingValuesJunior,
  ActivityType.NumberMatrix,
  ActivityType.CompleteMatrix,
  ActivityType.CompleteMatrixTwoRows,
  ActivityType.TableCheckBoxesFilling,
  ActivityType.TableCheckBoxesFillingPic,
  ActivityType.PlaceValuesMatrix,
  ActivityType.CountingObjects,
  ActivityType.AdditionSubtractionObjects,
  ActivityType.CountingMixedObjects,
  ActivityType.OpenEndedQuestions,
  ActivityType.FractionOperation,
  ActivityType.TwoUnitsOperation,
  ActivityType.ShapesRendering,
  ActivityType.Crosswords,
  ActivityType.CrosswordsWithPics,
  ActivityType.ShortAnswerQuestionsGame,
  ActivityType.PlaceValuesMatrix,
]);

const placementActivities = new Set<string>([
  ActivityType.CompleteSentencesByDraggingClues,
  ActivityType.CompleteSentencesByDraggingCluesPics,
  ActivityType.CompleteSentencesByDraggingCluesPics2,
  ActivityType.CompleteSentenceByDraggingCluesWithNotes,
  ActivityType.CompleteSentencesByRearranging,
  ActivityType.CompleteSentencesByRearrangingDragging,
  ActivityType.CompleteSentencesByRearrangingDraggingJunior,
  ActivityType.RearrangeTheSteps,
  ActivityType.RearrangeStepsVertically,
  ActivityType.RearrangeStepsVerticallyEightRows,
  ActivityType.ArrangeSteps,
  ActivityType.RearrangeLettersInWords,
  ActivityType.RearrangeLettersInWordsGame,
  ActivityType.MissingLettersWords,
  ActivityType.PatternMatching,
  ActivityType.MagicSquare,
  ActivityType.MagicSquare4x4,
  ActivityType.ArrangeAlphabet,
  ActivityType.AscendingOrderGame,
]);

const matchingActivities = new Set<string>([
  ActivityType.ConnectionWall,
  ActivityType.ConnectionWallPic,
  ActivityType.ConnectionWallPicText,
  ActivityType.ConnectionWallThreeRows,
  ActivityType.ConnectionWallGames,
  ActivityType.PictureTextMatching,
  ActivityType.TextTextMatching,
  ActivityType.PicturePictureMatching,
  ActivityType.PictureTextMatchingSixItems,
  ActivityType.TextTextMatchingSixItems,
  ActivityType.PicturePictureMatchingSixItems,
  ActivityType.MatchingItemsGame,
  ActivityType.MatchingItemsPicturesGame,
  ActivityType.MatchingWithLetters,
  ActivityType.LabelTheDiagram,
  ActivityType.LabelTheDiagramCheckbox,
  ActivityType.ItemsLabelingWithClues,
  ActivityType.ItemsLabelingWithoutClues,
  ActivityType.ItemsLabelingWithoutCluesGame,
  ActivityType.ComparingQuantitiesDragging,
]);

const toggleGridActivities = new Set<string>([
  ActivityType.TableCheckBoxes,
  ActivityType.SingleCheckTable,
]);

const abacusActivities = new Set<string>([
  ActivityType.AbacusActivity,
  ActivityType.AbacusReverse,
]);

export const getActivityAriaLiveBehavior = (
  activityDescription?: string | null,
): ActivityAriaLiveBehavior => {
  if (!activityDescription) return "hybrid";
  if (selectionActivities.has(activityDescription)) return "selection";
  if (typingActivities.has(activityDescription)) return "typing";
  if (placementActivities.has(activityDescription)) return "placement";
  if (matchingActivities.has(activityDescription)) return "matching";
  if (toggleGridActivities.has(activityDescription)) return "toggle-grid";
  if (abacusActivities.has(activityDescription)) return "abacus";
  return "hybrid";
};
