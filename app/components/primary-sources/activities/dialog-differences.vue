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
const keyboardStatusId = "dialog-differences-keyboard-status";
const selectedKeyboardItemId = ref<string | null>(null);

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

/** Picture-to-label rows: fixed column is image-only; opposite data side carries answer text for the bank. */
const isImageOnlyFixedColumnMode = (questions: Questions) => {
  if (!questions.lockSide || !shouldUseImageDraggableMode(questions)) return false;

  const lockedItems = questions.items.filter((item) => item.side === questions.lockSide);
  const oppositeItems = questions.items.filter((item) => item.side !== questions.lockSide);

  return (
    lockedItems.length > 0 &&
    lockedItems.every((item) => Boolean(item.image) && !item.text?.trim()) &&
    oppositeItems.some((item) => Boolean(item.text?.trim())) &&
    oppositeItems.every((item) => !item.image)
  );
};

const getFixedSourceSide = (questions: Questions) => {
  if (!questions.lockSide) return null;
  if (!shouldUseImageDraggableMode(questions)) return questions.lockSide;
  return isImageOnlyFixedColumnMode(questions)
    ? questions.lockSide
    : getOppositeSide(questions.lockSide);
};

const getDraggableSourceSide = (questions: Questions) => {
  if (!questions.lockSide) return null;
  if (!shouldUseImageDraggableMode(questions)) return getOppositeSide(questions.lockSide);
  return isImageOnlyFixedColumnMode(questions)
    ? getOppositeSide(questions.lockSide)
    : questions.lockSide;
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
  selectedKeyboardItemId.value = null;
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

const getItemLabel = (item: ListItem) => {
  if (item.text?.trim()) return item.text.trim();
  return item.image ? "Image card" : "Match item";
};

const getDropzoneLabel = (side: "left" | "right", index: number) =>
  `${side === "left" ? props.questions.leftLabel : props.questions.rightLabel} answer space ${index + 1}`;

const getFixedItemLabel = (item: ListItem, side: "left" | "right", index: number) =>
  `${side === "left" ? props.questions.leftLabel : props.questions.rightLabel} item ${index + 1}: ${getItemLabel(item)}`;

const pickKeyboardItem = (id: string) => {
  if (showResults.value) return;
  selectedKeyboardItemId.value = selectedKeyboardItemId.value === id ? null : id;
};

const clearKeyboardSelection = () => {
  selectedKeyboardItemId.value = null;
};

const onDraggableKeydown = (event: KeyboardEvent, id: string) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    pickKeyboardItem(id);
  }

  if (event.key === "Escape") {
    clearKeyboardSelection();
  }
};

const onDroppableKeydown = (event: KeyboardEvent, side: "left" | "right", index: number) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!selectedKeyboardItemId.value) return;

    handleDragEnd({
      active: { id: selectedKeyboardItemId.value },
      over: { id: `${side}%${index}` },
    });
    selectedKeyboardItemId.value = null;
  }

  if (event.key === "Escape") {
    clearKeyboardSelection();
  }
};

const keyboardStatusMessage = computed(() =>
  selectedKeyboardItemId.value
    ? "Item selected. Tab to an empty answer space, then press Enter or Space to place it. Press Escape to cancel."
    : "Tab to an item card and press Enter or Space to select it. Then tab to an empty answer space and press Enter or Space to place it.",
);

