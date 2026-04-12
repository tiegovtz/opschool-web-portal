<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import questionsAnswers from "./questionsAnswers.vue";
import type { Choice, Question } from "~/types/question.interface";
import type {
  QuizAttemptPayload,
  QuizAttemptSessionPayload,
} from "~/types/recommendation.interface";
import {
  buildChapterQuizId,
  buildStableQuestionId,
  getChapterQuestionType,
} from "~/utilities/learnerProgressHistory";
import { resolveEducationLevelFromRoute } from "~/utilities/educationRoute";
import { generateSuggestion } from "~/utilities/linkfy.helper";

// define Props
const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
  isAttemptingQuiz: {
    type: Boolean,
    default: false,
  },
  topicLanguage: { type: String, default: "English" },
  chaptersList: Number,
  chaptersNumber: Number,
  changeChapter: Function,
  chapterId: String,
  topicId: String,
  subjectId: String,
  levelId: String,
});

type QuestionAnsweredPayload = {
  isCorrect: boolean;
  selectedChoice: string;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  blankStatuses?: boolean[];
};

type RecordedAnswer = {
  selectedChoice: string;
  isCorrect: boolean;
  blankStatuses: boolean[];
};

// Define states
const quizAttempt = reactive({
  totalQuestions: 0,
  answeredQuestions: 0,
  currentQuestion: 0,
  scored: 0,
  isAttempting: false,
  clickedAnswer: [] as string[],
  quizCompleted: false, // New property to track if the quiz is completed
});
const { snapshotId: activeRecommendationSnapshotId } =
  useRecommendationSnapshot();
