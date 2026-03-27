<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { cn, shuffle } from "~/utilities/utils";
import ActivityTitle from "~/components/templates/activity-title";
import type { FeedbackType } from "~/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import ShapeCanvas from "./ShapeCanvas.vue";
import type { ShapeQuestion, ShapesData } from "./types";
import { useIsMobile } from "~/composables/useIsMobile";

type ShapesRenderingActivityProps = {
  feedback?: FeedbackType;
  questions?: ShapesData;
};

const props = defineProps<ShapesRenderingActivityProps>();
const isMobile = useIsMobile();

const buildDefaultShapesData = (): ShapesData => ({
  title: "Shapes Rendering",
  questions: [],
});

const processedData = computed(() =>
  props.questions ?? buildDefaultShapesData(),
);

const shuffledOptions = reactive<Record<number, string[]>>({});
const answers = ref<string[]>([]);
const checkedAnswers = ref(false);
const feedbacks = ref<boolean[]>([]);
const showResults = ref(false);
const score = ref(0);

const initState = () => {
  const length = processedData.value.questions.length;
  answers.value = new Array(length).fill("");
  feedbacks.value = new Array(length).fill(false);

  Object.keys(shuffledOptions).forEach((key) => delete shuffledOptions[Number(key)]);
  processedData.value.questions.forEach((question: ShapeQuestion, idx: number) => {
    if (question.options && question.options.length > 0) {
      shuffledOptions[idx] = question.options;
    }
  });
};

onMounted(initState);
watch(processedData, initState, { deep: true });

const handleCustomReset = () => {
  const length = processedData.value.questions.length;
  answers.value = new Array(length).fill("");
  checkedAnswers.value = false;
  feedbacks.value = new Array(length).fill(false);
  showResults.value = false;
  score.value = 0;

  Object.keys(shuffledOptions).forEach((key) => delete shuffledOptions[Number(key)]);
  processedData.value.questions.forEach((question: ShapeQuestion, idx: number) => {
    if (question.options && question.options.length > 0) {
      shuffledOptions[idx] = shuffle([...question.options]);
    }
  });
};

const handleTextInputChange = (questionIndex: number, value: string) => {
  const newAnswers = [...answers.value];
  newAnswers[questionIndex] = value;
  answers.value = newAnswers;
};

const handleOptionSelect = (questionIndex: number, option: string) => {
  if (checkedAnswers.value) return;
  const newAnswers = [...answers.value];
  newAnswers[questionIndex] = option;
  answers.value = newAnswers;
};

const handleCheckAllAnswers = () => {
  const newFeedbacks: boolean[] = [];
  let correctCount = 0;

  processedData.value.questions.forEach((question: ShapeQuestion, index: number) => {
    const userAnswer = answers.value[index] || "";
    const isCorrect =
      userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    newFeedbacks[index] = isCorrect;
    if (isCorrect) correctCount++;
  });

  feedbacks.value = newFeedbacks;
  score.value = correctCount;
  checkedAnswers.value = true;
};
</script>

