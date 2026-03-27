<script setup lang="ts">
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

const { playSound } = useSoundEffects();

const droppedItems = ref<Record<string, string[]>>({});
const availableOptions = ref<string[]>([]);
const score = ref({ correct: 0, total: props.questions.options.length });
const allAnswered = ref(false);
const showFeedback = ref(false);
const showCorrectAnswers = ref(false);

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
      [sourceDroppableId]: droppedItems.value[sourceDroppableId].filter((item) => item !== activeId),
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

  playSound("click");
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

    <div>
      <div class="mb-6">
        <DNDContext :onDragEnd="handleDragEnd">
          <div class="rounded-lg bg-white">
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
                        <Draggable
                          v-if="droppedItems[question.id]?.[optionIndex]"
                          :id="droppedItems[question.id][optionIndex]"
                          :disabled="showFeedback"
                          :class="[
                            'flex min-h-10 w-full items-center rounded-lg px-4 text-lg',
                            !showFeedback && 'bg-lemon-200 text-lemon-700',
                            showFeedback && isCorrectAnswer(question.id, droppedItems[question.id][optionIndex])
                              ? 'bg-green-200 text-green-700'
                              : showFeedback
                                ? 'bg-red-200 text-red-700'
                                : '',
                          ]"
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
                        </Draggable>

                        <div
                          v-else-if="showCorrectAnswers"
                          class="flex h-10 w-full items-center rounded-lg bg-green-200 px-4 text-lg text-green-700"
                        >
                          {{ question.correctOptions[optionIndex] }}
                        </div>

                        <Droppable
                          v-else
                          :id="`${question.id}%${optionIndex}`"
                          class="flex h-10 w-full items-center justify-center rounded-lg bg-picton-blue-200"
                          isOverClassName="bg-lemon-200"
                          :disabled="showFeedback"
                        />
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
                <div class="flex min-h-10 min-w-36 items-center gap-4 rounded bg-picton-blue-200 px-4 text-center text-lg text-picton-blue-700">
                  <span>{{ option }}</span>
                </div>
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
