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
const ui = useActivityUiText();
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
const activityInstructionsId = "shapes-rendering-instructions";
const activityStatusId = "shapes-rendering-status";
const keyboardStatusMessage = ref("");

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
  keyboardStatusMessage.value = "";

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
  keyboardStatusMessage.value = ui.formatActivityUpdated(ui.formatQuestion(questionIndex + 1), value);
};

const handleOptionSelect = (questionIndex: number, option: string) => {
  if (checkedAnswers.value) return;
  const newAnswers = [...answers.value];
  newAnswers[questionIndex] = option;
  answers.value = newAnswers;
  keyboardStatusMessage.value = ui.formatActivitySelected(ui.formatQuestion(questionIndex + 1), option);
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
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${correctCount} / ${processedData.value.questions.length}.`;
};

const getQuestionLabel = (question: ShapeQuestion, questionIndex: number) =>
  question.shape.label
    ? `${ui.formatQuestion(questionIndex + 1)}. ${question.shape.label}`
    : ui.formatQuestion(questionIndex + 1);
</script>

<template>
  <section
    class="flex flex-col h-full"
    aria-labelledby="shapes-rendering-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="shapes-rendering-title" class="sr-only">
      {{ processedData.title }}
    </h2>
    <ActivityTitle :title="processedData.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila umbo na sehemu ya jibu. Chagua chaguo kwa enter au space, au andika jibu lako kwenye kisanduku."
          : "Use Tab to move through each shape and answer control. Choose an option with Enter or Space, or type your answer into the input field."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>
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
          :aria-labelledby="`shape-question-${question.id}`"
        >
          <h3 :id="`shape-question-${question.id}`" class="sr-only">
            {{ getQuestionLabel(question, questionIndex) }}
          </h3>
          <div class="w-full">
            <ShapeCanvas
              :question="question"
              :canvasIndex="questionIndex"
              :width="isMobile ? 200 : 300"
              :height="isMobile ? 200 : 300"
              :aria-label="question.shape.label || `Shape for question ${questionIndex + 1}`"
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
              role="group"
              :aria-label="ui.isSwahili ? `Chaguo za swali la ${questionIndex + 1}` : `Options for question ${questionIndex + 1}`"
            >
              <Button
                v-for="(option, optionIndex) in shuffledOptions[questionIndex]"
                :key="`option-${optionIndex}`"
                type="button"
                :aria-pressed="answers[questionIndex] === option"
                :aria-label="ui.isSwahili ? `Swali la ${questionIndex + 1}, chaguo la ${optionIndex + 1}: ${option}` : `Question ${questionIndex + 1}, option ${optionIndex + 1}: ${option}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
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
              role="group"
              :aria-label="ui.isSwahili ? `Jibu la sehemu mbili kwa swali la ${questionIndex + 1}` : `Two-part answer for question ${questionIndex + 1}`"
            >
              <Input
                type="text"
                :value="(answers[questionIndex] || '').split('/')[0] || ''"
                :disabled="checkedAnswers"
                :aria-label="ui.isSwahili ? `Sehemu ya kwanza ya jibu la swali la ${questionIndex + 1}` : `First part of the answer for question ${questionIndex + 1}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
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
                :aria-label="ui.isSwahili ? `Sehemu ya pili ya jibu la swali la ${questionIndex + 1}` : `Second part of the answer for question ${questionIndex + 1}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
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
                :aria-label="ui.isSwahili ? `Jibu la swali la ${questionIndex + 1}` : `Answer for question ${questionIndex + 1}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
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
              {{ ui.formatCorrectAnswer(question.answer) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!checkedAnswers" class="mt-6 ml-auto w-fit">
        <Button
          :onClick="handleCheckAllAnswers"
          :disabled="answers.every((answer) => !answer.trim())"
          variant="brand-lemon"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
        >
          {{ ui.checkAllAnswers }}
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
  </section>
</template>