<template>
  <div class="flex flex-col h-full">
    <ActivityTitle :title="processedData.title" />
    <div class="flex-1 overflow-y-auto p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(question, questionIndex) in processedData.questions"
          :key="`question-${question.id}`"
          :class="
            cn(
              'relative p-6 border rounded-xl bg-white flex-col flex items-center',
              checkedAnswers &&
                (feedbacks[questionIndex]
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'),
              {
                'flex-row':
                  question.answer && /^\d+\/\d+$/.test(question.answer),
              },
            )
          "
        >
          <div class="w-full">
            <ShapeCanvas
              :question="question"
              :canvasIndex="questionIndex"
              :width="isMobile ? 200 : 300"
              :height="isMobile ? 200 : 300"
              className="mx-auto"
            />
          </div>

          <div v-if="checkedAnswers" class="absolute top-4 right-4">
            <Icon
              v-if="feedbacks[questionIndex]"
              icon="mdi:check"
              class="h-6 w-6 text-green-500"
            />
            <Icon v-else icon="mdi:close" class="h-6 w-6 text-red-500" />
          </div>

          <div class="w-full">
            <div
              v-if="question.options && question.options.length > 0"
              class="grid grid-cols-2 gap-2 mt-auto"
            >
              <Button
                v-for="(option, optionIndex) in shuffledOptions[questionIndex]"
                :key="`option-${optionIndex}`"
                :variant="answers[questionIndex] === option ? 'brand' : 'outline-brand'"
                :class="
                  cn(
                    'w-full justify-start',
                    checkedAnswers &&
                      props.feedback === 'wrong-correct-answers' &&
                      option === question.answer &&
                      'bg-green-500 hover:bg-green-600 text-white border-green-500',
                    checkedAnswers &&
                      props.feedback === 'wrong-correct-answers' &&
                      answers[questionIndex] === option &&
                      option !== question.answer &&
                      'bg-red-500 hover:bg-red-600 text-white',
                    checkedAnswers &&
                      props.feedback === 'wrong-correct' &&
                      answers[questionIndex] === option &&
                      option === question.answer &&
                      'bg-green-500 hover:bg-green-600 text-white border-green-500',
                    checkedAnswers &&
                      props.feedback === 'wrong-correct' &&
                      answers[questionIndex] === option &&
                      option !== question.answer &&
                      'bg-red-500 hover:bg-red-600 text-white',
                  )
                "
                :onClick="() => !checkedAnswers && handleOptionSelect(questionIndex, option)"
                :disabled="checkedAnswers"
              >
                {{ option }}
              </Button>
            </div>

            <div
              v-else-if="question.answer && /^\d+\/\d+$/.test(question.answer)"
              class="flex flex-col items-center w-full"
            >
              <Input
                type="text"
                :value="(answers[questionIndex] || '').split('/')[0] || ''"
                :disabled="checkedAnswers"
                :class="
                  cn(
                    'mb-2 text-center max-w-20 !text-2xl',
                    checkedAnswers &&
                      (feedbacks[questionIndex]
                        ? 'border-green-500 text-green-600'
                        : 'border-red-500 text-red-600'),
                  )
                "
                :onChange="(e: Event) => {
                  const denominator = (answers[questionIndex] || '').split('/')[1] || '';
                  const value = (e.target as HTMLInputElement).value;
                  handleTextInputChange(
                    questionIndex,
                    `${value}${denominator ? '/' + denominator : ''}`,
                  );
                }"
              />
              <div class="w-full border-t border-gray-300 mb-2 max-w-24" />
              <Input
                type="text"
                :value="(answers[questionIndex] || '').split('/')[1] || ''"
                :disabled="checkedAnswers"
                :class="
                  cn(
                    'text-center max-w-20 !text-2xl',
                    checkedAnswers &&
                      (feedbacks[questionIndex]
                        ? 'border-green-500 text-green-600'
                        : 'border-red-500 text-red-600'),
                  )
                "
                :onChange="(e: Event) => {
                  const numerator = (answers[questionIndex] || '').split('/')[0] || '';
                  const value = (e.target as HTMLInputElement).value;
                  handleTextInputChange(questionIndex, `${numerator}/${value}`);
                }"
              />
            </div>

            <div v-else class="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter your answer..."
                :value="answers[questionIndex] || ''"
                :disabled="checkedAnswers"
                :class="
                  cn(
                    '!text-lg',
                    checkedAnswers &&
                      (feedbacks[questionIndex]
                        ? 'border-green-500 text-green-600'
                        : 'border-red-500 text-red-600'),
                  )
                "
                :onChange="(e: Event) =>
                  handleTextInputChange(
                    questionIndex,
                    (e.target as HTMLInputElement).value,
                  )"
              />
            </div>

            <div
              v-if="
                checkedAnswers &&
                !feedbacks[questionIndex] &&
                props.feedback === 'wrong-correct-answers'
              "
              class="mt-2 text-sm text-green-600 font-medium"
            >
              Correct answer: {{ question.answer }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!checkedAnswers" class="mt-6 ml-auto w-fit">
        <Button
          :onClick="handleCheckAllAnswers"
          :disabled="answers.every((answer) => !answer.trim())"
          variant="brand-lemon"
        >
          Check All Answers
        </Button>
      </div>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="processedData.questions.length"
        :onRestart="handleCustomReset"
        className="mt-10"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="processedData.questions.length"
      :open="checkedAnswers && !showResults"
      :onOpenChange="(open: boolean) => { if (!open) showResults = true }"
    />
  </div>
</template>
