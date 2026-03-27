<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
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

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct-answers",
});

const { width } = useWindowSize();
const { playSound } = useSoundEffects();

const movableItems = ref<ListItem[]>([]);
const listA = ref<Array<ListItem | "">>([]);
const listB = ref<Array<ListItem | "">>([]);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const correctItems = ref<string[]>([]);

const fillList = (side: "left" | "right", questions: Questions) => {
  if (questions.lockSide === "left" && side === "left") {
    return questions.items.filter((item) => item.side === "left");
  }
  if (questions.lockSide === "right" && side === "right") {
    return questions.items.filter((item) => item.side === "right");
  }

  return Array.from({ length: questions.items.length / 2 }, () => "");
};

const initialize = () => {
  movableItems.value = shuffle(
    props.questions.items.filter((item) => item.side !== props.questions.lockSide),
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
    const correctOrder = props.questions.items.filter(
      (item) => item.side !== props.questions.lockSide,
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

const handleDragEnd = (event: DragEndEvent) => {
  const activeValue = String(event.active?.id || "");
  const overValue = String(event.over?.id || "");
  if (!activeValue || !overValue) return;

  const [activeId, activeIndex = "", activeSide = ""] = activeValue.split("%");
  const [overSide, overIndexValue] = overValue.split("%");
  const overIndex = Number(overIndexValue);

  const activeItem = props.questions.items.find((item) => Number(item.id) === Number(activeId));
  if (!activeItem) return;

  if (overSide === "left") {
    const nextList = [...listA.value];
    nextList[overIndex] = activeItem;
    listA.value = nextList;
  } else {
    const nextList = [...listB.value];
    nextList[overIndex] = activeItem;
    listB.value = nextList;
  }

  playSound("click");

  if (activeIndex) {
    if (activeSide === "left") {
      const nextList = [...listA.value];
      nextList[Number(activeIndex)] = "";
      listA.value = nextList;
    } else if (activeSide === "right") {
      const nextList = [...listB.value];
      nextList[Number(activeIndex)] = "";
      listB.value = nextList;
    }
  }

  movableItems.value = movableItems.value.filter((item) => Number(item.id) !== Number(activeId));
};

const renderItemContent = (item: ListItem) => item;

const isCorrect = (item: ListItem) => showResults.value && correctItems.value.includes(item.id);

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      class="flex flex-col gap-4"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
    >
      <DNDContext :onDragEnd="handleDragEnd">
        <div class="flex gap-1 md:gap-4">
          <div class="flex w-full flex-col gap-4 md:flex-row">
            <div class="flex max-h-[707px] items-center justify-center overflow-hidden bg-picton-blue-200 md:rotate-180 md:p-6 md:[writing-mode:vertical-rl]">
              <span class="line-clamp-2 text-center">{{ props.questions.leftLabel }}</span>
            </div>

            <div class="flex w-full flex-col justify-between md:gap-2">
              <template v-for="(item, index) in listA" :key="index">
                <div
                  v-if="props.questions.lockSide === 'left'"
                  class="flex h-[135px] items-center rounded border border-picton-blue-200 bg-white px-4 py-2"
                >
                  <div v-if="item !== ''" class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="renderItemContent(item).image"
                      :src="renderItemContent(item).image"
                      :alt="renderItemContent(item).text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <p class="text-sm sm:text-base">{{ renderItemContent(item).text }}</p>
                  </div>
                </div>

                <Droppable
                  v-else-if="item === ''"
                  :id="`left%${index}`"
                  class="h-[135px] rounded border border-picton-blue-200 bg-white"
                  isOverClassName="bg-lemon-100"
                />

                <div
                  v-else-if="showResults"
                  :class="
                    isCorrect(item)
                      ? 'relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-green-200 px-2 text-green-700 md:px-4 md:py-2'
                      : 'relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-red-200 px-2 text-red-700 md:px-4 md:py-2'
                  "
                >
                  <div class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="renderItemContent(item).image"
                      :src="renderItemContent(item).image"
                      :alt="renderItemContent(item).text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <span class="text-sm sm:text-base">{{ renderItemContent(item).text }}</span>
                  </div>
                  <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                    {{ isCorrect(item) ? "✓" : "✕" }}
                  </span>
                </div>

                <Draggable
                  v-else
                  :id="`${item.id}%${index}%left`"
                  class="relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-lemon-200 px-2 text-base text-lemon-700 md:px-4 md:py-2 md:text-[length:inherit]"
                >
                  <div class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <span class="text-sm sm:text-base">{{ item.text }}</span>
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
                  class="flex h-[135px] items-center rounded border border-picton-blue-200 bg-white px-4 py-2"
                >
                  <div v-if="item !== ''" class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="renderItemContent(item).image"
                      :src="renderItemContent(item).image"
                      :alt="renderItemContent(item).text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <p class="text-sm sm:text-base">{{ renderItemContent(item).text }}</p>
                  </div>
                </div>

                <Droppable
                  v-else-if="item === ''"
                  :id="`right%${index}`"
                  class="h-[135px] rounded border border-picton-blue-200 bg-white"
                  isOverClassName="bg-lemon-100"
                />

                <div
                  v-else-if="showResults"
                  :class="
                    isCorrect(item)
                      ? 'relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-green-200 px-2 text-green-700 md:px-4 md:py-2'
                      : 'relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-red-200 px-2 text-red-700 md:px-4 md:py-2'
                  "
                >
                  <div class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="renderItemContent(item).image"
                      :src="renderItemContent(item).image"
                      :alt="renderItemContent(item).text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <span class="text-sm sm:text-base">{{ renderItemContent(item).text }}</span>
                  </div>
                  <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                    {{ isCorrect(item) ? "✓" : "✕" }}
                  </span>
                </div>

                <Draggable
                  v-else
                  :id="`${item.id}%${index}%right`"
                  class="relative flex h-[135px] items-center rounded border border-picton-blue-200 bg-lemon-200 px-2 text-base text-lemon-700 md:px-4 md:py-2 md:text-[length:inherit]"
                >
                  <div class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.text || ''"
                      class="h-full max-w-48 w-full object-contain"
                    >
                    <span class="text-sm sm:text-base">{{ item.text }}</span>
                  </div>
                </Draggable>
              </template>
            </div>

            <div class="flex max-h-[707px] items-center justify-center overflow-hidden bg-picton-blue-200 md:rotate-180 md:p-6 md:[writing-mode:vertical-rl]">
              <span class="line-clamp-2 text-center">{{ props.questions.rightLabel }}</span>
            </div>
          </div>
        </div>

        <div v-if="!showResults" class="relative h-[130px]">
          <Draggable
            v-for="(item, index) in movableItems"
            :key="item.id"
            :id="item.id"
            class="absolute flex h-[135px] w-1/2 items-center rounded border border-picton-blue-300 bg-picton-blue-200 px-4 py-2 text-base text-picton-blue-700 md:text-[length:inherit]"
            :style="{ left: `${index * (width > 768 ? 50 : 30)}px` }"
          >
            <div class="flex h-full w-fit flex-col gap-1 md:flex-row md:items-center md:gap-4">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.text || ''"
                class="h-full max-w-48 w-full object-contain"
              >
              <span class="text-sm sm:text-base">{{ item.text }}</span>
            </div>
          </Draggable>
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
        :onOpenChange="
          (open: boolean) => {
            if (!open) {
              if (props.feedback === 'none') {
                resetActivity();
              } else {
                showResults = true;
              }
              allAnswered = false;
            }
          }
        "
      />
    </div>
  </div>
</template>
