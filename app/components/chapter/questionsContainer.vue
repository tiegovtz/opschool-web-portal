<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import questionsAnswers from "./questionsAnswers.vue";
import type { Choice, Question } from "~/types/question.interface";
import type {
  QuizAttemptPayload,
  QuizAttemptSessionPayload,
} from "~/types/recommendation.interface";
import { generateSuggestion, parseTextAndLinks } from "~/utilities/linkfy.helper";
import {
  buildChapterQuizId,
  buildStableQuestionId,
  getChapterQuestionType,
} from "~/utilities/learnerProgressHistory";

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
const questionAttempts = ref<QuizAttemptPayload[]>([]);
const quizStartedAt = ref<string | null>(null);

const emits = defineEmits(["emitQuizScore"])

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

const resetQuiz = () => {
  // Check Student If Score above 50
  scoredComputed.value < 50
    ? props?.changeChapter?.("R")
    : props?.changeChapter?.("N");
  quizAttempt.totalQuestions = props.questions.length;
  quizAttempt.answeredQuestions = 0;
  quizAttempt.currentQuestion = 0;
  quizAttempt.scored = 0;
  quizAttempt.isAttempting = false;
  quizAttempt.quizCompleted = false;
  quizAttempt.clickedAnswer = [];
  startQuizSession();
};

// Quize Attempt Answered Questions Function
const answeredAttempt = async (result: QuestionAnsweredPayload) => {
  const currentQuestion = shuffleQuestions.value[quizAttempt.currentQuestion];

  if (currentQuestion && props.chapterId) {
    questionAttempts.value.push({
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
    });
  }

  quizAttempt.clickedAnswer.push(result.selectedChoice);

  // If Is answer the question
  if (result.isCorrect) {
    quizAttempt.scored++;
  }

  setTimeout(() => {
    // Increment answered questions only if not already answered
    if (quizAttempt.answeredQuestions < quizAttempt.currentQuestion + 1) {
      quizAttempt.answeredQuestions++;
    }

    // Move to next question if available
    if (quizAttempt.currentQuestion < props.questions.length - 1) {
      quizAttempt.currentQuestion++;
    }
  }, 800);
};

// shuffle Questions
const shuffleQuestions = computed(() => {
  return props.questions
    .map((question) => ({ question, sort: Math.random() })) // Assign a random sort key
    .sort((a, b) => a.sort - b.sort) // Sort by random key
    .map(({ question }) => question) as Question[]; // Extract shuffled choices
});

// Set total questions when component mounts
onMounted(() => {
  quizAttempt.totalQuestions = props.questions.length;
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

          if (questionAttempts.value.length > 0) {
            await $fetch("/api/progress/quiz-attempts", {
              method: "POST",
              body: {
                sessionId,
                attempts: questionAttempts.value,
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

const getChoiceReason = (question: Question,userAnswer:string):string => {
  return question.choices.find(
    (choice: Choice) => choice.value === userAnswer.trim()
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
          Quiz
        </h1>

        <!-- Answer and Read Notes again and Read Next Topic -->
        <div class="flex items-center justify-end gap-4">
          <!-- Simplified counter display -->
          <p class="flex gap-2 font-bold">
            Answered
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
            Total scores: <b>{{ quizAttempt.scored + '/' + quizAttempt.totalQuestions }}</b>
          </p>
          <p class="flex items-center justify-center flex-1 gap-2 font-bold" :class="getScoreColor(scoredComputed)">
            {{ getMotivationMessage(scoredComputed) }}
          </p>
        </div>

        <!-- Question with Answers -->
        <div class="flex items-center w-full gap-20 my-2" v-for="(question, index) in shuffleQuestions" :key="index">
          <div class="flex w-full rounded-lg shadow-[0px_0px_8px_3px_rgba(0,0,0,0.05)] p-4">
            <span class="flex rounded-full bg-[#2b7efe] text-white h-6 w-6 p-2 items-center justify-center text-sm">{{
              index + 1 }}</span>
            <div class="pl-4 text-justify flex-1">
              <p class="mb-2">
                {{
                  question.questionType === 'drag_and_drop'
                    ? question.question.replace(/(_\$blank)/g, ' __________ ')
                    : question.question
                }}
              </p>
              <p :class="quizAttempt.clickedAnswer[index] == question.answer
                ? 'text-normalGreener'
                : 'text-red-600'
                ">
                <b :class="['text-black', { 'capitalize': question.questionType === 'drag_and_drop' }]">Your choice:
                </b>
                <span :class="[question.questionType === 'drag_and_drop' ? 'capitalize' : '']">{{
                  quizAttempt.clickedAnswer[index]?.replaceAll('-', ' ,') }}</span>

                <!-- Mark Tick and Wrong -->
                <span v-if="quizAttempt.clickedAnswer[index] == question.answer"
                  class="font-bold text-normalGreener">✓</span>
                <span v-else class="font-bold text-red-600">✗</span>
              </p>
              <!-- choice description (reason)-->
              <!--  -->
              <div
                v-if="question.choices.find((choice: Choice) => choice.value === quizAttempt.clickedAnswer[index])?.description"
                :aria-label="`Explanation to justify why you answer ${quizAttempt.clickedAnswer[index] == question.answer ? 'correct' : 'incorrect'}`"
                v-html="generateSuggestion(getChoiceReason(question,quizAttempt.clickedAnswer[index] ?? ''),quizAttempt.clickedAnswer[index] == question.answer)"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Read notes again and Read next -->
        <div class="flex items-center justify-end w-full gap-2">
          <small>Recommendation:</small>
          <button v-if="quizAttempt.quizCompleted" @click="resetQuiz()"
            class="flex items-center justify-center px-4 py-1 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
            <span v-if="scoredComputed < 50" class="capitalize">Read notes again</span>
            <span v-else class="capitalize">next</span>
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
      <questionsAnswers v-else-if="shuffleQuestions" @question-answered="answeredAttempt($event)"
        :question-type="shuffleQuestions[quizAttempt.currentQuestion]?.questionType ?? 'multiple_choice'
          " :thumbnail="shuffleQuestions[quizAttempt.currentQuestion]?.thumbnail ?? ''"
        :true-answer="shuffleQuestions[quizAttempt.currentQuestion]?.answer ?? ''"
        :choices="shuffleQuestions[quizAttempt.currentQuestion]?.choices ?? []"
        :question="shuffleQuestions[quizAttempt.currentQuestion]?.question ?? ''"
        :number="`${quizAttempt.currentQuestion + 1}`.toString()"
        :answer="shuffleQuestions[quizAttempt.currentQuestion]?.answer ?? ''" />
    </div>
  </section>
</template>
