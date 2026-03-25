import type { DefineComponent } from "vue";
import type { ServerQuestionType } from "./activity-props";

export type FeedbackType = "wrong-correct" | "wrong-correct-answers" | "none";

export type ActivityComponentProps = {
  feedback?: FeedbackType;
  questions: any;
  isExamMode?: boolean;
  activityId?: number;
  userId?: number;
  autoSaveAnswers?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: any[],
    savedAnswers?: any[],
  ) => void;
  onAnswerRecorded?: (
    questionIndex: number,
    answer: any,
    isCorrect?: boolean,
  ) => void;
};

export type Activity = {
  uuid: string;
  id: number;
  activityId: string;
  activityName: string;
  description: ActivityType;
  activityDescription: string;
  topicId: string;
  played: boolean;
  subTopic: string;
  verified: string;
  topicUuid: string;
  questions: ServerQuestionType[];
  summary: string | null;
  summaryPath: string | null;
};

export type ActivityQuestion = Pick<
  Activity,
  | "id"
  | "activityName"
  | "activityDescription"
  | "description"
  | "subTopic"
  | "verified"
  | "played"
> & {
  questions: ServerQuestionType[];
};


export type ActivityMapper = {
  [key in ActivityType]?: Component<ActivityComponentProps>;
};

export enum ActivityType {
  // Dialog Activities
  DialogDifferences = "Dialog Differences",
  DialogOneSideFixed = "Dialog one side fixed",

  // In Which Box Activities
  InWhichBox = "In Which Box",
  InWhichBoxPics = "In Which Box Pics",
  InWhichBoxTwoBoxes = "In Which Box Two Boxes",
  InWhichBoxPicsTwoBoxes = "In Which Box Pics Two Boxes",
  InWhichBoxMixedThreeBoxes = "In which box mixed 3 boxes",
  InWhichBoxPicsTwoBoxesSixItems = "In Which Box Pics Two Boxes Six Items",
  InWhichBoxMixedTwoBoxesSixItems = "In Which Box Mixed Two Boxes Six Items",

  // Comprehension Junior Activities & alikes
  ComprehensionJuniorOne = "Comprehension junior one",
  ComprehensionJuniorTwo = "Comprehension junior two",
  PictureOrStoryFollowedByQuestionsTrueFalse = "Picture or Story followed by Questions True/False",
  PictureOrStoryFollowedByQuestions = "Picture or Story followed by Questions",

  // Connection Wall Activities
  ConnectionWall = "Connection Wall",
  ConnectionWallPic = "Connection wall Pic",
  ConnectionWallPicText = "Connection Wall Pic & Text",
  ConnectionWallThreeRows = "Connection wall three rows",
  ConnectionWallGames = "Connection wall Games",

  // Complete Sentences Activities
  CompleteSentencesByClicking = "Complete sentences by clicking",
  CompleteSentencesByRephrasing = "Complete sentences by rephrasing",
  CompleteSentencesWithFourClauses = "Complete sentences four clouses",
  CompleteSentencesWithTwoClauses = "Complete sentences with two clauses",
  CompleteSentencesByDraggingClues = "Complete sentences by dragging clues",
  CompleteSentencesByDraggingCluesPics = "Complete sentences by dragging clues - pics",
  CompleteSentencesByDraggingCluesPics2 = "Complete sentences by dragging clues - pics 2",
  CompleteSentencesByRearranging = "Complete sentences by rearranging",
  CompleteSentencesByRearrangingDragging = "Complete Sentences by Rearranging Dragging",
  CompleteSentencesByRearrangingDraggingJunior = "Complete sentences by rearranging dragging Junior",
  CompleteSentencesBySelectingClues = "Complete sentences by selecting clues",
  CompleteSentencesWithThreeClauses = "Complete sentences with three clauses",
  CompleteSentencesByClickingSpecifics = "Complete sentences by clicking specifics",
  CompleteSentencesBySelectingCorrectOnes = "Complete sentences by selecting correct ones",
  CompleteSentenceByDraggingCluesWithNotes = "Complete Sentence By Dragging Clues With Notes",
  CompleteSentenceByRephrasingWithChoices = "Complete the sentences by rephrasing with choices",
  CompleteSentencesTwoFieldsNoClues = "Complete sentences two fields no clues",
  CompleteSentencesByRephrasingTwoFields = "Complete sentences by rephrasing two fields",

