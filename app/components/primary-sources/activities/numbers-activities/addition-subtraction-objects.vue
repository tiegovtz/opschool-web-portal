<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { cn } from "~/utilities/utils";
import { QuantityRenderer } from "./shared";
import AnswerDropZone from "./shared/answer-drop-zone.vue";
import { Button } from "~/components/ui/button";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type AdditionSubtractionObjectsProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      rightNumber: number;
      leftImage: string;
      rightImage?: string;
      operator: string;
      displayAnswer: string;
      answer: number;
      isMultiplicationOrDivision?: boolean;
    }[];
  };
  feedback: FeedbackType;
};

const props = defineProps<AdditionSubtractionObjectsProps>();
const ui = useActivityUiText();

const score = ref(0);
const showResults = ref(false);
const allAnswered = ref(false);
const canSubmit = ref(false);
const questionAnswers = reactive<
  Record<number, { left: string; right: string; result: string }>
>({});
const correctAnswers = ref<string[]>([]);

const { playSound } = useSoundEffects();

const totalQuestions = computed(() => props.questions.questions.length);

const initAnswers = () => {
  props.questions.questions.forEach((_, index) => {
    questionAnswers[index] = { left: "", right: "", result: "" };
  });
};

onMounted(initAnswers);
watch(() => props.questions, initAnswers, { deep: true });

watch(
  () => ({ ...questionAnswers }),
  () => {
    const answered = Object.keys(questionAnswers).filter((key) => {
      const index = Number.parseInt(key, 10);
      const answers = questionAnswers[index] ?? { left: "", right: "", result: "" };
      const question = props.questions.questions[index];
      if (!question) return false;
      if (question.isMultiplicationOrDivision) {
        return !!(answers.left && answers.result);
      }
      return !!(answers.left && answers.right && answers.result);
    }).length;

    canSubmit.value = answered === totalQuestions.value;
  },
  { deep: true },
);

const handleSubmit = () => {
  let totalScore = 0;
  const correct: string[] = [];

  props.questions.questions.forEach((question, index) => {
    const userAnswers = questionAnswers[index] ?? { left: "", right: "", result: "" };
    const isLeftCorrect = Number.parseInt(userAnswers.left, 10) === question.leftNumber;
    const isResultCorrect =
      Number.parseInt(userAnswers.result, 10) === question.answer;

    let isRightCorrect = true;
    if (!question.isMultiplicationOrDivision) {
      isRightCorrect =
        Number.parseInt(userAnswers.right, 10) === question.rightNumber;
    }

    if (isLeftCorrect && isRightCorrect && isResultCorrect) {
      totalScore += 1;
      correct.push(index.toString());
    }
    if (isLeftCorrect) correct.push(`${index}-left`);
    if (isRightCorrect && !question.isMultiplicationOrDivision) correct.push(`${index}-right`);
    if (isResultCorrect) correct.push(`${index}-result`);
  });

  score.value = totalScore;
  correctAnswers.value = correct;
  allAnswered.value = true;
  playSound("success");
};

const handleInputChange = (
  questionIndex: number,
  field: "left" | "right" | "result",
  value: string,
) => {
  const currentAnswer = questionAnswers[questionIndex] ?? {
    left: "",
    right: "",
    result: "",
  };
  questionAnswers[questionIndex] = {
    ...currentAnswer,
    [field]: value,
  };
};

const resetActivity = () => {
  score.value = 0;
  showResults.value = false;
  allAnswered.value = false;
  canSubmit.value = false;
  correctAnswers.value = [];
  initAnswers();
};