const questionAttempts = ref<(QuizAttemptPayload | undefined)[]>([]);
const quizStartedAt = ref<string | null>(null);
const recordedAnswers = ref<RecordedAnswer[]>([]);
const shuffleList = <T>(items: T[]) =>
  [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
const route = useRoute();
const shuffledQuestions = ref<Question[]>([]);
const isSecondaryQuiz = computed(
  () => resolveEducationLevelFromRoute(route) !== "primary",
);

// Result Scored Computed
const scoredComputed = computed(() => {
  return (quizAttempt.scored / quizAttempt.totalQuestions) * 100;
});

// Motivation Messages
const getMotivationMessage = (score: number) => {
  if (score >= 81) return "Excellent! Keep it up! 🎉";
  if (score >= 61) return "Great job! Aim higher! 💪";
  if (score >= 41) return "Good effort! Keep improving! 🌟";
  if (score >= 21) return "Don't give up! Keep practicing! 🚀";
  return "Keep trying! You can do it! 🔥";
};

// Function to set color based on score
const getScoreColor = (score: number) => {
  return {
    "text-green-500": score >= 81, // Excellent
    "text-blue-500": score >= 61 && score < 81, // Great
    "text-yellow-500": score >= 41 && score < 61, // Good
    "text-orange-500": score >= 21 && score < 41, // Needs improvement
    "text-red-500": score < 21, // Low score
  };
};

// Reset All Quiz
const startQuizSession = () => {
  quizStartedAt.value = new Date().toISOString();
  questionAttempts.value = [];
};

const prepareQuizQuestions = () => {
  shuffledQuestions.value = shuffleList(props.questions as Question[]);
};

const resetQuiz = () => {
  quizAttempt.totalQuestions = props.questions.length;
  quizAttempt.answeredQuestions = 0;
  quizAttempt.currentQuestion = 0;
  quizAttempt.scored = 0;
  quizAttempt.isAttempting = false;
  quizAttempt.quizCompleted = false;
  quizAttempt.clickedAnswer = [];
  recordedAnswers.value = [];
  prepareQuizQuestions();
  startQuizSession();
};

// Quize Attempt Answered Questions Function
const answeredAttempt = async (result: QuestionAnsweredPayload) => {
  const currentIndex = quizAttempt.currentQuestion;
  const currentQuestion = shuffledQuestions.value[quizAttempt.currentQuestion];
  const previousAnswer = recordedAnswers.value[currentIndex];

  if (currentQuestion && props.chapterId) {
    questionAttempts.value[currentIndex] = {
      topicId: props.topicId ?? null,
      subjectId: props.subjectId ?? null,
      levelId: props.levelId ?? null,
      chapterId: props.chapterId,
      videoId: null,
      sourceType: "chapter_quiz",
      sourceId: props.chapterId,
      recommendationSnapshotId: activeRecommendationSnapshotId.value ?? null,
      quizId: buildChapterQuizId(props.chapterId),
      questionId: buildStableQuestionId({
        chapterId: props.chapterId,
        questionId: currentQuestion._id ?? null,
        questionNumber: currentQuestion.number,
        questionText: currentQuestion.question,
      }),
      questionType: getChapterQuestionType(currentQuestion),
      questionText: currentQuestion.question,
      selectedAnswer: result.selectedChoice,
      correctAnswer: currentQuestion.answer,
      isCorrect: result.isCorrect,
      scoreEarned: result.isCorrect ? 1 : 0,
      maxScore: 1,
      percentage: result.isCorrect ? 100 : 0,
      timeSpentSeconds: result.timeSpentSeconds,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      metadata: {
        chapterQuestionNumber: String(currentQuestion.number ?? ""),
      },
    };
  }

  quizAttempt.clickedAnswer[currentIndex] = result.selectedChoice;
  recordedAnswers.value[currentIndex] = {
    selectedChoice: result.selectedChoice,
    isCorrect: result.isCorrect,
    blankStatuses: result.blankStatuses ?? [],
  };

  if (previousAnswer?.isCorrect) {
    quizAttempt.scored--;
  }

  if (result.isCorrect) {
    quizAttempt.scored++;
  }

  if (!previousAnswer) {
    quizAttempt.answeredQuestions++;
  }
};

// shuffle Questions
// Set total questions when component mounts
onMounted(() => {
  quizAttempt.totalQuestions = props.questions.length;
  prepareQuizQuestions();
  startQuizSession();
});

// Watch for quiz completion
watch(
  () => quizAttempt.answeredQuestions,
  async (newQues) => {
    if (newQues) {
      if (
        quizAttempt.answeredQuestions === quizAttempt.totalQuestions &&
        quizAttempt.totalQuestions > 0
      ) {
        quizAttempt.isAttempting = true;
        quizAttempt.quizCompleted = true; // Set quiz as completed when all questions are answered

        if (!props.chapterId) return;

        const sessionPayload: QuizAttemptSessionPayload = {
          topicId: props.topicId ?? null,
          subjectId: props.subjectId ?? null,
          levelId: props.levelId ?? null,
          chapterId: props.chapterId,
          videoId: null,
          sourceType: "chapter_quiz",
          sourceId: props.chapterId,
          recommendationSnapshotId: activeRecommendationSnapshotId.value ?? null,
          quizId: buildChapterQuizId(props.chapterId),
          totalQuestions: quizAttempt.totalQuestions,
          correctAnswers: quizAttempt.scored,
          totalScore: scoredComputed.value,
          maxScore: 100,
          percentage: scoredComputed.value,
          startedAt: quizStartedAt.value,
          submittedAt: new Date().toISOString(),
        };

        try {
          const [legacyAssessmentResult, sessionResult] = await Promise.allSettled([
            $fetch(
              apiDocs.progressTracking.postQuizAssessment.replace(
                "{chapterId}",
                props.chapterId,
              ),
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
                  "Content-Type": "application/json",
                },
                body: {
                  score: scoredComputed.value,
                },
              },
            ),
            $fetch<any>("/api/progress/quiz-attempt-sessions", {
              method: "POST",
              body: sessionPayload,
            }),
          ]);

          const sessionId =
            sessionResult.status === "fulfilled"
              ? sessionResult.value?.sessionId ||
              sessionResult.value?._id ||
              sessionResult.value?.id ||
              null
              : null;

          const completedAttempts = questionAttempts.value.filter(
            (attempt): attempt is QuizAttemptPayload => Boolean(attempt),
          );

          if (completedAttempts.length > 0) {
            await $fetch("/api/progress/quiz-attempts", {
              method: "POST",
              body: {
                sessionId,
                attempts: completedAttempts,
              },
            });
          }

          if (legacyAssessmentResult.status === "rejected") {
            console.error(
              "Error posting legacy chapter assessment score:",
              legacyAssessmentResult.reason,
            );
          }
        } catch (error) {
          console.error("Error posting chapter quiz attempt history:", error);
        }
      }
    }
  }
);

// watch for questions changes
watch(
  () => props.questions,
  () => {
    resetQuiz();
  }
);

const goToNextQuestion = () => {
  if (quizAttempt.currentQuestion < props.questions.length - 1) {
    quizAttempt.currentQuestion++;
  }
};

const goToPreviousQuestion = () => {
  if (quizAttempt.currentQuestion > 0) {
    quizAttempt.currentQuestion--;
  }
};

const getBlankStatusForQuestion = (index: number) =>
  recordedAnswers.value[index]?.blankStatuses ?? [];

