<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ActivityTitle from "~/components/templates/activity-title";
// import Input from "~/components/ui/inputs/input";
import { cn } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamRearrangeStepsVerticallyProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      text: string;
      order: number;
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamRearrangeStepsVerticallyProps>();

const ui = useActivityUiText();
const order = ref<Record<string, string>>({});
const activityInstructionsId = "exam-rearrange-steps-instructions";

const { collectAnswers, updateActivityScore } = useExamContext();

const totalQuestions = computed(() => props.questions.questions.length);

const calculateScore = () => {
  let score = 0;
  const answers: QuestionAnswer[] = [];

  props.questions.questions.forEach((question) => {
    const userAnswer = order.value[question.id] || "";
    const isCorrect = userAnswer !== "" && Number(userAnswer) === question.order;

    if (isCorrect) {
      score++;
    }

    answers.push({
      questionId: question.id,
      userAnswer,
      correctAnswer: question.order.toString(),
      isCorrect,
      question: question.text,
      options: [],
    });
  });

  return { score, answers };
};

watch(
  order,
  () => {
    const answeredCount = Object.values(order.value).filter((value) => value.trim() !== "").length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
  },
  { deep: true },
);

watch(
  [order, collectAnswers],
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

const handleChange = (questionId: string, value: string) => {
  if (value === "") {
    order.value = {
      ...order.value,
      [questionId]: "",
    };
    return;
  }

  if (!Number.isNaN(Number(value)) && Number(value) > 0 && Number(value) <= totalQuestions.value) {
    order.value = {
      ...order.value,
      [questionId]: value,
    };
  }
};
</script>

<template>
  <section
    class="flex h-full flex-col rounded-xl bg-white shadow-sm"
    aria-labelledby="exam-rearrange-steps-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="exam-rearrange-steps-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila hatua na andika namba ya mpangilio sahihi."
          : "Use Tab to move through each step and enter its correct order number."
      }}
    </p>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-4" role="list" :aria-label="ui.sentenceRearrangeQuestions.value">
        <div
          v-for="question in props.questions.questions"
          :key="question.id"
          class="rounded-lg border bg-gray-50 p-4 focus-within:ring-2 focus-within:ring-picton-blue-400"
          role="listitem"
        >
          <div class="flex items-center gap-4">
            <div class="relative flex-shrink-0">
              <Input
                type="number"
                min="1"
                :max="totalQuestions.toString()"
                remove-arrows
                :model-value="order[question.id] || ''"
                placeholder=""
                :aria-label="ui.isSwahili ? `Mpangilio wa hatua: ${question.text}` : `Step order for: ${question.text}`"
                :class="
                  cn(
                    'h-16 w-16 text-center text-2xl font-bold border-2',
                    (order[question.id] || '').trim() !== ''
                      ? 'border-picton-blue-500 bg-picton-blue-100 text-picton-blue-700'
                      : 'border-gray-300 bg-gray-100 text-gray-600',
                  )
                "
                @update:model-value="(value: any) => handleChange(question.id, String(value ?? ''))"
              />
            </div>

            <div class="flex-1">
              <p class="text-lg leading-relaxed text-gray-800">
                {{ question.text }}
              </p>
            </div>

            <div
              :class="
                cn(
                  'h-4 w-4 flex-shrink-0 rounded-full',
                  (order[question.id] || '').trim() !== ''
                    ? 'bg-picton-blue-500'
                    : 'bg-gray-200',
                )
              "
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
