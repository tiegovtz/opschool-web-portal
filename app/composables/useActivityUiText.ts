import { computed } from "vue";
import {
  normalizeLanguageSupport,
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";

export const useActivityUiText = () => {
  const route = useRoute();
  const hubHeaderLang = useHubHeaderLanguage();
  const primaryContentLanguage = usePrimaryContentLanguage();
  const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
  const routeLanguage = computed(() =>
    resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
  );

  const isSwahili = computed(
    () =>
      normalizeLanguageSupport(
        route.query.lang ||
          routeLanguage.value ||
          hubHeaderLang.value ||
          primaryContentLanguage.value,
        "english",
      ) === "kiswahili",
  );

  const checkAnswer = computed(() => (isSwahili.value ? "Kagua jibu" : "Check Answer"));
  const checkAnswers = computed(() => (isSwahili.value ? "Kagua majibu" : "Check Answers"));
  const checkAllAnswers = computed(() =>
    isSwahili.value ? "Kagua majibu yote" : "Check All Answers",
  );
  const answersChecked = computed(() =>
    isSwahili.value ? "Majibu yamekaguliwa" : "Answers Checked",
  );
  const checking = computed(() => (isSwahili.value ? "Inakagua..." : "Checking..."));
  const viewResults = computed(() => (isSwahili.value ? "Tazama matokeo" : "View Results"));
  const nextQuestion = computed(() =>
    isSwahili.value ? "Swali linalofuata" : "Next Question",
  );
  const question = computed(() => (isSwahili.value ? "Swali" : "Question"));
  const correct = computed(() => (isSwahili.value ? "Sahihi" : "Correct"));
  const incorrect = computed(() => (isSwahili.value ? "Si sahihi" : "Incorrect"));
  const correctAnswer = computed(() =>
    isSwahili.value ? "Jibu sahihi:" : "Correct answer:",
  );
  const correctDefinition = computed(() =>
    isSwahili.value ? "Maana sahihi:" : "Correct definition:",
  );
  const correctShape = computed(() =>
    isSwahili.value ? "Umbo sahihi:" : "Correct shape:",
  );
  const correctStep = computed(() =>
    isSwahili.value ? "Hatua sahihi:" : "Correct step:",
  );
  const yourAnswer = computed(() => (isSwahili.value ? "Jibu lako:" : "Your Answer:"));
  const back = computed(() => (isSwahili.value ? "Rudi" : "Back"));
  const nothingToShow = computed(() =>
    isSwahili.value ? "Hakuna cha kuonyesha" : "Nothing to show",
  );
  const loading = computed(() => (isSwahili.value ? "Inapakia..." : "Loading ..."));
  const activityUnavailable = computed(() =>
    isSwahili.value ? "Shughuli hii haipatikani" : "This activity is not available",
  );
  const unknownIssue = computed(() =>
    isSwahili.value ? "Tatizo lisilojulikana limetokea" : "Unknown issue occurred",
  );
  const timesUp = computed(() => (isSwahili.value ? "Muda umeisha!" : "Time's up!"));
  const availableAnswerChoices = computed(() =>
    isSwahili.value ? "Chaguo za majibu zinazopatikana" : "Available answer choices",
  );
  const completeSentenceQuestions = computed(() =>
    isSwahili.value ? "Maswali ya kukamilisha sentensi" : "Complete sentence questions",
  );
  const availableClueWords = computed(() =>
    isSwahili.value ? "Maneno ya vidokezo yanayopatikana" : "Available clue words",
  );
  const sentenceRearrangeQuestions = computed(() =>
    isSwahili.value ? "Maswali ya kupanga upya sentensi" : "Sentence rearrange questions",
  );
  const sentenceRearrangeResults = computed(() =>
    isSwahili.value ? "Matokeo ya kupanga upya sentensi" : "Sentence rearrange results",
  );
  const resultsByQuestion = computed(() =>
    isSwahili.value ? "Matokeo kwa kila swali" : "Results by question",
  );
  const resultEmojiAlt = computed(() =>
    isSwahili.value ? "Picha ya matokeo" : "Result emoji",
  );
  const activityUpdates = computed(() =>
    isSwahili.value ? "Sasisho za shughuli" : "Activity updates",
  );
  const selected = computed(() => (isSwahili.value ? "Imechaguliwa" : "Selected"));
  const updated = computed(() => (isSwahili.value ? "Imesasishwa" : "Updated"));
  const cleared = computed(() => (isSwahili.value ? "Imefutwa" : "Cleared"));
  const activated = computed(() => (isSwahili.value ? "Imewashwa" : "Activated"));
  const placed = computed(() => (isSwahili.value ? "Imewekwa" : "Placed"));
  const removed = computed(() => (isSwahili.value ? "Imeondolewa" : "Removed"));
  const resultsReady = computed(() =>
    isSwahili.value ? "Matokeo yako yako tayari" : "Your results are ready",
  );

  const formatQuestion = (index: number) => `${question.value} ${index}`;
  const formatCorrect = (value?: string | number | null) =>
    value == null || value === ""
      ? `${correct.value}:`
      : `${correct.value}: ${value}`;
  const formatCorrectAnswer = (value?: string | number | null) =>
    value == null || value === ""
      ? correctAnswer.value
      : `${correctAnswer.value} ${value}`;
  const formatIncorrectAnswer = (value?: string | number | null) =>
    value == null || value === ""
      ? incorrect.value
      : isSwahili.value
        ? `Si sahihi. Jibu: ${value}`
        : `Incorrect. Answer: ${value}`;
  const formatQuestionResult = (index: number, isCorrectResult: boolean) =>
    isSwahili.value
      ? `Swali la ${index} ${isCorrectResult ? "ni sahihi" : "si sahihi"}`
      : `Question ${index} ${isCorrectResult ? "correct" : "incorrect"}`;
  const formatActivitySelected = (label: string, value?: string | number | null) =>
    value == null || value === ""
      ? `${label}. ${selected.value}.`
      : `${label}. ${selected.value}: ${value}.`;
  const formatActivityUpdated = (label: string, value?: string | number | null) =>
    value == null || value === ""
      ? `${label}. ${cleared.value}.`
      : `${label}. ${updated.value}: ${value}.`;
  const formatActivityActivated = (label: string) =>
    `${label}. ${activated.value}.`;
  const formatActivityPlaced = (label: string, value?: string | number | null) =>
    value == null || value === ""
      ? `${label}. ${placed.value}.`
      : `${label}. ${placed.value}: ${value}.`;
  const formatActivityRemoved = (label: string, value?: string | number | null) =>
    value == null || value === ""
      ? `${label}. ${removed.value}.`
      : `${label}. ${removed.value}: ${value}.`;

  return {
    isSwahili,
    checkAnswer,
    checkAnswers,
    checkAllAnswers,
    answersChecked,
    checking,
    viewResults,
    nextQuestion,
    question,
    correct,
    incorrect,
    correctAnswer,
    correctDefinition,
    correctShape,
    correctStep,
    yourAnswer,
    back,
    nothingToShow,
    loading,
    activityUnavailable,
    unknownIssue,
    timesUp,
    availableAnswerChoices,
    completeSentenceQuestions,
    availableClueWords,
    sentenceRearrangeQuestions,
    sentenceRearrangeResults,
    resultsByQuestion,
    resultEmojiAlt,
    activityUpdates,
    selected,
    updated,
    cleared,
    activated,
    placed,
    removed,
    resultsReady,
    formatQuestion,
    formatCorrect,
    formatCorrectAnswer,
    formatIncorrectAnswer,
    formatQuestionResult,
    formatActivitySelected,
    formatActivityUpdated,
    formatActivityActivated,
    formatActivityPlaced,
    formatActivityRemoved,
  };
};