const getDragAnswerParts = (answer: string) =>
  answer ? answer.split("-").filter(Boolean) : [];

const isDragAndDropQuestion = (questionType: string) =>
  questionType === "drag_and_drop";

const isDragAnswerCorrectAt = (questionIndex: number, blankIndex: number) =>
  getBlankStatusForQuestion(questionIndex)[blankIndex] ?? false;

const getChoiceReason = (question: Question, userAnswer: string): string => {
  return question.choices.find(
    (choice: Choice) => choice.value.trim().toLowerCase() === userAnswer.trim().toLowerCase()
  )?.description || '';
};
</script>

<template>
  <section aria-label="your in quiz container ready to attempt it."
    class="flex flex-col items-center justify-center py-4 rounded-md bg-gradient-to-b from-deepBlue to-white center-height">
    <!-- Questions -->
    <div class="container w-full max-w-5xl bg-white rounded-md md:p-8 custom-box-shadow" v-if="isAttemptingQuiz">
      <!-- Close Button -->
      <div class="flex items-center justify-end mb-2">
        <div class="flex items-center justify-center w-8 h-8 p-2 bg-red-500 rounded-full cursor-pointer"
          @click="changeChapter?.('R')">
          <Icon name="formkit:close" size="24" class="font-bold text-white" />
        </div>
      </div>

      <!-- Header and Button -->
      <div class="flex items-center justify-between">
        <h1 class="tracking-wide underline text-large font-bold" v-if="questions.length > 0">
          {{ topicLanguage.toLowerCase().trim() === 'english' ? 'Quiz' : 'Zoezi' }}
        </h1>

        <!-- Answer and Read Notes again and Read Next Topic -->
        <div class="flex items-center justify-end gap-4">
          <!-- Simplified counter display -->
          <p class="flex gap-2 font-bold">
            {{ topicLanguage.toLowerCase().trim() === 'english' ? 'Answered' : 'Uliyojibu' }}
            <span class="font-normal">{{ quizAttempt.answeredQuestions }}/{{ questions.length }}</span>
          </p>
        </div>
      </div>
      <!-- <p v-if="quizAttempt.answeredQuestions !== questions.length" class="my-2">
        Answer all questions.
      </p> -->

      <!-- Outputs or results or Marks -->
      <div v-if="quizAttempt.quizCompleted && quizAttempt.isAttempting" class="w-full">
        <!-- Scores -->
        <div class="flex flex-col items-center w-full mb-4">
          <p>
            {{ topicLanguage.toLowerCase().trim() === 'english' ? 'Total scores:' : 'Alama zote:' }} <b>{{ quizAttempt.scored + '/' + quizAttempt.totalQuestions }}</b>
          </p>
          <p class="flex items-center justify-center flex-1 gap-2 font-bold" :class="getScoreColor(scoredComputed)">
            {{ getMotivationMessage(scoredComputed) }}
          </p>
        </div>

        <!-- Question with Answers -->
        <div class="flex flex-col w-full rounded-lg my-4 shadow-[0px_0px_8px_3px_rgba(0,0,0,0.05)]" v-for="(question, index) in shuffledQuestions" :key="index">
          <div class="flex w-full rounded-lg  p-4">
            <span class="flex rounded-full bg-[#2b7efe] text-white h-6 w-6 p-2 items-center justify-center text-sm">{{
              index + 1 }}</span>
            <div class="pl-4 text-justify flex-1">
              <p class="mb-2">
                {{
                  isDragAndDropQuestion(question.questionType)
                    ? question.question.replace(/(_\$blank)/g, ' __________ ')
                    : question.question
                }}
              </p>
              <p :class="quizAttempt.clickedAnswer[index] == question.answer
                ? 'text-normalGreener'
                : 'text-red-600'
                ">
                <b class="text-black">Your choice:
                </b>
                <template v-if="question.questionType === 'drag_and_drop'">
                  <span v-for="(answerPart, blankIndex) in getDragAnswerParts(quizAttempt.clickedAnswer[index] ?? '')"
                    :key="`${index}-${blankIndex}-${answerPart}`" class="mr-2 capitalize" :class="isDragAnswerCorrectAt(index, blankIndex)
                      ? 'text-normalGreener font-medium'
                      : 'text-red-600 font-medium'">
                    {{ answerPart }}
                    <span class="font-bold">
                      {{ isDragAnswerCorrectAt(index, blankIndex) ? '✓' : '✗' }}
                    </span>
                  </span>
                </template>
                <span v-else :class="{ 'capitalize': isDragAndDropQuestion(question.questionType) }">
                  {{ (quizAttempt.clickedAnswer[index] ?? '').replaceAll('-', ' ,') }}
                </span>
                <span v-if="question.questionType !== 'drag_and_drop'" class="ml-2 font-bold" :class="quizAttempt.clickedAnswer[index] == question.answer
                  ? 'text-normalGreener'
                  : 'text-red-600'">
                  {{ quizAttempt.clickedAnswer[index] == question.answer ? '✓' : '✗' }}
                </span>
              </p>
            </div>
          </div>
          <!-- choice description (reason)-->
          <!--  -->
          <div class="px-4"
            v-if="question.choices.find((choice: Choice) => choice.value === quizAttempt.clickedAnswer[index])?.description?.trim() && getChoiceReason(question, quizAttempt.clickedAnswer[index] ?? '').trim()"
            :aria-label="`Explanation to justify why you answer ${quizAttempt.clickedAnswer[index] == question.answer ? 'correct' : 'incorrect'}`"
            v-html="generateSuggestion(getChoiceReason(question, quizAttempt.clickedAnswer[index] ?? ''), quizAttempt.clickedAnswer[index] == question.answer)">
          </div>
        </div>

        <!-- Read notes again and Read next -->
        <div class="flex items-center justify-end w-full gap-2">
          <small>{{ topicLanguage.toLowerCase().trim() === 'english' ? 'Recommendation:' : 'Pendekezo:' }}</small>
          <button v-if="quizAttempt.quizCompleted" @click="changeChapter?.(
            quizAttempt.scored === quizAttempt.totalQuestions ? 'N' : 'R'
          )"
            class="flex items-center justify-center px-4 py-1 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
            <span class="capitalize">
              {{
                quizAttempt.scored === quizAttempt.totalQuestions
                  ? topicLanguage.toLowerCase().trim() === 'english' ? 'Next quiz':'Zoezi lijalo'
                  : topicLanguage.toLowerCase().trim() === 'english' ? 'Read notes again' :' Soma maudhui tena'
              }}
            </span>
          </button>
        </div>

        <!-- Next and Previous chapter Action -->
        <!-- <div class="flex flex-row-reverse items-center justify-between pt-4"> -->
        <!-- Next Chapter -->
        <!-- <button @click="changeChapter('n')" :disabled="chaptersNumber == chaptersList"
                        :class="{ 'opacity-0': chaptersNumber == chaptersList }"
                        class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                        <p class="flex gap-2 capitalize">Next <span class="hidden md:flex">Chapter</span></p>
                        <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                        </div>
                    </button> -->
        <!-- Previous Chapter -->
        <!-- <button @click="changeChapter('p')" :disabled="chaptersNumber <= 1"
                        :class="{ 'opacity-0': chaptersNumber <= 1 }"
                        class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                        <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="transform rotate-180 text-oceanBlue" />
                        </div>
                        <p class="flex gap-2 capitalize">Previous <span class="hidden md:flex">Chapter</span></p>
                    </button> -->
        <!-- </div> -->
      </div>

      <!-- Use currentQuestion instead of shuffleQuestions to determine which question to display -->
      <questionsAnswers v-else-if="shuffledQuestions.length" @question-answered="answeredAttempt($event)"
        :used-language="topicLanguage"
        @next-question="goToNextQuestion()" @previous-question="goToPreviousQuestion()" :question-type="shuffledQuestions[quizAttempt.currentQuestion]?.questionType ?? 'multiple_choice'
          " :thumbnail="shuffledQuestions[quizAttempt.currentQuestion]?.thumbnail ?? ''"
        :true-answer="shuffledQuestions[quizAttempt.currentQuestion]?.answer ?? ''"
        :choices="shuffledQuestions[quizAttempt.currentQuestion]?.choices ?? []"
        :question="shuffledQuestions[quizAttempt.currentQuestion]?.question ?? ''"
        :number="`${quizAttempt.currentQuestion + 1}`.toString()"
        :answer="shuffledQuestions[quizAttempt.currentQuestion]?.answer ?? ''"
        :initial-selected-choice="quizAttempt.clickedAnswer[quizAttempt.currentQuestion] ?? ''"
        :has-previous-question="quizAttempt.currentQuestion > 0" :reveal-feedback-during-attempt="!isSecondaryQuiz"
        :advance-on-submit="isSecondaryQuiz" :is-last-question="quizAttempt.currentQuestion === questions.length - 1" />
    </div>
  </section>
</template>
