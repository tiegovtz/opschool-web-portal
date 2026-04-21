<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type MatrixQuestion = {
  id: string;
  name: string;
  description: string;
  image?: string;
  correctOptions: string[];
};

type Props = {
  questions: {
    title: string;
    titles: string[];
    options: string[];
    questions: MatrixQuestion[];
  };
  feedback?: FeedbackType;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "none",
});

const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const droppedItems = ref<Record<string, string[]>>({});
const availableOptions = ref<string[]>([]);
const score = ref({ correct: 0, total: props.questions.options.length });
const allAnswered = ref(false);
const showFeedback = ref(false);
const showCorrectAnswers = ref(false);
const selectedOption = ref<string | null>(null);
const instructionsId = "complete-matrix-instructions";
const statusId = "complete-matrix-status";
const keyboardStatusMessage = ref("");

const initialize = () => {
  droppedItems.value = props.questions.questions.reduce((acc, question) => {
    acc[question.id] = [];
    return acc;
  }, {} as Record<string, string[]>);
  availableOptions.value = shuffle([...props.questions.options]);
  score.value = { correct: 0, total: props.questions.options.length };
  allAnswered.value = false;
  showFeedback.value = false;
  showCorrectAnswers.value = false;
  selectedOption.value = null;
  keyboardStatusMessage.value = "";
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

watch([availableOptions, droppedItems], () => {
  if (availableOptions.value.length !== 0) return;

  const correctCount = props.questions.questions.reduce((total, question) => {
    const matched = question.correctOptions.filter((option) =>
      droppedItems.value[question.id]?.includes(option),
    ).length;
    return total + matched;
  }, 0);

  score.value = { correct: correctCount, total: props.questions.options.length };
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value.correct} / ${score.value.total}.`;
  playSound("success");
  allAnswered.value = true;
}, { deep: true });

const handleDragEnd = (event: DragEndEvent) => {
  const overId = String(event.over?.id || "");
  const activeId = String(event.active?.id || "");

  if (!overId || !activeId) return;

  const [droppableId, slotIndexText] = overId.split("%");
  const dropZoneIndex = Number.parseInt(slotIndexText, 10);

  let sourceDroppableId: string | null = null;

  Object.entries(droppedItems.value).forEach(([id, items]) => {
    if (items.includes(activeId)) {
      sourceDroppableId = id;
    }
  });

  if (sourceDroppableId) {
    droppedItems.value = {
      ...droppedItems.value,
      [sourceDroppableId]: droppedItems.value[sourceDroppableId]?.filter((item) => item !== activeId),
    };
  } else {
    availableOptions.value = availableOptions.value.filter((item) => item !== activeId);
  }

  const updatedItems = [...(droppedItems.value[droppableId] || [])];
  if (updatedItems[dropZoneIndex] && updatedItems[dropZoneIndex] !== activeId && !sourceDroppableId) {
    availableOptions.value = [...availableOptions.value, updatedItems[dropZoneIndex]];
  }

  updatedItems[dropZoneIndex] = activeId;
  droppedItems.value = {
    ...droppedItems.value,
    [droppableId]: updatedItems,
  };

  const targetQuestion = props.questions.questions.find((question) => question.id === droppableId);
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    targetQuestion?.name || props.questions.title,
    activeId,
  );
  selectedOption.value = null;
  playSound("click");
};

const assignOptionToSlot = (questionId: string, slotIndex: number, option: string) => {
  const existingOption = droppedItems.value[questionId]?.[slotIndex];

  if (existingOption === option) {
    selectedOption.value = null;
    return;
  }

  let sourceQuestionId: string | null = null;
  Object.entries(droppedItems.value).forEach(([id, items]) => {
    if (items.includes(option)) {
      sourceQuestionId = id;
    }
  });

  if (sourceQuestionId) {
    droppedItems.value = {
      ...droppedItems.value,
      [sourceQuestionId]: droppedItems.value[sourceQuestionId].map((item, index) =>
        item === option ? "" : item,
      ),
    };
  } else {
    availableOptions.value = availableOptions.value.filter((item) => item !== option);
  }

  if (existingOption) {
    availableOptions.value = [...availableOptions.value, existingOption];
  }

  const updatedItems = [...(droppedItems.value[questionId] || [])];
  updatedItems[slotIndex] = option;
  droppedItems.value = {
    ...droppedItems.value,
    [questionId]: updatedItems,
  };
  const targetQuestion = props.questions.questions.find((question) => question.id === questionId);
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    targetQuestion?.name || props.questions.title,
    option,
  );
  selectedOption.value = null;
  playSound("click");
};

const handleSlotActivate = (questionId: string, slotIndex: number) => {
  if (showFeedback.value) return;

  const existingOption = droppedItems.value[questionId]?.[slotIndex];
  if (existingOption && !selectedOption.value) {
    const updatedItems = [...(droppedItems.value[questionId] || [])];
    updatedItems[slotIndex] = "";
    droppedItems.value = {
      ...droppedItems.value,
      [questionId]: updatedItems,
    };
    availableOptions.value = shuffle([...availableOptions.value, existingOption]);
    const targetQuestion = props.questions.questions.find((question) => question.id === questionId);
    keyboardStatusMessage.value = ui.formatActivityRemoved(
      targetQuestion?.name || props.questions.title,
      existingOption,
    );
    return;
  }

  if (selectedOption.value) {
    assignOptionToSlot(questionId, slotIndex, selectedOption.value);
    return;
  }

  keyboardStatusMessage.value = ui.isSwahili.value
    ? "Chagua chaguo kwanza kabla ya kuweka kwenye nafasi."
    : "Select an option first before placing it in a slot.";
};

const isCorrectAnswer = (questionId: string, option: string) =>
  props.questions.questions.find((question) => question.id === questionId)?.correctOptions.includes(option) || false;

const getCorrectCategory = (option: string) => {
  for (const question of props.questions.questions) {
    if (question.correctOptions.includes(option)) {
      return question.name;
    }
  }

  return null;
};

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Complete the matrix by matching each option to the correct category. You can drag with a
      pointer, or use the Tab key to select an option and then activate an empty answer slot to
      place it. Activate a filled slot with no option selected to remove it.
    </p>
    <p :id="statusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <div>
      <div class="mb-6">
        <DNDContext :onDragEnd="handleDragEnd">
          <div class="rounded-lg bg-white" :aria-describedby="`${instructionsId} ${statusId}`">
            <div class="grid grid-cols-12 gap-4 rounded-t-lg bg-picton-blue-200 p-2 font-bold text-picton-blue-700">
              <div class="col-span-3 text-center">{{ props.questions.titles[0] }}</div>
              <div class="col-span-4 text-center">{{ props.questions.titles[1] }}</div>
              <div class="col-span-5 text-center">{{ props.questions.titles[2] }}</div>
            </div>

            <div class="px-6">
              <div
                v-for="(question, questionIndex) in props.questions.questions"
                :key="questionIndex"
                class="border-b border-gray-200 py-4"
              >
                <div class="grid grid-cols-12 items-center gap-4">
                  <div class="col-span-3 flex items-center gap-4">
                    <div class="text-center">{{ questionIndex + 1 }}.</div>
                    <div :class="question.image ? 'mx-auto' : 'my-10'">
                      <div v-if="question.image" class="flex max-h-[210px] justify-center">
                        <img
                          :src="question.image"
                          :alt="question.name"
                          class="h-full max-h-[210px] w-full max-w-[210px] object-contain"
                        >
                      </div>
                      <div
                        v-if="question.name"
                        :class="
                          cn('text-lg', {
                            'mt-2 text-center font-medium': question.image,
                          })
                        "
                      >
                        {{ question.name }}
                      </div>
                    </div>
                  </div>

                  <div class="col-span-4 whitespace-pre-line text-lg">
                    {{ question.description }}
                  </div>

                  <div class="col-span-5">
                    <div class="flex flex-col justify-center gap-2">
                      <template
                        v-for="(_, optionIndex) in Array.from({ length: question.correctOptions.length })"
                        :key="optionIndex"
                      >
                        <button
                          v-if="droppedItems[question.id]?.[optionIndex]"
                          type="button"
                          :disabled="showFeedback"
                          :aria-describedby="`${instructionsId} ${statusId}`"
                          :aria-label="`Placed option ${droppedItems[question.id][optionIndex]} in ${question.name}, slot ${optionIndex + 1}. Activate to remove it.`"
                          :class="[
                            'flex min-h-10 w-full items-center rounded-lg px-4 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2',
                            !showFeedback && 'bg-lemon-200 text-lemon-700',
                            showFeedback && isCorrectAnswer(question.id, droppedItems[question.id][optionIndex])
                              ? 'bg-green-200 text-green-700'
                              : showFeedback
                                ? 'bg-red-200 text-red-700'
                                : '',
                          ]"
                          @click="handleSlotActivate(question.id, optionIndex)"
                        >
                          {{ droppedItems[question.id][optionIndex] }}
                          <span
                            v-if="
                              showFeedback &&
                              !isCorrectAnswer(question.id, droppedItems[question.id][optionIndex]) &&
                              props.feedback === 'wrong-correct-answers'
                            "
                            class="ml-2 font-semibold text-green-700"
                          >
                            → {{ getCorrectCategory(droppedItems[question.id][optionIndex]) }}
                          </span>
                        </button>

                        <div
                          v-else-if="showCorrectAnswers"
                          class="flex h-10 w-full items-center rounded-lg bg-green-200 px-4 text-lg text-green-700"
                        >
                          {{ question.correctOptions[optionIndex] }}
                        </div>

                        <button
                          v-else
                          type="button"
                          :aria-describedby="`${instructionsId} ${statusId}`"
                          :aria-label="
                            selectedOption
                              ? `Empty slot ${optionIndex + 1} for ${question.name}. Activate to place ${selectedOption}.`
                              : `Empty slot ${optionIndex + 1} for ${question.name}. Select an option first.`
                          "
                          class="flex h-10 w-full items-center justify-center rounded-lg bg-picton-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                          :disabled="showFeedback"
                          @click="handleSlotActivate(question.id, optionIndex)"
                        >
                          <span class="text-sm text-picton-blue-700">
                            {{ selectedOption ? `Place ${selectedOption}` : "Empty slot" }}
                          </span>
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-lg">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Draggable
                v-for="(option, index) in availableOptions"
                :key="index"
                :id="option"
                :disabled="showFeedback"
              >
                <button
                  type="button"
                  :aria-describedby="`${instructionsId} ${statusId}`"
                  :aria-pressed="selectedOption === option"
                  :class="[
                    'flex min-h-10 min-w-36 items-center gap-4 rounded bg-picton-blue-200 px-4 text-center text-lg text-picton-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2',
                    selectedOption === option ? 'ring-2 ring-picton-blue-500 ring-offset-2' : '',
                  ]"
                  @click="
                    () => {
                      const isSelected = selectedOption === option;
                      selectedOption = isSelected ? null : option;
                      keyboardStatusMessage = isSelected
                        ? ui.formatActivityRemoved(ui.availableAnswerChoices.value, option)
                        : ui.formatActivitySelected(ui.availableAnswerChoices.value, option);
                    }
                  "
                >
                  <span>{{ option }}</span>
                </button>
              </Draggable>
            </div>
          </div>
        </DNDContext>
      </div>
    </div>

    <div v-if="showFeedback" class="mt-4">
      <ActivityResults
        :score="score.correct"
        :total="score.total"
        :onRestart="resetActivity"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score.correct"
      :total="score.total"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else if (props.feedback === 'wrong-correct') {
              showFeedback = true;
              allAnswered = false;
            } else if (props.feedback === 'wrong-correct-answers') {
              showFeedback = true;
              showCorrectAnswers = true;
              allAnswered = false;
            }
          }
        }
      "
    />
  </div>
</template>