const isFieldCorrect = (questionIndex: number, field: string) =>
  correctAnswers.value.includes(`${questionIndex}-${field}`);
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex-1 flex flex-col gap-4 p-4">
      <div class="space-y-6">
        <div
          v-for="(question, index) in props.questions.questions"
          :key="index"
          class="bg-white rounded-lg p-6 mb-6"
        >
          <div class="flex flex-col md:flex-row items-center justify-center gap-4">
            <div class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              <QuantityRenderer
                :count="question.leftNumber"
                :image="question.leftImage"
                :maxItemsPerRow="7"
                className="sm:max-w-[350px] xl:max-w-full flex-wrap"
              />
              <div class="relative w-fit ml-auto mt-2 md:mt-0">
                <AnswerDropZone
                  :id="`${index}-left`"
                  answerType="input"
                  :currentAnswer="questionAnswers[index]?.left || ''"
                  :correctAnswer="question.leftNumber.toString()"
                  :showResults="showResults"
                  placeholder="Count"
                  :onInputChange="(v: string) => handleInputChange(index, 'left', v)"
                  :className="cn('w-[100px] rounded-lg p-2', showResults ? 'border-none' : 'border border-picton-blue-500')"
                />
                <div v-if="showResults && (questionAnswers[index]?.left || '')" class="absolute -top-2 -right-2 z-10">
                  <span
                    class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center"
                    :class="isFieldCorrect(index, 'left') ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ isFieldCorrect(index, "left") ? "✓" : "✕" }}
                  </span>
                </div>
              </div>
            </div>

            <div :class="cn('flex items-center justify-center', { 'min-w-[60px]': question.operator && question.operator.length === 1 })">
              <div class="text-4xl font-bold text-picton-blue-600">{{ question.operator }}</div>
            </div>

            <div v-if="question.isMultiplicationOrDivision" class="bg-gray-50 flex items-center justify-center p-4 rounded-lg border border-gray-200 w-full min-h-[100px]">
              <div class="text-5xl font-bold text-picton-blue-700">{{ question.rightNumber }}</div>
            </div>
            <div v-else class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              <QuantityRenderer
                :count="question.rightNumber"
                :image="question.rightImage || question.leftImage"
                :maxItemsPerRow="7"
                className="sm:max-w-[350px] xl:max-w-full flex-wrap"
              />
              <div class="relative w-fit ml-auto mt-2 md:mt-0">
                <AnswerDropZone
                  :id="`${index}-right`"
                  answerType="input"
                  :currentAnswer="questionAnswers[index]?.right || ''"
                  :correctAnswer="question.rightNumber.toString()"
                  :showResults="showResults"
                  placeholder="Count"
                  :onInputChange="(v: string) => handleInputChange(index, 'right', v)"
                  :className="cn('w-[100px] rounded-lg p-2', showResults ? 'border-none' : 'border border-picton-blue-500')"
                />
                <div v-if="showResults && (questionAnswers[index]?.right || '')" class="absolute -top-2 -right-2 z-10">
                  <span
                    class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center"
                    :class="isFieldCorrect(index, 'right') ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ isFieldCorrect(index, "right") ? "✓" : "✕" }}
                  </span>
                </div>
              </div>
            </div>

            <div :class="cn('flex items-center justify-center', { 'min-w-[60px]': !question.displayAnswer || question.displayAnswer === '=' })">
              <div class="text-4xl font-bold text-picton-blue-600">{{ question.displayAnswer || "=" }}</div>
            </div>

            <div class="relative w-fit">
              <AnswerDropZone
                :id="`${index}-result`"
                answerType="input"
                :currentAnswer="questionAnswers[index]?.result || ''"
                :correctAnswer="question.answer.toString()"
                :showResults="showResults"
                placeholder="Answer"
                :onInputChange="(v: string) => handleInputChange(index, 'result', v)"
                :className="cn('w-[120px] rounded-lg p-2', showResults ? 'border-none' : 'border border-picton-blue-500')"
              />
              <div v-if="showResults && (questionAnswers[index]?.result || '')" class="absolute -top-2 -right-2 z-10">
                <span
                  class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center"
                  :class="isFieldCorrect(index, 'result') ? 'text-green-600' : 'text-red-600'"
                >
                  {{ isFieldCorrect(index, "result") ? "✓" : "✕" }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="showResults && props.feedback === 'wrong-correct-answers'"
            class="mt-4 text-center"
          >
            <div class="text-sm text-gray-500">
              {{ ui.correctAnswer }} {{ question.leftNumber }} {{ question.operator }}
              {{ question.rightNumber }} {{ question.displayAnswer || "=" }}
              {{ question.answer }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!showResults" class="flex justify-end">
        <Button :onClick="handleSubmit" :disabled="!canSubmit">{{ ui.checkAnswers }}</Button>
      </div>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score" :total="totalQuestions" :onRestart="resetActivity" />
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="totalQuestions"
        :open="allAnswered"
        :onOpenChange="(open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') resetActivity();
            else showResults = true;
            allAnswered = false;
          }
        }"
      />
    </div>
  </div>
</template>
