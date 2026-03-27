<script setup lang="ts">
import { ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    type: string;
    hideWords: boolean;
    questions: {
      question: string;
      image: string;
    }[];
  };
  feedback: FeedbackType;
};

type StepItem = {
  id: string;
  question: string;
  image: string;
  correctPosition: number;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const availableItems = ref<StepItem[]>([]);
const placedItems = ref<Array<StepItem | undefined>>([]);
const showResults = ref(false);
const isComplete = ref(false);
const score = ref(0);
const feedbacks = ref<Record<number, boolean>>({});
const showAlertDialog = ref(false);

const initializeActivity = () => {
  const items = props.questions.questions.map((question, index) => ({
    id: `item-${index}`,
    question: question.question,
    image: question.image,
    correctPosition: index,
  }));

  availableItems.value = shuffle([...items]);
  placedItems.value = Array.from({ length: props.questions.questions.length }, () => undefined);
  showResults.value = false;
  isComplete.value = false;
  feedbacks.value = {};
  showAlertDialog.value = false;
  score.value = 0;
};

watch(() => props.questions, initializeActivity, { deep: true, immediate: true });

const calculateScore = (itemsToScore = placedItems.value) => {
  const nextFeedbacks: Record<number, boolean> = {};
  let correct = 0;

  for (let index = 0; index < props.questions.questions.length; index += 1) {
    const item = itemsToScore[index];
    if (item && item.correctPosition === index) {
      nextFeedbacks[index] = true;
      correct += 1;
    } else {
      nextFeedbacks[index] = false;
    }
  }

  score.value = correct;
  feedbacks.value = nextFeedbacks;
  isComplete.value = true;
  showAlertDialog.value = true;
  playSound("success");
};

const handleDragEnd = (event: DragEndEvent) => {
  const activeValue = String(event.active?.id || "");
  const overValue = String(event.over?.id || "");
  if (!activeValue || !overValue) return;

  const [activeId, activeIndex = ""] = activeValue.split("%");
  const dropPosition = Number(overValue.split("-")[1]) - 1;
  const activeItem = availableItems.value.find((item) => item.id === activeId)
    || placedItems.value.find((item) => item?.id === activeId);

  if (!activeItem) return;

  const nextPlacedItems = [...placedItems.value];
  nextPlacedItems[dropPosition] = activeItem;

  if (activeIndex) {
    nextPlacedItems[Number(activeIndex)] = undefined;
  }

  placedItems.value = nextPlacedItems;
  availableItems.value = availableItems.value.filter((item) => item.id !== activeId);

  if (nextPlacedItems.filter(Boolean).length === props.questions.questions.length) {
    window.setTimeout(() => calculateScore(nextPlacedItems), 100);
  }

  playSound("click");
};

const resetActivity = () => {
  initializeActivity();
};

const isCorrect = (item: StepItem, index: number) => feedbacks.value[index] === true && item.correctPosition === index;
const shouldShowDetailedResults = props.feedback === "wrong-correct-answers";
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <template v-if="!showResults">
      <DNDContext :onDragEnd="handleDragEnd">
        <div
          class="mb-8 grid gap-2 text-lg"
          style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));"
        >
          <template v-for="(item, index) in Array.from({ length: props.questions.questions.length }).map((_, i) => availableItems[i])" :key="index">
            <div v-if="!item" />
            <Draggable
              v-else
              :id="item.id"
              class="flex min-h-72 flex-col items-center justify-between rounded border border-picton-blue-200 bg-picton-blue-50 p-3"
            >
              <p v-if="!props.questions.hideWords" class="mb-2 text-center">{{ item.question }}</p>
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.question"
                class="grow h-32 w-full object-contain"
              >
            </Draggable>
          </template>
        </div>

        <div
          class="mb-8 grid gap-2 text-lg"
          style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));"
        >
          <template v-for="(_, index) in props.questions.questions" :key="index">
            <Droppable
              v-if="!placedItems[index]"
              :id="`event-${index + 1}`"
              class="flex min-h-72 items-center justify-center rounded-md border border-picton-blue-300 bg-picton-blue-200 p-2"
              isOverClassName="bg-lemon-100 border-lemon-400"
            >
              <span>{{ props.questions.type }} {{ index + 1 }}</span>
            </Droppable>

            <Draggable
              v-else
              :id="placedItems[index]!.id"
              :class="
                cn(
                  'flex min-h-72 w-full flex-col items-center justify-center rounded border border-picton-blue-200 p-4',
                  isComplete && props.feedback === 'wrong-correct' && feedbacks[index]
                    ? 'bg-green-100 text-green-800 border-green-500'
                    : isComplete && props.feedback === 'wrong-correct' && !feedbacks[index]
                      ? 'bg-red-100 text-red-800 border-red-500'
                      : 'bg-lemon-100 text-lemon-700',
                )
              "
            >
              <p v-if="!props.questions.hideWords" class="mb-2 text-center">{{ placedItems[index]!.question }}</p>
              <img
                v-if="placedItems[index]!.image"
                :src="placedItems[index]!.image"
                :alt="placedItems[index]!.question"
                class="grow h-32 w-full object-contain"
              >
              <template v-if="isComplete && props.feedback === 'wrong-correct'">
                <p class="mb-2 text-center">step {{ index + 1 }}</p>
                <div>
                  <span v-if="feedbacks[index]" class="text-green-600">✓</span>
                  <span v-else class="text-red-600">✕</span>
                </div>
              </template>
            </Draggable>
          </template>
        </div>

        <ActivityResults
          v-if="isComplete && props.feedback === 'wrong-correct' && !showAlertDialog"
          :score="score"
          :total="props.questions.questions.length"
          :onRestart="resetActivity"
        />
      </DNDContext>
    </template>

    <div
      v-else-if="shouldShowDetailedResults"
      class="flex h-full flex-col overflow-y-auto bg-picton-blue-100 p-6 text-lg"
    >
      <div class="rounded-lg bg-picton-blue-50 p-6">
        <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div
            v-for="(item, index) in placedItems"
            :key="index"
            :class="
              feedbacks[index]
                ? 'flex flex-col rounded-lg border border-green-200 bg-green-50 p-4'
                : 'flex flex-col rounded-lg border border-gray-200 bg-white p-4'
            "
          >
            <div class="mb-3 flex w-full items-center justify-between">
              <h3 class="flex items-center gap-2 text-lg font-medium">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-picton-blue-100 font-bold text-picton-blue-700">
                  {{ index + 1 }}
                </span>
                Step
              </h3>
              <div
                :class="
                  feedbacks[index]
                    ? 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600'
                    : 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600'
                "
              >
                {{ feedbacks[index] ? "✓" : "✕" }}
              </div>
            </div>

            <div v-if="feedbacks[index]" class="rounded-md border border-green-100 bg-green-50 p-3">
              <div class="flex flex-col items-center text-center">
                <p v-if="!props.questions.hideWords" class="mb-2 font-medium text-green-700">
                  {{ item?.question }}
                </p>
                <img
                  v-if="item?.image"
                  :src="item.image"
                  :alt="item.question"
                  class="mt-1 h-24 w-24 object-contain"
                >
              </div>
            </div>

            <div v-else class="space-y-3">
              <div class="rounded-md border border-red-100 bg-red-50 p-3">
                <p class="mb-1 text-sm font-medium text-red-600">Your Answer:</p>
                <div class="flex flex-col items-center text-center">
                  <p v-if="!props.questions.hideWords" class="text-gray-700">
                    {{ item?.question || "No step placed" }}
                  </p>
                  <img
                    v-if="item?.image"
                    :src="item.image"
                    :alt="item.question"
                    class="mt-1 h-20 w-20 object-contain"
                  >
                </div>
              </div>

              <div class="rounded-md border border-green-100 bg-green-50 p-3">
                <p class="mb-1 text-sm font-medium text-green-600">Correct Step:</p>
                <div class="flex flex-col items-center text-center">
                  <p v-if="!props.questions.hideWords" class="text-gray-700">
                    {{ props.questions.questions[index].question }}
                  </p>
                  <img
                    v-if="props.questions.questions[index].image"
                    :src="props.questions.questions[index].image"
                    :alt="props.questions.questions[index].question"
                    class="mt-1 h-20 w-20 object-contain"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults :score="score" :total="props.questions.questions.length" :onRestart="resetActivity" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="showAlertDialog"
      :onOpenChange="
        (open: boolean) => {
          showAlertDialog = open;
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
          }
        }
      "
    />
  </div>
</template>
