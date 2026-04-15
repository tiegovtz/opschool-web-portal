<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type ListItem = {
  id: string;
  text?: string;
  image?: string;
  side: "left" | "right";
};

type Questions = {
  title: string;
  fontSize?: string;
  leftLabel: string;
  rightLabel: string;
  lockSide: "left" | "right" | null;
  items: ListItem[];
};

type Props = {
  questions: Questions;
  feedback?: FeedbackType;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct-answers",
});

const { width } = useWindowSize();
const { playSound } = useSoundEffects();
const useImageDraggableMode = computed(() => shouldUseImageDraggableMode(props.questions));

const movableItems = ref<ListItem[]>([]);
const listA = ref<Array<ListItem | "">>([]);
const listB = ref<Array<ListItem | "">>([]);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const correctItems = ref<string[]>([]);
const instructionsId = "dialog-differences-instructions";

const getOppositeSide = (side: "left" | "right") => (side === "left" ? "right" : "left");

const shouldUseImageDraggableMode = (questions: Questions) => {
  if (!questions.lockSide) return false;

  const lockedItems = questions.items.filter((item) => item.side === questions.lockSide);
  const oppositeItems = questions.items.filter((item) => item.side !== questions.lockSide);

  return (
    lockedItems.some((item) => Boolean(item.image)) &&
    oppositeItems.some((item) => Boolean(item.text?.trim())) &&
    oppositeItems.every((item) => !item.image)
  );
};

const getFixedSourceSide = (questions: Questions) => {
  if (!questions.lockSide) return null;
  return shouldUseImageDraggableMode(questions)
    ? getOppositeSide(questions.lockSide)
    : questions.lockSide;
};

const getDraggableSourceSide = (questions: Questions) => {
  if (!questions.lockSide) return null;
  return shouldUseImageDraggableMode(questions)
    ? questions.lockSide
    : getOppositeSide(questions.lockSide);
};

const fillList = (side: "left" | "right", questions: Questions) => {
  const fixedSourceSide = getFixedSourceSide(questions);
  if (questions.lockSide && side === questions.lockSide && fixedSourceSide) {
    return questions.items.filter((item) => item.side === fixedSourceSide);
  }

  return Array.from({ length: questions.items.length / 2 }, () => "");
};

