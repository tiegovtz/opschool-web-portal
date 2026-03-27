<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref, watch } from "vue";
import { shuffle } from "~/utilities/utils";
import { QuantityRenderer } from "./shared";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import DNDContext, { type DndDragEndEvent } from "~/components/layout/dnd-context";

type ComparingQuantitiesDraggingProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      leftAnswer: string;
      leftImage: string;
      rightNumber: number;
      rightAnswer: string;
      rightImage: string;
    }[];
  };
  feedbackType: FeedbackType;
};

const props = defineProps<ComparingQuantitiesDraggingProps>();

const score = ref(0);
const showResults = ref(false);
const allAnswered = ref(false);
const questionAnswers = reactive<Record<number, { left: string; right: string }>>(
  {},
);
const questionAvailableAnswers = reactive<Record<number, string[]>>({});
const correctAnswers = ref<string[]>([]);

const { playSound } = useSoundEffects();

const totalQuestions = computed(() => props.questions.questions.length);
const getQuestionAnswers = (questionIndex: number) =>
  questionAnswers[questionIndex] ?? { left: "", right: "" };

const init = () => {
  props.questions.questions.forEach((question, index) => {
    const answers = [question.leftAnswer, question.rightAnswer];
    questionAnswers[index] = { left: "", right: "" };
    questionAvailableAnswers[index] = shuffle(answers);
  });
};

onMounted(init);
watch(() => props.questions, init, { deep: true });

watch(
  () => ({ ...questionAnswers }),
  () => {
    const answered = Object.keys(questionAnswers).filter((k) => {
      const a = questionAnswers[Number(k)];
      return a && a.left && a.right;
    }).length;

    if (answered !== totalQuestions.value || totalQuestions.value === 0) return;

    let totalScore = 0;
    const correct: string[] = [];

    props.questions.questions.forEach((question, index) => {
      const answers = getQuestionAnswers(index);
      const isLeftCorrect = answers.left === question.leftAnswer;
      const isRightCorrect = answers.right === question.rightAnswer;
      if (isLeftCorrect && isRightCorrect) totalScore += 1;
      if (isLeftCorrect) correct.push(`${index}-left`);
      if (isRightCorrect) correct.push(`${index}-right`);
    });

    score.value = totalScore;
    correctAnswers.value = correct;
    allAnswered.value = true;
    playSound("success");
  },
  { deep: true },
);

const isCorrect = (questionIndex: number, side: "left" | "right") =>
  correctAnswers.value.includes(`${questionIndex}-${side}`);

const handleDragEnd = (event: DndDragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const activeId = String(active.id);
  const overId = String(over.id);

  const activeIdParts = activeId.split("-");
  if (activeIdParts.length < 3) return;

  let sourceQuestionIndex: number;
  let answer: string;
  let sourceType: "available" | "dropped";
  let sourceSide: "left" | "right" | null = null;

  if (activeIdParts[0] === "answer") {
    sourceType = "available";
    const sourceIndexPart = activeIdParts[1];
    if (!sourceIndexPart) return;
    sourceQuestionIndex = Number.parseInt(sourceIndexPart, 10);
    answer = activeIdParts.slice(2).join("-"); // tolerate dashes in answer
  } else if (activeIdParts[0] === "dropped") {
    sourceType = "dropped";
    const sourceIndexPart = activeIdParts[1];
    if (!sourceIndexPart) return;
    sourceQuestionIndex = Number.parseInt(sourceIndexPart, 10);
    const parsedSide = activeIdParts[2];
    if (parsedSide !== "left" && parsedSide !== "right") return;
    sourceSide = parsedSide;
    answer = activeIdParts.slice(3).join("-");
  } else {
    return;
  }

  const overIdParts = overId.split("-");
  if (overIdParts.length !== 2) return;

  const targetIndexPart = overIdParts[0];
  const sidePart = overIdParts[1];
  if (!targetIndexPart || (sidePart !== "left" && sidePart !== "right")) return;
  const targetQuestionIndex = Number.parseInt(targetIndexPart, 10);
  const side: "left" | "right" = sidePart;

  if (sourceQuestionIndex !== targetQuestionIndex) return;

  // if moving from dropped zone, clear source side first
  if (sourceType === "dropped" && sourceSide) {
    const sourceAnswers = getQuestionAnswers(sourceQuestionIndex);
    questionAnswers[sourceQuestionIndex] = {
      ...sourceAnswers,
      [sourceSide]: "",
    };

    const displaced = questionAnswers[targetQuestionIndex]?.[side];
    if (displaced && displaced !== answer) {
      questionAvailableAnswers[targetQuestionIndex] = [
        ...(questionAvailableAnswers[targetQuestionIndex] || []),
        displaced,
      ];
    }
  }

  // if moving from available, remove from available & return displaced (if any)
  if (sourceType === "available") {
    questionAvailableAnswers[targetQuestionIndex] = (questionAvailableAnswers[
      targetQuestionIndex
    ] || []).filter((a) => a !== answer);

    const displaced = questionAnswers[targetQuestionIndex]?.[side];
    if (displaced) {
      questionAvailableAnswers[targetQuestionIndex] = [
        ...(questionAvailableAnswers[targetQuestionIndex] || []),
        displaced,
      ];
    }
  }

  questionAnswers[targetQuestionIndex] = {
    ...getQuestionAnswers(targetQuestionIndex),
    [side]: answer,
  };

  playSound("click");
};

