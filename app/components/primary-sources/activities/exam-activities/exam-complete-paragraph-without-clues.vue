<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Input } from "~/components/ui/input";
import { cn } from "~/utilities/utils";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamCompleteParagraphWithoutCluesProps = {
  questions: {
    title: string;
    paragraph: string;
    image?: string;
    answers: string[];
    options?: string[];
    withClues: boolean;
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamCompleteParagraphWithoutCluesProps>();

const answerChecker = new AnswerChecker();
const userAnswers = ref<string[]>(Array.from({ length: props.questions.answers.length }, () => ""));

const { collectAnswers, updateActivityScore } = useExamContext();

const totalQuestions = computed(() => props.questions.answers.length);
const paragraphParts = computed(() => props.questions.paragraph.split("___"));

const calculateScore = () => {
  let score = 0;
  const answers: QuestionAnswer[] = [];

  userAnswers.value.forEach((answer, index) => {
    const isCorrect = answerChecker.checkAnswer(answer, {
      acceptedAnswers: [props.questions.answers[index]] as string[],
    }).isCorrect;

    if (isCorrect) {
      score++;
    }

    answers.push({
      questionId: `blank-${index}`,
      userAnswer: answer,
      correctAnswer: props.questions.answers[index] as string,
      isCorrect,
      question: props.questions.paragraph,
      options: props.questions.options || [],
    });
  });

  return { score, answers };
};

watch(
  userAnswers,
  () => {
    const answeredCount = userAnswers.value.filter((answer) => answer.trim() !== "").length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
  },
  { deep: true },
);

watch(
  [userAnswers, collectAnswers],
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

const handleInputChange = (index: number, value: string | number) => {
  const nextAnswers = [...userAnswers.value];
  nextAnswers[index] = String(value ?? "");
  userAnswers.value = nextAnswers;
};
</script>

<template>
  <div class="flex h-full flex-col rounded-xl">
    <div class="h-full min-h-[400px] md:grid md:grid-cols-3">
      <div
        :class="
          cn(
            'col-span-2 flex h-full w-full flex-col gap-2 overflow-auto border-r bg-white p-4 md:rounded-bl-xl',
            { 'md:col-span-3': !props.questions.image },
          )
        "
      >
        <div v-if="props.questions.withClues && props.questions.options?.length">
          <div class="flex w-fit flex-wrap gap-2 rounded border-2 border-picton-blue-300 bg-picton-blue-100 py-4">
            <span
              v-for="option in props.questions.options"
              :key="option"
              class="px-3 text-base leading-4 text-picton-blue-700"
            >
              {{ option }}
            </span>
          </div>
        </div>

        <div class="text-lg leading-loose">
          <template v-for="(part, index) in paragraphParts" :key="`${index}-${part}`">
            <span>{{ part }}</span>
            <span
              v-if="index < paragraphParts.length - 1"
              class="mx-2 inline-block align-middle"
            >
              <Input
                type="text"
                :model-value="userAnswers[index]"
                class="max-w-40 rounded-none border-none bg-transparent text-center !text-lg text-picton-blue-700 focus:bg-picton-blue-50"
                @update:model-value="(value) => handleInputChange(index, value)"
              />
              <div class="border-b border-dashed border-picton-blue-700" />
            </span>
          </template>
        </div>
      </div>

      <div
        v-if="props.questions.image"
        class="flex items-center justify-center rounded-bl-xl rounded-br-xl bg-white p-4 md:rounded-bl-none"
      >
        <img
          :src="props.questions.image"
          alt="Activity illustration"
          class="max-h-[400px] w-full rounded-lg object-contain"
        >
      </div>
    </div>
  </div>
</template>
