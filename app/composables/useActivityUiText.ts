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
    formatQuestion,
    formatCorrect,
    formatCorrectAnswer,
    formatIncorrectAnswer,
  };
};