const initialize = () => {
  const draggableSourceSide = getDraggableSourceSide(props.questions);
  movableItems.value = shuffle(
    props.questions.lockSide && draggableSourceSide
      ? props.questions.items.filter((item) => item.side === draggableSourceSide)
      : props.questions.items,
  );
  listA.value = fillList("left", props.questions);
  listB.value = fillList("right", props.questions);
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  correctItems.value = [];
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

watch([listA, listB], () => {
  if (!listA.value.every((item) => item !== "") || !listB.value.every((item) => item !== "")) {
    allAnswered.value = false;
    return;
  }

  const correctIds: string[] = [];

  if (!props.questions.lockSide) {
    listA.value.forEach((item) => {
      if (item !== "" && item.side === "left") {
        correctIds.push(item.id);
      }
    });

    listB.value.forEach((item) => {
      if (item !== "" && item.side === "right") {
        correctIds.push(item.id);
      }
    });

    score.value = correctIds.length;
  } else {
    const draggableSourceSide = getDraggableSourceSide(props.questions);
    const correctOrder = props.questions.items.filter(
      (item) => item.side === draggableSourceSide,
    );
    const targetList = props.questions.lockSide === "left" ? listB.value : listA.value;

    correctOrder.forEach((item, index) => {
      if (targetList[index] !== "" && item.id === targetList[index].id) {
        correctIds.push(item.id);
      }
    });

    score.value = correctIds.length;
  }

  correctItems.value = correctIds;
  playSound("success");
  allAnswered.value = true;
}, { deep: true });

const handleDragEnd = (event: { active: { id: string }; over?: { id: string } }) => {
  const { active, over } = event;
  if (!over || showResults.value) return;

  const activeId = String(active.id);
  const [draggedId, sourceIndexRaw, sourceSide] = activeId.split("%");
  const [targetSide, targetIndexRaw] = String(over.id).split("%");
  const targetIndex = Number(targetIndexRaw);
  const sourceIndex = sourceIndexRaw ? Number(sourceIndexRaw) : null;

  const draggedItem = props.questions.items.find((item) => String(item.id) === draggedId);
  if (!draggedItem) return;

  if (targetSide === "left") {
    const next = [...listA.value];
    next[targetIndex] = draggedItem;
    listA.value = next;
  } else if (targetSide === "right") {
    const next = [...listB.value];
    next[targetIndex] = draggedItem;
    listB.value = next;
  }

  if (sourceSide === "left" && sourceIndex !== null) {
    const next = [...listA.value];
    next[sourceIndex] = "";
    listA.value = next;
  } else if (sourceSide === "right" && sourceIndex !== null) {
    const next = [...listB.value];
    next[sourceIndex] = "";
    listB.value = next;
  } else {
    movableItems.value = movableItems.value.filter((item) => String(item.id) !== draggedId);
  }

  playSound("click");
};

const onResultsOpenChange = (open: boolean) => {
  if (!open) {
    if (props.feedback === "none") {
      resetActivity();
    } else {
      showResults.value = true;
    }
    allAnswered.value = false;
  }
};

const renderItemContent = (item: ListItem) => item;

const isCorrect = (item: ListItem) => showResults.value && correctItems.value.includes(item.id);
const shouldRenderImageOnly = (item: ListItem) => useImageDraggableMode.value && Boolean(item.image);

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Match the related items from the two sides. Drag with a pointer, or use the visible item cards
      and answer areas with the keyboard where available. Review the results after all spaces are
      filled.
    </p>

    <div
      class="flex flex-col gap-4"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
      :aria-describedby="instructionsId"
    >
      <DNDContext :onDragEnd="handleDragEnd">
        <div>
          <div class="flex gap-1 md:gap-4">
            <div class="flex w-full flex-col gap-4 md:flex-row">
              <div
                class="flex max-h-[707px] items-center justify-center overflow-hidden bg-picton-blue-200 md:rotate-180 md:p-6 md:[writing-mode:vertical-rl]"
              >
                <span class="line-clamp-2 text-center text-ellipsis">{{
                  props.questions.leftLabel
                }}</span>
              </div>

              <div class="flex w-full flex-col justify-between md:gap-2">
                <template v-for="(item, index) in listA" :key="index">
                  <div
                    v-if="props.questions.lockSide === 'left'"
                    class="flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-white px-4 py-3"
                  >
                    <div v-if="item !== ''" class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <p class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ renderItemContent(item).text }}</p>
                    </div>
                  </div>

                  <Droppable
                    v-else-if="item === ''"
                    :id="`left%${index}`"
                    is-over-class-name="bg-lemon-100"
                    class="min-h-[135px] rounded border border-picton-blue-200 bg-white"
                  />

                  <div
                    v-else-if="showResults"
                    :class="
                      isCorrect(item)
                        ? 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-green-200 px-2 pr-10 text-center text-green-700 md:px-4 md:py-3'
                        : 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-red-200 px-2 pr-10 text-center text-red-700 md:px-4 md:py-3'
                    "
                  >
                    <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <span class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ renderItemContent(item).text }}</span>
                    </div>
                    <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                      {{ isCorrect(item) ? "✓" : "✕" }}
                    </span>
                  </div>

                  <Draggable
                    v-else
                    :id="`${item.id}%${index}%left`"
                    class="relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-lemon-200 px-2 py-2 text-center text-base text-lemon-700 md:px-4 md:py-3 md:text-[length:inherit]"
                  >
                    <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
                    </div>
                  </Draggable>
                </template>
              </div>
            </div>

            <div class="flex w-full flex-col-reverse gap-4 md:flex-row">
              <div class="flex w-full flex-col justify-between md:gap-2">
                <template v-for="(item, index) in listB" :key="index">
                  <div
                    v-if="props.questions.lockSide === 'right'"
                    class="flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-white px-4 py-3"
                  >
                    <div v-if="item !== ''" class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <p class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ renderItemContent(item).text }}</p>
                    </div>
                  </div>

                  <Droppable
                    v-else-if="item === ''"
                    :id="`right%${index}`"
                    is-over-class-name="bg-lemon-100"
                    class="min-h-[135px] rounded border border-picton-blue-200 bg-white"
                  />

                  <div
                    v-else-if="showResults"
                    :class="
                      isCorrect(item)
                        ? 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-green-200 px-2 pr-10 text-center text-green-700 md:px-4 md:py-3'
                        : 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-red-200 px-2 pr-10 text-center text-red-700 md:px-4 md:py-3'
                    "
                  >
                    <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ renderItemContent(item).text }}</span>
                    </div>
                    <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                      {{ isCorrect(item) ? "✓" : "✕" }}
                    </span>
                  </div>

                  <Draggable
                    v-else
                    :id="`${item.id}%${index}%right`"
                    class="relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-lemon-200 px-2 py-2 text-center text-base text-lemon-700 md:px-4 md:py-3 md:text-[length:inherit]"
                  >
                    <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.text || ''"
                        draggable="false"
                        class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
                    </div>
                  </Draggable>
                </template>
              </div>

              <div
                class="flex max-h-[707px] items-center justify-center overflow-hidden bg-picton-blue-200 md:rotate-180 md:p-6 md:[writing-mode:vertical-rl]"
              >
                <span class="line-clamp-2 text-center text-ellipsis">{{
                  props.questions.rightLabel
                }}</span>
              </div>
            </div>
          </div>

          <div v-if="!showResults" class="relative h-[130px]">
            <Draggable
              v-for="(item, index) in movableItems"
              :id="item.id"
              :key="item.id"
              class="absolute flex h-[135px] w-1/2 items-center rounded border border-picton-blue-300 bg-picton-blue-200 px-4 py-2 text-base text-picton-blue-700 md:text-[length:inherit]"
              :style="{ left: `${index * (width > 768 ? 50 : 30)}px` }"
            >
              <div
                class="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-3"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.text || ''"
                  draggable="false"
                  class="pointer-events-none max-h-[120px] w-full max-w-48 shrink-0 object-contain select-none"
                >
                <span v-if="!shouldRenderImageOnly(item)" class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
              </div>
            </Draggable>
          </div>
        </div>
      </DNDContext>

      <div v-if="showResults" class="mt-4">
        <ActivityResults
          :score="score"
          :total="props.questions.items.filter((item) => item.side !== props.questions.lockSide).length"
          :onRestart="resetActivity"
        />
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="props.questions.items.filter((item) => item.side !== props.questions.lockSide).length"
        :open="allAnswered"
        :onOpenChange="onResultsOpenChange"
      />
    </div>
  </div>
</template>
