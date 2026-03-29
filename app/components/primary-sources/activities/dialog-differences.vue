<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from "vue";
import { shuffle } from "@/lib/utils";
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

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct-answers",
});

const { playSound } = useSoundEffects();

const movableItems = ref<ListItem[]>([]);
/** Pool selection — click option then click an empty slot (same flow as In Which Box). */
const selectedItemId = ref<string | null>(null);
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
  selectedItemId.value = null;
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

const togglePoolSelection = (id: string) => {
  if (showResults.value) return;
  const sid = String(id);
  selectedItemId.value = selectedItemId.value != null && String(selectedItemId.value) === sid ? null : sid;
};

const placeInSlot = (side: "left" | "right", index: number) => {
  if (showResults.value) return;
  const selected = movableItems.value.find((i) => String(i.id) === String(selectedItemId.value));
  if (!selected) return;

  if (side === "left") {
    const next = [...listA.value];
    next[index] = selected;
    listA.value = next;
  } else {
    const next = [...listB.value];
    next[index] = selected;
    listB.value = next;
  }

  movableItems.value = movableItems.value.filter((i) => String(i.id) !== String(selected.id));
  selectedItemId.value = null;
  playSound("click");
};

const returnFromSlot = (side: "left" | "right", index: number) => {
  if (showResults.value) return;
  const listRef = side === "left" ? listA : listB;
  const item = listRef.value[index];
  if (!item || item === "") return;

  movableItems.value = shuffle([...movableItems.value, item]);
  const next = [...listRef.value];
  next[index] = "";
  listRef.value = next;
  selectedItemId.value = null;
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

                <button
                  v-else-if="item === ''"
                  type="button"
                  aria-label="Place selected answer"
                  class="min-h-[135px] w-full rounded border-2 border-dashed border-gray-300 bg-white transition hover:bg-slate-50 cursor-pointer touch-manipulation"
                  @click="placeInSlot('left', index)"
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

                <button
                  v-else
                  type="button"
                  class="relative flex min-h-[135px] w-full cursor-pointer items-center justify-center rounded border border-sky-200 bg-sky-50 px-2 py-2 text-center text-base text-gray-800 transition hover:bg-sky-100 md:px-4 md:py-3 md:text-[length:inherit] touch-manipulation"
                  @click="returnFromSlot('left', index)"
                >
                  <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.text || ''"
                      draggable="false"
                      class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                    >
                    <span class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
                  </div>
                </button>
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

                <button
                  v-else-if="item === ''"
                  type="button"
                  aria-label="Place selected answer"
                  class="min-h-[135px] w-full rounded border-2 border-dashed border-gray-300 bg-white transition hover:bg-slate-50 cursor-pointer touch-manipulation"
                  @click="placeInSlot('right', index)"
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

                <button
                  v-else
                  type="button"
                  class="relative flex min-h-[135px] w-full cursor-pointer items-center justify-center rounded border border-sky-200 bg-sky-50 px-2 py-2 text-center text-base text-gray-800 transition hover:bg-sky-100 md:px-4 md:py-3 md:text-[length:inherit] touch-manipulation"
                  @click="returnFromSlot('right', index)"
                >
                  <div class="flex w-full min-w-0 flex-col items-center justify-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-4">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.text || ''"
                      draggable="false"
                      class="max-h-32 w-full max-w-48 shrink-0 object-contain select-none"
                    >
                    <span class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
                  </div>
                </button>
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

        <div
          v-if="!showResults"
          class="flex min-h-[135px] w-full flex-wrap gap-2 border-t border-gray-200 bg-slate-50 py-3"
        >
          <button
            v-for="item in movableItems"
            :key="item.id"
            type="button"
            :class="[
              'flex min-h-[135px] min-w-[140px] max-w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-md px-3 py-3 text-center text-gray-900 shadow-sm transition sm:min-w-[180px] sm:max-w-[calc(50%-4px)] md:px-4 md:text-[length:inherit] touch-manipulation select-none',
              selectedItemId != null && String(selectedItemId) === String(item.id)
                ? 'border-2 border-sky-400 bg-sky-100 hover:bg-sky-200 ring-2 ring-sky-600 ring-offset-2 ring-offset-white'
                : 'border-2 border-emerald-950/30 bg-sky-50 hover:bg-sky-100/80',
            ]"
            @click="togglePoolSelection(String(item.id))"
          >
            <div
              class="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 text-gray-900 md:flex-row md:items-center md:justify-center md:gap-3"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.text || ''"
                draggable="false"
                class="pointer-events-none max-h-[120px] max-w-48 w-full shrink-0 object-contain select-none"
              >
              <span class="min-w-0 flex-1 break-words text-center text-sm leading-snug sm:text-base">{{ item.text }}</span>
            </div>
          </button>
        </div>
      </div>

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