const resetActivity = () => {
  score.value = 0;
  showResults.value = false;
  allAnswered.value = false;
  correctAnswers.value = [];
  init();
};
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex-1 flex flex-col gap-6 overflow-y-auto p-4">
      <DNDContext :onDragEnd="handleDragEnd">
        <div class="space-y-6">
          <div
            v-for="(question, index) in props.questions.questions"
            :key="index"
            class="bg-white rounded-lg p-6 mb-6"
          >
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="bg-gray-50 p-4 md:flex md:items-center gap-2 rounded-lg border border-gray-200 w-full">
                <QuantityRenderer
                  :count="question.leftNumber"
                  :image="question.leftImage"
                  :maxItemsPerRow="7"
                  className="md:max-w-[350px] xl:max-w-full flex-wrap"
                />

                <div class="relative w-fit ml-auto mt-2 md:mt-0">
                  <Droppable
                    :id="`${index}-left`"
                    :class="
                      `h-[50px] w-[90px] flex items-center justify-center rounded-lg transition-colors bg-picton-blue-100 duration-200 ${
                        questionAnswers[index]?.left
                          ? showResults
                            ? isCorrect(index, 'left')
                              ? 'bg-green-200 text-green-700 border-green-300'
                              : 'bg-red-200 text-red-700 border-red-300'
                            : 'bg-lemon-200 text-lemon-700 border-lemon-300'
                          : 'border-picton-blue-300'
                      }`
                    "
                    isOverClassName="bg-lemon-100 border-lemon-400"
                  >
                    <Draggable
                      v-if="questionAnswers[index]?.left && !showResults"
                      :id="`dropped-${index}-left-${questionAnswers[index].left}`"
                      class="bg-lemon-200 text-lemon-700 h-[50px] w-[90px] rounded-md cursor-move hover:bg-lemon-200 transition-colors text-lg font-medium flex justify-center items-center"
                    >
                      {{ questionAnswers[index].left }}
                    </Draggable>
                    <template v-else>
                      {{ questionAnswers[index]?.left || "" }}
                    </template>
                  </Droppable>

                  <div v-if="showResults" class="absolute -top-2 -right-2 z-10">
                    <span
                      class="text-white h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center"
                      :class="isCorrect(index, 'left') ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ isCorrect(index, "left") ? "✓" : "✕" }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-center gap-4 max-w-[300px]">
                <div
                  v-if="!showResults && (questionAvailableAnswers[index]?.length || 0) > 0"
                  class="flex md:flex-col justify-center gap-3"
                >
                  <Draggable
                    v-for="(answer, answerIndex) in questionAvailableAnswers[index]"
                    :key="`answer-${index}-${answer}-${answerIndex}`"
                    :id="`answer-${index}-${answer}`"
                    class="bg-picton-blue-100 text-picton-blue-700 h-[50px] w-[90px] z-10 rounded-lg border border-picton-blue-300 cursor-move hover:bg-picton-blue-200 transition-colors text-lg font-medium flex justify-center items-center"
                  >
                    {{ answer }}
                  </Draggable>
                </div>

                <div v-if="showResults && props.feedbackType === 'wrong-correct-answers'" class="text-center">
                  <div class="text-sm text-gray-500">
                    Correct: {{ question.leftAnswer }} | {{ question.rightAnswer }}
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 md:flex md:items-center p-4 gap-2 rounded-lg border border-gray-200 w-full">
                <div class="relative w-fit ml-auto mt-2">
                  <Droppable
                    :id="`${index}-right`"
                    :class="
                      `h-[50px] w-[90px] flex items-center justify-center rounded-lg transition-colors bg-picton-blue-100 duration-200 ${
                        questionAnswers[index]?.right
                          ? showResults
                            ? isCorrect(index, 'right')
                              ? 'bg-green-200 text-green-700 border-green-300'
                              : 'bg-red-200 text-red-700 border-red-300'
                            : 'bg-lemon-200 text-lemon-700'
                          : 'border-picton-blue-300'
                      }`
                    "
                    isOverClassName="bg-lemon-100 border-lemon-400"
                  >
                    <Draggable
                      v-if="questionAnswers[index]?.right && !showResults"
                      :id="`dropped-${index}-right-${questionAnswers[index].right}`"
                      class="bg-lemon-200 text-lemon-700 h-[50px] w-[90px] rounded-md border border-lemon-300 cursor-move hover:bg-lemon-200 transition-colors text-lg font-medium flex items-center justify-center"
                    >
                      {{ questionAnswers[index].right }}
                    </Draggable>
                    <template v-else>
                      {{ questionAnswers[index]?.right || "" }}
                    </template>
                  </Droppable>

                  <div v-if="showResults" class="absolute -top-2 -right-2 z-10">
                    <span
                      class="h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center"
                      :class="isCorrect(index, 'right') ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ isCorrect(index, "right") ? "✓" : "✕" }}
                    </span>
                  </div>
                </div>

                <QuantityRenderer
                  :count="question.rightNumber"
                  :image="question.rightImage"
                  :maxItemsPerRow="7"
                  className="md:max-w-[350px] xl:max-w-full flex-wrap"
                />
              </div>
            </div>
          </div>
        </div>
      </DNDContext>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score" :total="totalQuestions" :onRestart="resetActivity" />
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="totalQuestions"
        :open="allAnswered"
        :onOpenChange="(open: boolean) => {
          if (!open) {
            if (props.feedbackType === 'none') resetActivity();
            else showResults = true;
            allAnswered = false;
          }
        }"
      />
    </div>
  </div>
</template>