  // Labelling Activities
  LabelTheDiagram = "Label the diagram",
  LabelTheDiagramCheckbox = "Label the diagram checkbox",
  ItemsLabelingWithClues = "Items labeling with clues",
  ItemsLabelingWithoutClues = "Items labeling without clues",
  ItemsLabelingWithoutCluesGame = "Items labeling without clues Game",

  // Rerranging Steps Activities
  RearrangeStepsVertically = "Rearrange the steps vertically",
  RearrangeStepsVerticallyEightRows = "Rearrange the steps vertically eight rows",
  RearrangeTheSteps = "Rearrange the steps",
  ArrangeSteps = "Rearrange steps with notes vertical",
  RearrangeLettersInWords = "Rearrange Letters in Words",
  RearrangeLettersInWordsGame = "Rearrange Letters in Words Game",
  MissingLettersWords = "Missing Letters Words",

  // Matching Items Activities
  PictureTextMatching = "Picture-Text Matching",
  TextTextMatching = "Text-Text Matching",
  PicturePictureMatching = "Picture-Picture Matching",
  PictureTextMatchingSixItems = "Picture-Text Matching Six Items",
  TextTextMatchingSixItems = "Text-Text Matching Six Items",
  PicturePictureMatchingSixItems = "Picture-Picture Matching Six Items",
  MatchingItemsGame = "Matching items game",
  MatchingItemsPicturesGame = "Matching items pictures game",

  // Maths Activities
  CountingObjects = "Counting objects",
  AdditionSubtractionObjects = "Addition and subtraction of objects",

  // Fraction Operation Activity
  FractionOperation = "Fraction operation",

  // Two Units Operation Activity
  TwoUnitsOperation = "Two units operation",

  // Other Activities
  HiddenWords = "Hidden Words",
  HiddenWordsGame = "Hidden Words Game",
  CompleteMatrix = "Complete Matrix",
  CrosswordsWithPics = "Crosswords With Pics",
  CrosswordWordsGame = "Crossword words Game",
  NumberMatrix = "Number matrix",
  MissingValues = "Missing Values",
  MissingValuesJunior = "Missing values Junior",
  TableCheckBoxes = "Table checkboxes",
  TableCheckBoxesFilling = "Table checkboxes filling",
  TableCheckBoxesFillingPic = "Table checkboxes filling Pic",
  MatchingWithLetters = "Matching with letters",
  CompleteMatrixTwoRows = "Complete Matrix Two Rows",
  MultipleChoiceWithNotes = "Multiple choice with notes",
  CountingMixedObjects = "Counting mixed objects",
  CompleteParagraphWithCluesJunior = "Complete paragraph with clues junior",
  CompleteParagraphWithoutClues = "Complete Paragraph Without Clues",
  AbacusActivity = "Abacus General",
  AbacusReverse = "Abacus Reverse General",
  PlaceValuesMatrix = "Place Values Matrix",
  ShapesRendering = "Geometry Calculation",
  FractionShapes = "Fraction Shapes",
  Crosswords = "Crosswords",
  SingleCheckTable = "Object Properties Two Columns",
  ComparingQuantitiesDragging = "Comparing quantities by dragging",
  ComparingQuantities = "Comparing quantities",
  ComparingQuantitiesLessMoreWithPics = "Comparing quantity Less More Same With Pics",

  // Strike Out Activities
  StrikeOutOddOne = "Strike out the odd one",

  // Game Activities
  MultipleChoiceGameActivity = "Multiple choice game",
  MissingDefinitionsGameActivity = "Missing definitions 60",
  ShortAnswerQuestionsGame = "Short answer questions game",
  AscendingOrderGame = "Ascending order game",

  // Magic Square Activities
  MagicSquare = "Magic Square",
  MagicSquare4x4 = "Magic Square 4x4",

  // Pattern Matching Activities
  PatternMatching = "Pattern matching",

  // Arrange Alphabet Activities
  ArrangeAlphabet = "Arrange alphabet",

  // Open-ended Activities
  OpenEndedQuestions = "Open ended questions",
}
