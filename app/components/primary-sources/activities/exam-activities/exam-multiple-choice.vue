<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "~/components/ui/button";
import { cn, toRoman } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamMultipleChoiceProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      question: string;
      questionImage?: string;
      options: string[];
      correctAnswer: string;
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamMultipleChoiceProps>();

const selectedAnswers = ref<Record<string, string>>({});

const { playSound } = useSoundEffects();
const { collectAnswers, updateActivityScore } = useExamContext();

const totalQuestions = computed(() => props.questions.questions.length);

const calculateScore = () => {
  let score = 0;
  const answers: QuestionAnswer[] = [];

  props.questions.questions.forEach((question) => {
    const userAnswer = selectedAnswers.value[question.id] || "";
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      score++;
    }

    answers.push({
      questionId: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      question: question.question,
      options: question.options,
    });
  });

  return { score, answers };
};

watch(
  selectedAnswers,
  () => {
    props.onStateUpdate?.(totalQuestions.value, Object.keys(selectedAnswers.value).length);
  },
  { deep: true },
);

watch(
  [selectedAnswers, collectAnswers],
  () => {
    if (!collectAnswers.value) return;

    const { score, answers } = calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
      answers,
    });
  },
  { deep: true },
);

const handleAnswerSelect = (questionId: string, answer: string) => {
  selectedAnswers.value = {
    ...selectedAnswers.value,
    [questionId]: answer,
  };
  playSound("click");
};
</script>

<template>
  <div class="flex h-full flex-col rounded-b-xl bg-white shadow-sm">
    <div class="flex-1 overflow-y-auto p-2 md:p-4">
      <div class="space-y-8">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="question.id"
          class="rounded-lg border bg-gray-50 p-2 md:p-6"
        >
          <div class="flex items-end justify-between gap-6">
            <div class="flex-1">
              <p class="mb-4">
                <span
                  :class="
                    cn(
                      'mr-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      selectedAnswers[question.id]
                        ? 'bg-picton-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600',
                    )
                  "
                >
                  {{ toRoman(questionIndex + 1) }}
                </span>
                <span class="text-lg text-picton-blue-700">
                  {{ question.question }}
                </span>
              </p>

              <div
                v-if="question.questionImage"
                class="mb-2 block max-w-sm md:hidden md:w-1/3 md:mb-0"
              >
                <img
                  :src="question.questionImage"
                  alt="Question image"
                  class="h-auto w-full rounded-lg border object-contain"
                >
              </div>

              <div class="grid gap-2">
                <Button
                  v-for="option in question.options"
                  :key="option"
                  :variant="selectedAnswers[question.id] === option ? 'default' : 'outline'"
                  :class="
                    cn(
                      'h-auto min-h-14 justify-start p-2 text-left font-medium md:p-4',
                      selectedAnswers[question.id] === option
                        ? 'bg-picton-blue-500 text-white hover:bg-picton-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                    )
                  "
                  @click="handleAnswerSelect(question.id, option)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="
                        cn(
                          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                          selectedAnswers[question.id] === option
                            ? 'border-white bg-white'
                            : 'border-gray-400',
                        )
                      "
                    >
                      <div
                        v-if="selectedAnswers[question.id] === option"
                        class="h-2 w-2 rounded-full bg-picton-blue-500"
                      />
                    </div>
                    <p class="text-base text-wrap">{{ option }}</p>
                  </div>
                </Button>
              </div>
            </div>

            <div v-if="question.questionImage" class="hidden w-1/3 max-w-sm md:block">
              <img
                :src="question.questionImage"
                alt="Question image"
                class="h-auto w-full rounded-lg border object-contain"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
