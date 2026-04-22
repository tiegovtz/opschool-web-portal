<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref, watch } from "vue";
import { cn } from "~/utilities/utils";
import { QuantityRenderer } from "./shared";
import AnswerDropZone from "./shared/answer-drop-zone.vue";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import { Button } from "~/components/ui/button";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import DNDContext, { type DndDragEndEvent } from "~/components/layout/dnd-context";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type ComparingQuantitiesLessMoreWithPicsProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      rightNumber: number;
      leftImage: string;
      answer: ">" | "<" | "=";
    }[];
  };
  feedback: FeedbackType;
};

const props = defineProps<ComparingQuantitiesLessMoreWithPicsProps>();
const ui = useActivityUiText();

const OPERATORS = [">", "=", "<"] as const;

const score = ref(0);
const showResults = ref(false);
const allAnswered = ref(false);
const canSubmit = ref(false);
const questionAnswers = reactive<
  Record<number, { left: string; right: string; operator: string }>
>({});
const correctAnswers = ref<string[]>([]);
const activityInstructionsId = "numbers-less-more-pics-instructions";
const activityStatusId = "numbers-less-more-pics-status";
const keyboardStatusMessage = ref("");

const { playSound } = useSoundEffects();

const totalQuestions = computed(() => props.questions.questions.length);
const getQuestionAnswer = (questionIndex: number) =>
  questionAnswers[questionIndex] ?? { left: "", right: "", operator: "" };

const initAnswers = () => {
  props.questions.questions.forEach((_, index) => {
    questionAnswers[index] = { left: "", right: "", operator: "" };
  });
};

onMounted(initAnswers);
watch(() => props.questions, initAnswers, { deep: true });

watch(
  () => ({ ...questionAnswers }),
  () => {
    const answered = Object.keys(questionAnswers).filter((k) => {
      const a = questionAnswers[Number(k)];
      return a && a.left && a.right && a.operator;
    }).length;
    canSubmit.value = answered === totalQuestions.value;
  },
  { deep: true },
);

