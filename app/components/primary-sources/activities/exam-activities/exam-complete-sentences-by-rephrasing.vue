<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import ActivityTitle from "~/components/templates/activity-title";
import QuestionRenderer from "~/components/primary-sources/activity-helpers/question-renderer.vue";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { ActivityType } from "~/types/activity-types";
import { cn, toRoman } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamCompleteSentencesByRephrasingProps = {
  questions: {
    title: string;
    fontSize?: number;
    algorithm: ActivityType;
    questions: {
      id: string;
      question: string;
      answer: string[];
      image?: string | null;
    }[];
    options?: string[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamCompleteSentencesByRephrasingProps>();

const answerChecker = new AnswerChecker();
const ui = useActivityUiText();
const { width } = useWindowSize();
const { collectAnswers, updateActivityScore } = useExamContext();

const answers = ref<Record<string, string>>({});
const totalQuestions = computed(() => props.questions.questions.length);
const activityInstructionsId = "exam-complete-sentences-rephrasing-instructions";
const activityOptionsId = "exam-complete-sentences-rephrasing-options";
const activityStatusId = "exam-complete-sentences-rephrasing-status";
const keyboardStatusMessage = ref("");
const fontSizeStyle = computed(() => ({
  fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : "20px",
}));

const checkAnswer = (userAnswer: string, question: { answer: string[] }) => {
  const userAnswers = userAnswer
    .split("|")
    .map((answer) => answer.trim().toLowerCase())
    .filter((answer, index, allAnswers) => answer !== "" || index < allAnswers.length);

  const correctAnswers = question.answer.map((answer) => answer.toLowerCase());

  return (
    (props.questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
      props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices ||
      userAnswers.length === correctAnswers.length) &&
    userAnswers.every((answer, index) =>
      answerChecker.checkAnswer(answer, {
        acceptedAnswers :
          props.questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
          props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
            ? correctAnswers
            : [correctAnswers[index]] as string[],
        strictMode: true,
      }).isCorrect,
    )
  );
};

const calculateScore = () => {
  let score = 0;
  const detailedAnswers: QuestionAnswer[] = [];

  props.questions.questions.forEach((question) => {
    const userAnswer = answers.value[question.id] || "";
    const isCorrect = checkAnswer(userAnswer, question);

    if (isCorrect) {
      score++;
    }

    detailedAnswers.push({
      questionId: question.id,
      userAnswer,
      correctAnswer: question.answer.join("| "),
      isCorrect,
      question: question.question,
      options: props.questions.options || [],
    });
  });

  return { score, answers: detailedAnswers };
};

const getCurrentAnswers = (questionId: string) =>
  (answers.value[questionId] || "").split("|");

const handleInputChange = (questionId: string, blankIndex: number, value: string | number) => {
  if (props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices) {
    answers.value = {
      ...answers.value,
      [questionId]: String(value ?? ""),
    };
    const questionIndex = props.questions.questions.findIndex((question) => question.id === questionId);
    if (questionIndex !== -1) {
      keyboardStatusMessage.value = ui.formatActivityUpdated(ui.formatQuestion(questionIndex + 1), value);
    }
    return;
  }

  const currentAnswers = getCurrentAnswers(questionId);
  while (currentAnswers.length <= blankIndex) {
    currentAnswers.push("");
  }

  currentAnswers[blankIndex] = String(value ?? "");

  answers.value = {
    ...answers.value,
    [questionId]: currentAnswers.join("|"),
  };
  const questionIndex = props.questions.questions.findIndex((question) => question.id === questionId);
  if (questionIndex !== -1) {
    keyboardStatusMessage.value = ui.formatActivityUpdated(ui.formatQuestion(questionIndex + 1), value);
  }
};

watch(
  answers,
  () => {
    const answeredCount = Object.values(answers.value).filter((answer) => answer.trim() !== "").length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
  },
  { deep: true },
);

watch(
  [answers, collectAnswers],
  () => {
    if (!collectAnswers.value) return;

    const { score, answers: detailedAnswers } = calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
      answers: detailedAnswers,
    });
  },
  { deep: true },
);
</script>

<template>
  <section
    class="flex h-full flex-col rounded-b-xl bg-white shadow-sm"
    :style="fontSizeStyle"
    aria-labelledby="exam-complete-sentences-rephrasing-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="exam-complete-sentences-rephrasing-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kufika kwenye chaguo na nafasi za kujaza. Andika jibu lako katika kila nafasi."
          : "Use Tab to move to the answer choices and blanks. Type your answer in each blank."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>
    <div
      v-if="
        props.questions.options?.length &&
        props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
      "
      class="p-4 pb-2"
    >
      <div
        :id="activityOptionsId"
        class="flex w-fit flex-wrap gap-2 rounded border-2 border-picton-blue-300 bg-picton-blue-100 py-4"
        role="group"
        :aria-label="ui.availableAnswerChoices.value"
      >
        <div
          v-for="option in props.questions.options"
          :key="option"
          class="px-3 leading-4 text-picton-blue-700"
          tabindex="0"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
        >
          {{ option }}
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 md:p-4">
      <div class="space-y-8" role="list" :aria-label="ui.completeSentenceQuestions.value">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="question.id"
          class="rounded-lg border bg-neutral-50 p-2 focus-within:ring-2 focus-within:ring-picton-blue-400 md:flex-1"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`exam-complete-sentences-question-${question.id}`"
          :aria-describedby="question.image ? `exam-complete-sentences-image-${question.id}` : undefined"
        >
          <div class="flex flex-col items-center justify-between md:flex-row md:gap-2">
            <div class="flex min-w-0 flex-1 items-start gap-2 md:gap-3">
              <p
                :id="`exam-complete-sentences-question-${question.id}`"
                :class="
                  cn(
                    'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold md:h-8 md:w-8',
                    (answers[question.id] || '').trim() !== ''
                      ? 'bg-picton-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600',
                  )
                "
              >
                {{ toRoman(questionIndex + 1) }}
              </p>
              <div class="min-w-0 flex-1 leading-loose">
                <QuestionRenderer
                  :question="question.question"
                  :answers="question.answer"
                  :user-answers="getCurrentAnswers(question.id)"
                  :screen-width="width ?? 1024"
                  @blank-change="(bi, val) => handleInputChange(question.id, bi, val)"
                />
              </div>
            </div>

            <div v-if="question.image" class="h-32 min-w-[150px] md:h-28">
              <img
                :src="question.image"
                :alt="question.question"
                :id="`exam-complete-sentences-image-${question.id}`"
                class="h-full w-full rounded-lg object-cover"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="
        props.questions.options?.length &&
        props.questions.algorithm !== ActivityType.CompleteSentenceByRephrasingWithChoices
      "
      class="space-y-1 border-t bg-white p-4 py-2"
    >
      <h3 class="font-semibold text-picton-blue-700">{{ ui.availableAnswerChoices }}</h3>
      <div
        :id="activityOptionsId"
        class="flex w-fit flex-wrap gap-2 rounded bg-picton-blue-100 py-4"
        role="group"
        :aria-label="ui.availableAnswerChoices.value"
      >
        <div
          v-for="option in props.questions.options"
          :key="option"
          class="px-3 leading-4 text-picton-blue-700"
          tabindex="0"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
        >
          {{ option }}
        </div>
      </div>
    </div>
  </section>
</template>