const onResultsOpenChange = (open: boolean) => {
  if (!open) {
    selectedKeyboardItemId.value = null;
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
// Only hide caption when matching pure image→text (no label on the card). If the draggable has both
// image and text (e.g. Dialog one side fixed), show them side by side on the bluish cards.
const shouldRenderImageOnly = (item: ListItem) =>
  useImageDraggableMode.value && Boolean(item.image) && !item.text?.trim();

/** Image first, caption beside ([image][text]), light bluish / lemon cards */
const mediaRowClass =
  "flex w-full min-w-0 flex-row items-center gap-3 text-start";
const mediaImageClass =
  "max-h-32 w-auto max-w-[42%] shrink-0 object-contain select-none sm:max-w-[12rem]";
const bankImageClass =
  "pointer-events-none max-h-[118px] w-auto max-w-[38%] shrink-0 object-contain select-none sm:max-w-44";
const mediaCaptionClass =
  "min-w-0 flex-1 text-start text-base leading-relaxed sm:text-lg sm:leading-snug";

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Match the related items from the two sides. Drag with a pointer, or use the visible item cards
      and answer areas with the keyboard. Press Enter or Space on an item card to select it, Tab to
      an empty answer area, then press Enter or Space again to place it. Press Escape to cancel a
      selection. Review the results after all spaces are filled.
    </p>
    <p :id="keyboardStatusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
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
                <span class="line-clamp-2 text-center text-ellipsis text-base sm:text-lg">{{
                  props.questions.leftLabel
                }}</span>
              </div>

              <div class="flex w-full flex-col justify-between md:gap-2">
                <template v-for="(item, index) in listA" :key="index">
                  <div
                    v-if="props.questions.lockSide === 'left'"
                    class="flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                    tabindex="0"
                    role="group"
                    :aria-label="item !== '' ? getFixedItemLabel(item, 'left', index) : getDropzoneLabel('left', index)"
                    :aria-describedby="instructionsId"
                  >
                    <div v-if="item !== ''" :class="mediaRowClass">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <p
                        v-if="renderItemContent(item).text?.trim()"
                        :class="mediaCaptionClass"
                      >
                        {{ renderItemContent(item).text }}
                      </p>
                    </div>
                  </div>

                  <Droppable
                    v-else-if="item === ''"
                    :id="`left%${index}`"
                    is-over-class-name="bg-lemon-100"
                    class="min-h-[135px] rounded border border-picton-blue-200 bg-white"
                    tabindex="0"
                    role="button"
                    :aria-label="getDropzoneLabel('left', index)"
                    :aria-describedby="`${instructionsId} ${keyboardStatusId}`"
                    :aria-disabled="!selectedKeyboardItemId"
                    @keydown="onDroppableKeydown($event, 'left', index)"
                  />

                  <div
                    v-else-if="showResults"
                    :class="
                      isCorrect(item)
                        ? 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-green-200 px-2 pr-10 text-center text-green-700 md:px-4 md:py-3'
                        : 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-red-200 px-2 pr-10 text-center text-red-700 md:px-4 md:py-3'
                    "
                  >
                    <div :class="mediaRowClass">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" :class="mediaCaptionClass">{{ renderItemContent(item).text }}</span>
                    </div>
                    <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                      {{ isCorrect(item) ? "✓" : "✕" }}
                    </span>
                  </div>

                  <Draggable
                    v-else
                    :id="`${item.id}%${index}%left`"
                    class="relative flex min-h-[135px] items-center justify-start rounded border border-picton-blue-200 bg-lemon-200 px-2 py-2 text-start text-base text-lemon-700 outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2 md:px-4 md:py-3 md:text-[length:inherit]"
                    tabindex="0"
                    role="button"
                    :aria-label="getItemLabel(item)"
                    :aria-describedby="`${instructionsId} ${keyboardStatusId}`"
                    :aria-pressed="selectedKeyboardItemId === `${item.id}%${index}%left`"
                    @keydown="onDraggableKeydown($event, `${item.id}%${index}%left`)"
                  >
                    <div :class="mediaRowClass">
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" :class="mediaCaptionClass">{{ item.text }}</span>
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
                    class="flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                    tabindex="0"
                    role="group"
                    :aria-label="item !== '' ? getFixedItemLabel(item, 'right', index) : getDropzoneLabel('right', index)"
                    :aria-describedby="instructionsId"
                  >
                    <div v-if="item !== ''" :class="mediaRowClass">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <p
                        v-if="renderItemContent(item).text?.trim()"
                        :class="mediaCaptionClass"
                      >
                        {{ renderItemContent(item).text }}
                      </p>
                    </div>
                  </div>

                  <Droppable
                    v-else-if="item === ''"
                    :id="`right%${index}`"
                    is-over-class-name="bg-lemon-100"
                    class="min-h-[135px] rounded border border-picton-blue-200 bg-white"
                    tabindex="0"
                    role="button"
                    :aria-label="getDropzoneLabel('right', index)"
                    :aria-describedby="`${instructionsId} ${keyboardStatusId}`"
                    :aria-disabled="!selectedKeyboardItemId"
                    @keydown="onDroppableKeydown($event, 'right', index)"
                  />

                  <div
                    v-else-if="showResults"
                    :class="
                      isCorrect(item)
                        ? 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-green-200 px-2 pr-10 text-center text-green-700 md:px-4 md:py-3'
                        : 'relative flex min-h-[135px] items-center justify-center rounded border border-picton-blue-200 bg-red-200 px-2 pr-10 text-center text-red-700 md:px-4 md:py-3'
                    "
                  >
                    <div :class="mediaRowClass">
                      <img
                        v-if="renderItemContent(item).image"
                        :src="renderItemContent(item).image"
                        :alt="renderItemContent(item).text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" :class="mediaCaptionClass">{{ renderItemContent(item).text }}</span>
                    </div>
                    <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(item) ? 'text-green-600' : 'text-red-600'">
                      {{ isCorrect(item) ? "✓" : "✕" }}
                    </span>
                  </div>

                  <Draggable
                    v-else
                    :id="`${item.id}%${index}%right`"
                    class="relative flex min-h-[135px] items-center justify-start rounded border border-picton-blue-200 bg-lemon-200 px-2 py-2 text-start text-base text-lemon-700 outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2 md:px-4 md:py-3 md:text-[length:inherit]"
                    tabindex="0"
                    role="button"
                    :aria-label="getItemLabel(item)"
                    :aria-describedby="`${instructionsId} ${keyboardStatusId}`"
                    :aria-pressed="selectedKeyboardItemId === `${item.id}%${index}%right`"
                    @keydown="onDraggableKeydown($event, `${item.id}%${index}%right`)"
                  >
                    <div :class="mediaRowClass">
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.text || ''"
                        draggable="false"
                        :class="mediaImageClass"
                      >
                      <span v-if="!shouldRenderImageOnly(item)" :class="mediaCaptionClass">{{ item.text }}</span>
                    </div>
                  </Draggable>
                </template>
              </div>

              <div
                class="flex max-h-[707px] items-center justify-center overflow-hidden bg-picton-blue-200 md:rotate-180 md:p-6 md:[writing-mode:vertical-rl]"
              >
                <span class="line-clamp-2 text-center text-ellipsis text-base sm:text-lg">{{
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
              class="absolute flex h-[135px] w-1/2 items-center rounded border border-picton-blue-300 bg-picton-blue-200 px-3 py-2 text-start text-base text-picton-blue-800 outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2 md:text-[length:inherit]"
              :style="{ left: `${index * (width > 768 ? 50 : 30)}px` }"
              tabindex="0"
              role="button"
              :aria-label="getItemLabel(item)"
              :aria-describedby="`${instructionsId} ${keyboardStatusId}`"
              :aria-pressed="selectedKeyboardItemId === item.id"
              @keydown="onDraggableKeydown($event, item.id)"
            >
              <div :class="[mediaRowClass, 'flex-1']">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.text || ''"
                  draggable="false"
                  :class="bankImageClass"
                >
                <span v-if="!shouldRenderImageOnly(item)" :class="mediaCaptionClass">{{ item.text }}</span>
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
