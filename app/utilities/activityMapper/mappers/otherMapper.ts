import { ActivityType } from "@/types/activity-types";
import {
  HiddenWords,
  CompleteMatrix,
  AbacusActivity,
  TableCheckBoxes,
  LabelTheDiagram,
  SingleCheckTable,
  RearrangeTheSteps,
  CrosswordActivity,
  ComprehensionJunior,
  ComparingQuantities,
  NumberMatrixActivity,
  ArrangeStepsActivity,
  AbacusReverseActivity,
  MissingValuesActivity,
  TableCheckBoxesFilling,
  ItemsLabellingActivity,
  CountingObjectsActivity,
  StrikeOutOddOneActivity,
  RearrangeLettersInWords,
  MultipleChoiceWithNotes,
  ShapesRenderingActivity,
  MissingLettersWords,
  PlaceValuesMatrixActivity,
  MissingValuesJuniorActivity,
  MatchingWithLettersActivity,
  CountingMixedObjectsActivity,
  OpenEndedQuestions,
  CompleteParagraphWithCluesJunior,
  CompleteParagraphWithoutClues,
  RearrangeStepsVerticallyActivity,
  MatchingItemsPictureTextActivity,
  ComparingQuantitiesDraggingActivity,
  ComparingQuantitiesLessMoreWithPics,
  PictureOrStoryFollowedByQuestionsActivity,
  PictureOrStoryFollowedByQuestionsTrueFalseActivity,
  PatternMatchingActivity,
  AdditionSubtractionObjectsActivity,
} from "../imports";
import FractionOperationActivity from "~/components/primary-sources/activities/fraction-operation-activity";
import TwoUnitsOperationActivity from "~/components/primary-sources/activities/two-units-operation-activity";
import MagicSquare from "~/components/primary-sources/activities/magic-square";

export const otherMapper = {
  // Rearranging Steps Activities
  [ActivityType.RearrangeTheSteps]: RearrangeTheSteps,
  [ActivityType.RearrangeStepsVertically]: RearrangeStepsVerticallyActivity,
  [ActivityType.RearrangeStepsVerticallyEightRows]:
    RearrangeStepsVerticallyActivity,
  [ActivityType.ArrangeSteps]: ArrangeStepsActivity,

  // Complete Matrix Activities
  [ActivityType.CompleteMatrix]: CompleteMatrix,
  [ActivityType.CompleteMatrixTwoRows]: CompleteMatrix,

  // Comprehension Junior Activities & alikes
  [ActivityType.ComprehensionJuniorOne]: ComprehensionJunior,
  [ActivityType.ComprehensionJuniorTwo]: ComprehensionJunior,
  [ActivityType.PictureOrStoryFollowedByQuestionsTrueFalse]:
    PictureOrStoryFollowedByQuestionsTrueFalseActivity,
  [ActivityType.PictureOrStoryFollowedByQuestions]:
    PictureOrStoryFollowedByQuestionsActivity,

  // Items Labelling Activities
  [ActivityType.LabelTheDiagram]: LabelTheDiagram,
  [ActivityType.LabelTheDiagramCheckbox]: LabelTheDiagram,
  [ActivityType.ItemsLabelingWithClues]: ItemsLabellingActivity,
  [ActivityType.ItemsLabelingWithoutClues]: ItemsLabellingActivity,
  [ActivityType.ItemsLabelingWithoutCluesGame]: ItemsLabellingActivity,

  // Matching Items Activities
  [ActivityType.PictureTextMatching]: MatchingItemsPictureTextActivity,
  [ActivityType.TextTextMatching]: MatchingItemsPictureTextActivity,
  [ActivityType.PicturePictureMatching]: MatchingItemsPictureTextActivity,
  [ActivityType.PictureTextMatchingSixItems]: MatchingItemsPictureTextActivity,
  [ActivityType.TextTextMatchingSixItems]: MatchingItemsPictureTextActivity,
  [ActivityType.PicturePictureMatchingSixItems]:
    MatchingItemsPictureTextActivity,
  [ActivityType.MatchingItemsGame]: MatchingItemsPictureTextActivity,
  [ActivityType.MatchingItemsPicturesGame]: MatchingItemsPictureTextActivity,

  // Maths Activities
  [ActivityType.CountingObjects]: CountingObjectsActivity,
  [ActivityType.AdditionSubtractionObjects]: AdditionSubtractionObjectsActivity,

  // Fraction Operation Activity
  [ActivityType.FractionOperation]: FractionOperationActivity,

  // Two Units Operation Activity
  [ActivityType.TwoUnitsOperation]: TwoUnitsOperationActivity,

  // Other Activities
  [ActivityType.HiddenWords]: HiddenWords,
  [ActivityType.HiddenWordsGame]: HiddenWords,
  [ActivityType.Crosswords]: CrosswordActivity,
  [ActivityType.CrosswordsWithPics]: CrosswordActivity,
  [ActivityType.CrosswordWordsGame]: CrosswordActivity,
  [ActivityType.TableCheckBoxes]: TableCheckBoxes,
  [ActivityType.TableCheckBoxesFilling]: TableCheckBoxesFilling,
  [ActivityType.TableCheckBoxesFillingPic]: TableCheckBoxesFilling,
  [ActivityType.SingleCheckTable]: SingleCheckTable,
  [ActivityType.MultipleChoiceWithNotes]: MultipleChoiceWithNotes,
  [ActivityType.CompleteParagraphWithCluesJunior]:
    CompleteParagraphWithCluesJunior,
  [ActivityType.CompleteParagraphWithoutClues]: CompleteParagraphWithoutClues,
  [ActivityType.MatchingWithLetters]: MatchingWithLettersActivity,
  [ActivityType.CountingMixedObjects]: CountingMixedObjectsActivity,
  [ActivityType.MissingValues]: MissingValuesActivity,
  [ActivityType.MissingValuesJunior]: MissingValuesJuniorActivity,
  [ActivityType.NumberMatrix]: NumberMatrixActivity,
  [ActivityType.AbacusActivity]: AbacusActivity,
  [ActivityType.AbacusReverse]: AbacusReverseActivity,
  [ActivityType.PlaceValuesMatrix]: PlaceValuesMatrixActivity,
  [ActivityType.FractionShapes]: ShapesRenderingActivity,
  [ActivityType.ShapesRendering]: ShapesRenderingActivity,
  [ActivityType.ComparingQuantities]: ComparingQuantities,
  [ActivityType.ComparingQuantitiesDragging]:
    ComparingQuantitiesDraggingActivity,
  [ActivityType.ComparingQuantitiesLessMoreWithPics]:
    ComparingQuantitiesLessMoreWithPics,
  [ActivityType.RearrangeLettersInWords]: RearrangeLettersInWords,
  [ActivityType.RearrangeLettersInWordsGame]: RearrangeLettersInWords,
  [ActivityType.MissingLettersWords]: MissingLettersWords,

  // Strike Out Activities
  [ActivityType.StrikeOutOddOne]: StrikeOutOddOneActivity,

  // Open Ended Questions
  [ActivityType.OpenEndedQuestions]: OpenEndedQuestions,

  // Magic Square Activities
  [ActivityType.MagicSquare]: MagicSquare,
  [ActivityType.MagicSquare4x4]: MagicSquare,

  // Pattern Matching Activities
  [ActivityType.PatternMatching]: PatternMatchingActivity,
};