const handleSubmit = () => {
  let totalScore = 0;
  const correct: string[] = [];

  props.questions.questions.forEach((question, index) => {
    const user = questionAnswers[index];
    if (!user) return;
    const isLeftCorrect = Number.parseInt(user.left, 10) === question.leftNumber;
    const isRightCorrect = Number.parseInt(user.right, 10) === question.rightNumber;
    const isOperatorCorrect = user.operator === question.answer;

    if (isLeftCorrect && isRightCorrect && isOperatorCorrect) {
      totalScore += 1;
      correct.push(index.toString());
    }
    if (isLeftCorrect) correct.push(`${index}-left`);
    if (isRightCorrect) correct.push(`${index}-right`);
    if (isOperatorCorrect) correct.push(`${index}-operator`);
  });

  score.value = totalScore;
  correctAnswers.value = correct;
  allAnswered.value = true;
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${totalScore} / ${totalQuestions.value}.`;
  playSound("success");
};

const handleInputChange = (questionIndex: number, field: "left" | "right", value: string) => {
  const current = getQuestionAnswer(questionIndex);
  questionAnswers[questionIndex] = {
    ...current,
    [field]: value,
  };
  keyboardStatusMessage.value = ui.formatActivityUpdated(ui.formatQuestion(questionIndex + 1), value);
};

const handleDragEnd = (event: DndDragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const operatorValue = String(active.id).split("-").slice(1).join("-");
  const targetId = String(over.id);
  if (!targetId.includes("operator-drop-")) return;

  const questionIndex = Number.parseInt(targetId.split("-")[2] || "0", 10);
  const currentAnswer = getQuestionAnswer(questionIndex);
  questionAnswers[questionIndex] = {
    left: currentAnswer.left || "",
    right: currentAnswer.right || "",
    operator: operatorValue,
  };
  keyboardStatusMessage.value = ui.formatActivityPlaced(ui.formatQuestion(questionIndex + 1), operatorValue);
  playSound("click");
};

const resetActivity = () => {
  score.value = 0;
  showResults.value = false;
  allAnswered.value = false;
  canSubmit.value = false;
  correctAnswers.value = [];
  initAnswers();
  keyboardStatusMessage.value = "";
};

const isFieldCorrect = (questionIndex: number, field: string) =>
  correctAnswers.value.includes(`${questionIndex}-${field}`);

const fieldStyle = (questionIndex: number, field: string, value: string) => {
  if (!showResults.value) return "";
  if (!value) return "";
  return isFieldCorrect(questionIndex, field)
    ? "bg-green-200 text-green-700 border-green-300"
    : "bg-red-200 text-red-700 border-red-300";
};

const selectOperator = (questionIndex: number, operator: string) => {
  const currentAnswer = getQuestionAnswer(questionIndex);
  questionAnswers[questionIndex] = {
    left: currentAnswer.left || "",
    right: currentAnswer.right || "",
    operator,
  };
  keyboardStatusMessage.value = ui.formatActivitySelected(ui.formatQuestion(questionIndex + 1), operator);
  playSound("click");
};
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="numbers-less-more-pics-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="numbers-less-more-pics-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye visanduku vya kuhesabu na chaguo za alama. Unaweza kuburuta alama au kuchagua kwa enter au space."
          : "Use Tab to move through the counting fields and operator choices. You can drag an operator or choose it with Enter or Space."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <DNDContext :onDragEnd="handleDragEnd">
      <div class="flex-1 flex flex-col gap-4 p-4">
        <div
          class="flex justify-center gap-4 sticky top-4 z-10 bg-picton-blue-100 px-4 py-2 rounded-lg mx-auto w-fit"
          role="group"
          :aria-label="ui.isSwahili ? 'Chaguo za alama' : 'Operator choices'"
        >
          <div
            v-for="op in OPERATORS"
            :key="`operator-${op}`"
            class="flex flex-col items-center gap-2"
          >
            <Draggable
              :id="`operator-${op}`"
              class="bg-white w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold shadow cursor-grab hover:shadow-lg z-10"
            >
              {{ op }}
            </Draggable>
            <span class="sr-only">{{ op }}</span>
          </div>
        </div>

        <div class="space-y-6">
          <div
          v-for="(question, index) in props.questions.questions"
          :key="index"
          class="bg-white rounded-lg p-6 mb-6"
          :aria-labelledby="`numbers-less-more-pics-question-${index}`"
        >
          <h3 :id="`numbers-less-more-pics-question-${index}`" class="sr-only">
            {{ ui.isSwahili ? `Swali la ${index + 1}` : `Question ${index + 1}` }}
          </h3>
          <div class="flex flex-col md:flex-row items-center justify-center gap-8">
            <div class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              <QuantityRenderer
                :count="question.leftNumber"
                :image="question.leftImage"
                :summary-label="ui.isSwahili ? `Kundi la kushoto lina vitu ${question.leftNumber}` : `Left group has ${question.leftNumber} items`"
                :maxItemsPerRow="7"
                className="sm:max-w-[350px] xl:max-w-full flex-wrap"
              />
                <div class="relative w-fit ml-auto">
                  <AnswerDropZone
                    :id="`${index}-left`"
                    answerType="input"
                    :currentAnswer="questionAnswers[index]?.left || ''"
                    :correctAnswer="question.leftNumber.toString()"
                    :showResults="showResults"
                    placeholder="Count"
                    :onInputChange="(v: string) => handleInputChange(index, 'left', v)"
                    :ariaLabel="ui.isSwahili ? `Hesabu ya upande wa kushoto kwa swali la ${index + 1}` : `Left count for question ${index + 1}`"
                    :className="cn('w-[100px] rounded-lg p-2', showResults ? 'border-none' : 'border border-picton-blue-500')"
                  />
                  <div v-if="showResults && (questionAnswers[index]?.left || '')" class="absolute -top-2 -right-2 z-10">
                    <span class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center" :class="isFieldCorrect(index,'left') ? 'text-green-600' : 'text-red-600'">
                      {{ isFieldCorrect(index,'left') ? '✓' : '✕' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="relative">
                <Droppable
                  :id="`operator-drop-${index}`"
                  isOverClassName="bg-lemon-100"
                  :class="
                    cn(
                      'min-w-[80px] min-h-[60px] flex items-center justify-center text-2xl font-bold bg-picton-blue-100 rounded-lg',
                      questionAnswers[index]?.operator ? 'border-picton-blue-400 bg-picton-blue-100' : 'border-gray-300',
                      showResults && fieldStyle(index, 'operator', questionAnswers[index]?.operator || ''),
                    )
                  "
                >
                  <div v-if="questionAnswers[index]?.operator" class="text-2xl font-bold">
                    {{ questionAnswers[index].operator }}
                  </div>
                </Droppable>
                <div
                  v-if="!showResults"
                  class="mt-2 flex justify-center gap-2"
                  role="group"
                  :aria-label="ui.isSwahili ? `Chagua alama kwa swali la ${index + 1}` : `Choose operator for question ${index + 1}`"
                >
                  <button
                    v-for="op in OPERATORS"
                    :key="`${index}-${op}`"
                    type="button"
                    :aria-pressed="questionAnswers[index]?.operator === op"
                    :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                    :class="cn('rounded border px-2 py-1 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500', questionAnswers[index]?.operator === op ? 'border-picton-blue-500 bg-picton-blue-100 text-picton-blue-700' : 'border-gray-300 bg-white text-gray-700')"
                    @click="selectOperator(index, op)"
                  >
                    {{ op }}
                  </button>
                </div>
                <div v-if="showResults && (questionAnswers[index]?.operator || '')" class="absolute -top-2 -right-2 z-10">
                  <span class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center" :class="isFieldCorrect(index,'operator') ? 'text-green-600' : 'text-red-600'">
                    {{ isFieldCorrect(index,'operator') ? '✓' : '✕' }}
                  </span>
                </div>
              </div>

              <div class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
                <div class="relative w-fit ml-auto">
                  <AnswerDropZone
                    :id="`${index}-right`"
                    answerType="input"
                    :currentAnswer="questionAnswers[index]?.right || ''"
                    :correctAnswer="question.rightNumber.toString()"
                  :showResults="showResults"
                  placeholder="Count"
                  :onInputChange="(v: string) => handleInputChange(index, 'right', v)"
                  :ariaLabel="ui.isSwahili ? `Hesabu ya upande wa kulia kwa swali la ${index + 1}` : `Right count for question ${index + 1}`"
                  :className="cn('w-[100px] rounded-lg p-2', showResults ? 'border-none' : 'border border-picton-blue-500')"
                />
                  <div v-if="showResults && (questionAnswers[index]?.right || '')" class="absolute -top-2 -right-2 z-10">
                    <span class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center" :class="isFieldCorrect(index,'right') ? 'text-green-600' : 'text-red-600'">
                      {{ isFieldCorrect(index,'right') ? '✓' : '✕' }}
                    </span>
                  </div>
                </div>
                <QuantityRenderer
                  :count="question.rightNumber"
                  :image="question.leftImage"
                  :summary-label="ui.isSwahili ? `Kundi la kulia lina vitu ${question.rightNumber}` : `Right group has ${question.rightNumber} items`"
                  :maxItemsPerRow="7"
                  className="sm:max-w-[350px] xl:max-w-full flex-wrap"
                />
              </div>
            </div>

            <div v-if="showResults && props.feedback === 'wrong-correct-answers'" class="mt-4 text-center">
              <div class="text-sm text-gray-500">
                {{ ui.correctAnswer }} {{ question.leftNumber }} {{ question.answer }} {{ question.rightNumber }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="!showResults" class="flex justify-end">
          <Button :onClick="handleSubmit" :disabled="!canSubmit" :aria-describedby="`${activityInstructionsId} ${activityStatusId}`">{{ ui.checkAnswers }}</Button>
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
    </DNDContext>
  </section>
</template>
