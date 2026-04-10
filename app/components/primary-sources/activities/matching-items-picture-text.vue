<script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper.vue";
import type { GameStats } from "@/components/ui/game-mode/types";
import { useSoundEffects } from "~/composables/use-sound-effects";

interface MatchingItem {
  id: string;
  content: string | { color: string } | { imageSrc: string };
}

interface Point {
  x: number;
  y: number;
}

interface Connection {
  "start-key": string;
  "start-position": Point;
  "end-key": string;
  "end-position": Point;
  isCorrect?: boolean;
}

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    category: "text-to-text" | "image-to-text" | "image-to-image";
    leftItems: MatchingItem[];
    rightItems: MatchingItem[];
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    useStrict?: boolean;
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();
const { width } = useWindowSize();

const boardRef = ref<HTMLElement | null>(null);
const SCROLL_EDGE_THRESHOLD = 72;
const SCROLL_STEP = 28;
const DRAG_START_THRESHOLD = 6;
const completedObjectIds = ref<number[]>([]);
const connections = ref<Connection[]>([]);
const recalculatedConnections = ref<Connection[]>([]);
const dragStart = ref<Point | null>(null);
const dragEnd = ref<Point | null>(null);
const selectedLeftId = ref<string | null>(null);
const activeDragLeftId = ref<string | null>(null);
const hoverDropId = ref<string | null>(null);
const dragStartClient = ref<Point | null>(null);
const lastPointerClient = ref<Point | null>(null);
const hasDragMoved = ref(false);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const timeUp = ref(false);
const isResetting = ref(false);
const completedPairs = ref(new Set<number>());
const incorrectAttempts = ref(new Set<number>());
const shuffledRightItems = ref<MatchingItem[]>([]);

const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: 6,
  autoFetch: !!props.questions.isGameMode,
});

const getGameItems = () => {
  if (!props.questions.isGameMode) {
    return {
      leftItems: props.questions.leftItems,
      rightItems: props.questions.rightItems,
    };
  }

  if (props.questions.category === "image-to-text") {
    return {
      leftItems: objects.value.map((obj) => ({
        id: String(obj.id),
        content: { imageSrc: getImageUrl(obj.imagePath, true) },
      })),
      rightItems: objects.value.map((obj) => ({
        id: String(obj.id),
        content: obj.syllables || obj.name,
      })),
    };
  }

  return {
    leftItems: objects.value.map((obj) => ({
      id: String(obj.id),
      content: obj.name,
    })),
    rightItems: objects.value.map((obj) => ({
      id: String(obj.id),
      content: obj.syllables || obj.name,
    })),
  };
};

const leftItems = computed(() => getGameItems().leftItems);
const rightItems = computed(() => getGameItems().rightItems);
const totalPairs = computed(() => leftItems.value.length);
const renderedLeftItems = computed(() => shuffledRightItems.value);
const renderedRightItems = computed(() => leftItems.value);

const resetRoundState = () => {
  connections.value = [];
  recalculatedConnections.value = [];
  dragStart.value = null;
  dragEnd.value = null;
  selectedLeftId.value = null;
  activeDragLeftId.value = null;
  hoverDropId.value = null;
  dragStartClient.value = null;
  lastPointerClient.value = null;
  hasDragMoved.value = false;
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  timeUp.value = false;
  completedPairs.value = new Set();
  incorrectAttempts.value = new Set();
};

watch(
  [() => leftItems.value, () => rightItems.value, loading],
  ([left, right, isLoading]) => {
    if (isLoading || !left.length || !right.length) return;

    resetRoundState();
    shuffledRightItems.value = shuffle([...right]);
  },
  { immediate: true },
);

watch(
  connections,
  (value) => {
    if (value.length !== leftItems.value.length || !leftItems.value.length) return;

    const correctConnections = value.filter((connection) => connection.isCorrect);
    score.value = correctConnections.length;
    allAnswered.value = true;

    if (props.questions.isGameMode) {
      const completedSet = new Set<number>();
      value.forEach((_, index) => completedSet.add(index));
      completedPairs.value = completedSet;
    }
  },
  { deep: true },
);

watch(
  [showResults, width],
  async ([resultsVisible]) => {
    if (!resultsVisible || !connections.value.length) return;

    await nextTick();
    refreshConnectionPositions();
  },
  { flush: "post" },
);

const boardFontSize = computed(() => {
  if (width.value <= 640) return "14px";
  return props.questions.fontSize ? `${props.questions.fontSize}px` : "20px";
});

const isImageItem = (item?: MatchingItem | null) =>
  !!item && typeof item.content !== "string" && "imageSrc" in item.content;

const getItemValue = (item?: MatchingItem | null) => {
  if (!item) return "";
  if (typeof item.content === "string") return item.content;
  if ("imageSrc" in item.content) return item.content.imageSrc;
  return "";
};

const getRelativePoint = (clientX: number, clientY: number): Point | null => {
  if (!boardRef.value) return null;

  const boardRect = boardRef.value.getBoundingClientRect();
  return {
    x: clientX - boardRect.left + boardRef.value.scrollLeft,
    y: clientY - boardRect.top + boardRef.value.scrollTop,
  };
};

const getElementPoint = (element: HTMLElement, side: "start" | "end"): Point | null => {
  if (!boardRef.value) return null;

  const boardRect = boardRef.value.getBoundingClientRect();
  const rect = element.getBoundingClientRect();

  return {
    x:
      (side === "start" ? rect.right - boardRect.left : rect.left - boardRect.left)
      + boardRef.value.scrollLeft,
    y: rect.top + rect.height / 2 - boardRect.top + boardRef.value.scrollTop,
  };
};

const refreshConnectionPositions = () => {
  recalculatedConnections.value = connections.value.map((connection) => {
    const startEl = document.getElementById(connection["start-key"]);
    const endEl = document.getElementById(connection["end-key"]);

    if (!(startEl instanceof HTMLElement) || !(endEl instanceof HTMLElement)) {
      return connection;
    }

    const startPosition = getElementPoint(startEl, "start");
    const endPosition = getElementPoint(endEl, "end");

    if (!startPosition || !endPosition) {
      return connection;
    }

    return {
      ...connection,
      "start-position": startPosition,
      "end-position": endPosition,
    };
  });
};

const findHoveredRightTarget = (clientX: number, clientY: number) => {
  for (const item of renderedRightItems.value) {
    const element = document.getElementById(`right-${item.id}`);
    if (!(element instanceof HTMLElement)) continue;

    const rect = element.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return `right-${item.id}`;
    }
  }

  return null;
};

const clearDragPreview = () => {
  dragStart.value = null;
  dragEnd.value = null;
  hoverDropId.value = null;
};

const connectItems = (leftId: string, rightId: string) => {
  const activeId = `left-${leftId}`;
  const overId = `right-${rightId}`;
  const activeEl = document.getElementById(activeId);
  const overEl = document.getElementById(overId);

  playSound("click");

  if (!(activeEl instanceof HTMLElement) || !(overEl instanceof HTMLElement)) {
    return;
  }

  const startPosition = getElementPoint(activeEl, "start");
  const endPosition = getElementPoint(overEl, "end");

  if (!startPosition || !endPosition) return;

  const leftItem = leftItems.value.find((item) => String(item.id) === leftId);
  const rightItem = rightItems.value.find((item) => String(item.id) === rightId);
  const isCorrect = leftItem?.id === rightItem?.id;

  connections.value = [
    ...connections.value.filter(
      (connection) =>
        connection["start-key"] !== activeId &&
        connection["end-key"] !== overId,
    ),
    {
      "start-key": activeId,
      "start-position": startPosition,
      "end-key": overId,
      "end-position": endPosition,
      isCorrect,
    },
  ];

  if (!isCorrect && props.questions.isGameMode) {
    incorrectAttempts.value = new Set([
      ...incorrectAttempts.value,
      Date.now() + Math.random(),
    ]);
  }
};

let autoScrollFrame: number | null = null;

const stopAutoScroll = () => {
  if (autoScrollFrame !== null) {
    window.cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }
};

const updateDragFromClientPoint = (clientX: number, clientY: number) => {
  lastPointerClient.value = { x: clientX, y: clientY };
  hoverDropId.value = findHoveredRightTarget(clientX, clientY);

  const nextPoint = getRelativePoint(clientX, clientY);
  if (nextPoint) {
    dragEnd.value = nextPoint;
  }
};

const runAutoScroll = () => {
  if (!activeDragLeftId.value || !boardRef.value || !lastPointerClient.value) {
    stopAutoScroll();
    return;
  }

  const container = boardRef.value;
  const rect = container.getBoundingClientRect();
  const { x, y } = lastPointerClient.value;

  const nextScrollLeft = (() => {
    if (x < rect.left + SCROLL_EDGE_THRESHOLD) return -SCROLL_STEP;
    if (x > rect.right - SCROLL_EDGE_THRESHOLD) return SCROLL_STEP;
    return 0;
  })();

  const nextScrollTop = (() => {
    if (y < rect.top + SCROLL_EDGE_THRESHOLD) return -SCROLL_STEP;
    if (y > rect.bottom - SCROLL_EDGE_THRESHOLD) return SCROLL_STEP;
    return 0;
  })();

  if (nextScrollLeft || nextScrollTop) {
    container.scrollBy({
      left: nextScrollLeft,
      top: nextScrollTop,
      behavior: "auto",
    });
    updateDragFromClientPoint(x, y);
  }

  autoScrollFrame = window.requestAnimationFrame(runAutoScroll);
};

const startAutoScroll = () => {
  if (autoScrollFrame !== null) return;
  autoScrollFrame = window.requestAnimationFrame(runAutoScroll);
};

const removePointerListeners = () => {
  window.removeEventListener("pointermove", handleWindowPointerMove);
  window.removeEventListener("pointerup", handleWindowPointerUp);
  window.removeEventListener("pointercancel", handleWindowPointerCancel);
};

const finishPointerInteraction = () => {
  removePointerListeners();
  stopAutoScroll();
  activeDragLeftId.value = null;
  dragStartClient.value = null;
  lastPointerClient.value = null;
  hasDragMoved.value = false;
  clearDragPreview();
};

const handleWindowPointerMove = (event: PointerEvent) => {
  if (!activeDragLeftId.value) return;
  if (event.cancelable) {
    event.preventDefault();
  }

  if (dragStartClient.value && !hasDragMoved.value) {
    const distance = Math.hypot(
      event.clientX - dragStartClient.value.x,
      event.clientY - dragStartClient.value.y,
    );
    if (distance >= DRAG_START_THRESHOLD) {
      hasDragMoved.value = true;
    }
  }

  updateDragFromClientPoint(event.clientX, event.clientY);
  startAutoScroll();
};

const handleWindowPointerUp = () => {
  if (!activeDragLeftId.value) return;

  const leftId = activeDragLeftId.value;
  const rightId = hoverDropId.value?.replace(/^right-/, "") || null;
  const moved = hasDragMoved.value;

  if (rightId) {
    connectItems(leftId, rightId);
    selectedLeftId.value = null;
  } else if (!moved) {
    selectedLeftId.value = selectedLeftId.value === leftId ? null : leftId;
  }

  finishPointerInteraction();
};

const handleWindowPointerCancel = () => {
  finishPointerInteraction();
};

const handleLeftItemPointerDown = (event: PointerEvent, leftId: string) => {
  if (showResults.value || timeUp.value) return;
  if (event.pointerType !== "touch" && event.button !== 0) return;

  event.preventDefault();

  removePointerListeners();
  stopAutoScroll();

  activeDragLeftId.value = leftId;
  dragStartClient.value = { x: event.clientX, y: event.clientY };
  lastPointerClient.value = { x: event.clientX, y: event.clientY };
  hasDragMoved.value = false;

  const startEl = document.getElementById(`left-${leftId}`);
  if (startEl instanceof HTMLElement) {
    dragStart.value = getElementPoint(startEl, "start");
  }
  dragEnd.value = getRelativePoint(event.clientX, event.clientY) || dragStart.value;
  hoverDropId.value = findHoveredRightTarget(event.clientX, event.clientY);

  window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
  window.addEventListener("pointerup", handleWindowPointerUp);
  window.addEventListener("pointercancel", handleWindowPointerCancel);
  startAutoScroll();
};

const handleRightItemSelect = (rightId: string) => {
  if (showResults.value || timeUp.value || !selectedLeftId.value) return;

  connectItems(selectedLeftId.value, rightId);
  selectedLeftId.value = null;
};

onBeforeUnmount(() => {
  finishPointerInteraction();
});

const endKeyHasConnection = (id: string) =>
  connections.value.some((connection) => connection["end-key"] === id);

const connectionByStartKey = (id: string) =>
  connections.value.find((connection) => connection["start-key"] === id);

const connectionByEndKey = (id: string) =>
  connections.value.find((connection) => connection["end-key"] === id);

const handleGameTimeUp = () => {
  if (!allAnswered.value && !timeUp.value) {
    timeUp.value = true;
    allAnswered.value = true;
    playSound("failure");
  }
};

const handleGameComplete = (_stats: GameStats) => {
  if (!allAnswered.value && !timeUp.value) {
    allAnswered.value = true;
  }
};

const handleShowResults = async () => {
  isResetting.value = true;
  allAnswered.value = false;
  showResults.value = true;

  await nextTick();
  refreshConnectionPositions();

  window.setTimeout(() => {
    isResetting.value = false;
  }, 50);
};

const handleRestart = async () => {
  isResetting.value = true;
  resetRoundState();

  if (props.questions.isGameMode) {
    const updatedIds = [
      ...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)]),
    ];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
  } else {
    shuffledRightItems.value = shuffle([...props.questions.rightItems]);
  }

  window.setTimeout(() => {
    isResetting.value = false;
  }, 100);
};

const connectionsToRender = computed(() =>
  showResults.value && recalculatedConnections.value.length
    ? recalculatedConnections.value
    : connections.value,
);

const buildLinePresentation = (
  start: Point,
  end: Point,
  key: string,
  isCorrect?: boolean,
) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const lineBackground = showResults.value
    ? isCorrect
      ? "linear-gradient(to right, #22c55e 8px, transparent 8px)"
      : "linear-gradient(to right, #ef4444 8px, transparent 8px)"
    : "linear-gradient(to right, #a17507 5px, transparent 5px)";

  const lineWidth = showResults.value ? (isCorrect ? "4px" : "3px") : "2px";
  const dotClass = showResults.value
    ? isCorrect
      ? "bg-green-500"
      : "bg-red-500"
    : "bg-lemon-700";

  return {
    key,
    startCircleClass: dotClass,
    endCircleClass: dotClass,
    startCircleStyle: {
      left: `${start.x - (showResults.value ? 6 : 5)}px`,
      top: `${start.y - (showResults.value ? 6 : 5)}px`,
      width: showResults.value ? "12px" : "10px",
      height: showResults.value ? "12px" : "10px",
      boxShadow: showResults.value ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
    },
    lineStyle: {
      left: `${start.x}px`,
      top: `${start.y}px`,
      width: `${distance}px`,
      height: lineWidth,
      backgroundImage: lineBackground,
      backgroundSize: showResults.value ? `16px ${lineWidth}` : `10px ${lineWidth}`,
      transform: `rotate(${angle}deg)`,
      boxShadow: showResults.value ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
    },
    endCircleStyle: {
      left: `${end.x - (showResults.value ? 6 : 5)}px`,
      top: `${end.y - (showResults.value ? 6 : 5)}px`,
      width: showResults.value ? "12px" : "10px",
      height: showResults.value ? "12px" : "10px",
      boxShadow: showResults.value ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
    },
  };
};

const renderedConnections = computed(() =>
  connectionsToRender.value.map((connection) =>
    buildLinePresentation(
      connection["start-position"],
      connection["end-position"],
      `${connection["start-key"]}-${connection["end-key"]}`,
      connection.isCorrect,
    ),
  ),
);

const liveDragLine = computed(() => {
  if (!dragStart.value || !dragEnd.value || showResults.value) return null;
  return buildLinePresentation(dragStart.value, dragEnd.value, "drag-line");
});
</script>

<template>
  <div v-if="props.questions.isGameMode && loading" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">Loading objects...</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && error" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold text-red-700">Error loading objects: {{ error }}</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && !leftItems.length" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">No objects found for the specified criteria</h1>
  </div>

  <GameModeWrapper
    v-else
    class="h-full"
    :is-game-mode="!!props.questions.isGameMode"
    :total-questions="totalPairs"
    :completed-questions="completedPairs"
    :incorrect-questions="incorrectAttempts"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <div class="flex h-full flex-col text-lg">
      <ActivityTitle :title="props.questions.title" />

      

      <div
        ref="boardRef"
        class="relative flex h-full justify-between overflow-auto md:p-4"
        :style="{ fontSize: boardFontSize }"
      >
        <div
          :class="
            cn('flex flex-col justify-evenly space-y-4', {
              'w-[30%]': props.questions.category === 'text-to-text',
              'md:w-[15%]':
                props.questions.category === 'image-to-image'
                || props.questions.category === 'image-to-text',
            })
          "
        >
          <div
            v-for="item in renderedLeftItems"
            :id="`left-${item.id}`"
            :key="item.id"
            :class="
              cn(
                'relative flex w-full select-none items-center justify-center rounded-lg bg-picton-blue-200 p-1 md:p-4',
                props.questions.category === 'text-to-text' && 'min-h-20',
                !showResults && !timeUp && 'cursor-grab active:cursor-grabbing',
                !showResults && selectedLeftId === item.id && 'ring-2 ring-picton-blue-500 ring-offset-2',
                !showResults && activeDragLeftId === item.id && 'scale-[1.01] shadow-lg',
                showResults && 'cursor-default',
                showResults && connectionByStartKey(`left-${item.id}`)?.isCorrect && 'border-2 border-green-300 bg-green-100',
                showResults && connectionByStartKey(`left-${item.id}`) && !connectionByStartKey(`left-${item.id}`)?.isCorrect && 'border-2 border-red-300 bg-red-100',
              )
            "
            @pointerdown="handleLeftItemPointerDown($event, item.id)"
          >
            <span class="pointer-events-none">
              <div v-if="isImageItem(item)" class="max-h-[400px] w-20 md:w-36">
                <img
                  :src="getItemValue(item)"
                  :alt="item.id"
                  class="pointer-events-none h-full w-full select-none object-contain"
                  draggable="false"
                >
              </div>
              <span v-else>{{ getItemValue(item) }}</span>
            </span>
          </div>
        </div>

        <div
          :class="
            cn('flex flex-col justify-evenly space-y-4', {
              'md:w-[15%]': props.questions.category === 'image-to-image',
              'w-[30%] md:w-auto md:max-w-xl':
                props.questions.category === 'text-to-text'
                || props.questions.category === 'image-to-text',
            })
          "
        >
          <button
            v-for="item in renderedRightItems"
            :id="`right-${item.id}`"
            :key="item.id"
            type="button"
            :class="
              cn(
                'relative flex w-full items-center justify-start rounded-lg p-1 text-left md:p-4',
                (props.questions.category === 'text-to-text'
                  || props.questions.category === 'image-to-text') && 'min-h-20 p-2 leading-5 md:p-4',
                props.questions.category === 'image-to-image' && '!justify-center',
                !showResults && selectedLeftId && 'cursor-pointer',
                showResults && 'cursor-default',
                showResults && connectionByEndKey(`right-${item.id}`)?.isCorrect && 'border-2 border-green-300 bg-green-100',
                showResults && connectionByEndKey(`right-${item.id}`) && !connectionByEndKey(`right-${item.id}`)?.isCorrect && 'border-2 border-red-300 bg-red-100',
                showResults && !connectionByEndKey(`right-${item.id}`) && 'bg-picton-blue-50',
                !showResults && hoverDropId === `right-${item.id}` && 'bg-lemon-50 ring-2 ring-lemon-300',
                !showResults && hoverDropId !== `right-${item.id}` && endKeyHasConnection(`right-${item.id}`) && 'bg-lemon-100 text-lemon-700',
                !showResults && hoverDropId !== `right-${item.id}` && !endKeyHasConnection(`right-${item.id}`) && 'bg-picton-blue-50',
              )
            "
            :disabled="showResults"
            @click="handleRightItemSelect(item.id)"
          >
            <div v-if="isImageItem(item)" class="max-h-[400px] w-20 md:w-36">
              <img
                :src="getItemValue(item)"
                :alt="item.id"
                class="pointer-events-none h-full w-full select-none object-contain"
                draggable="false"
              >
            </div>
            <span v-else>{{ getItemValue(item) }}</span>
          </button>
        </div>

        <div class="pointer-events-none absolute inset-0 overflow-visible">
          <template v-for="line in renderedConnections" :key="line.key">
            <div
              :class="line.startCircleClass"
              class="absolute z-[1] rounded-full"
              :style="line.startCircleStyle"
            />
            <div
              class="absolute z-0 origin-top-left bg-repeat-x"
              :style="line.lineStyle"
            />
            <div
              :class="line.endCircleClass"
              class="absolute z-[1] rounded-full"
              :style="line.endCircleStyle"
            />
          </template>

          <template v-if="liveDragLine">
            <div
              :class="liveDragLine.startCircleClass"
              class="absolute z-[1] rounded-full"
              :style="liveDragLine.startCircleStyle"
            />
            <div
              class="absolute z-0 origin-top-left bg-repeat-x"
              :style="liveDragLine.lineStyle"
            />
            <div
              :class="liveDragLine.endCircleClass"
              class="absolute z-[1] rounded-full"
              :style="liveDragLine.endCircleStyle"
            />
          </template>
        </div>

        <div v-if="showResults" class="pointer-events-none absolute inset-0">
          <div
            :class="
              cn('absolute flex flex-col justify-evenly space-y-4', {
                'w-[30%]': props.questions.category === 'text-to-text',
                'w-[15%]':
                  props.questions.category === 'image-to-image'
                  || props.questions.category === 'image-to-text',
              })
            "
            style="top: 1rem; left: 1rem; height: calc(100% - 2rem);"
          >
            <div
              v-for="item in leftItems"
              :key="`${item.id}-indicator`"
              class="relative flex h-full w-full items-center justify-center"
            >
              <div
                v-if="connectionByStartKey(`left-${item.id}`)"
                :class="
                  cn(
                    'absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg',
                    connectionByStartKey(`left-${item.id}`)?.isCorrect ? 'bg-green-500' : 'bg-red-500',
                  )
                "
              >
                {{ connectionByStartKey(`left-${item.id}`)?.isCorrect ? "✓" : "✗" }}
              </div>
            </div>
          </div>

          <div
            :class="
              cn('absolute flex flex-col justify-evenly space-y-4', {
                'w-[15%]': props.questions.category === 'image-to-image',
                'w-[30%]': props.questions.category === 'text-to-text',
                'max-w-xl': props.questions.category === 'image-to-text',
              })
            "
            style="top: 1rem; right: 1rem; left: auto; height: calc(100% - 2rem);"
          >
            <div
              v-for="item in shuffledRightItems"
              :key="`${item.id}-indicator`"
              class="relative flex h-full w-full items-center justify-start"
            >
              <div
                v-if="connectionByEndKey(`right-${item.id}`)"
                :class="
                  cn(
                    'absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg',
                    connectionByEndKey(`right-${item.id}`)?.isCorrect ? 'bg-green-500' : 'bg-red-500',
                  )
                "
              >
                {{ connectionByEndKey(`right-${item.id}`)?.isCorrect ? "✓" : "✗" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="showResults"
        :score="timeUp ? 0 : score"
        :total="totalPairs"
        :on-restart="handleRestart"
      />

      <ActivityResultsAlertDialog
        :score="timeUp ? 0 : score"
        :total="totalPairs"
        :open="allAnswered && !isResetting && !showResults"
        :on-open-change="
          (open) => {
            if (open) {
              return;
            }
            handleShowResults();
          }
        "
      />
    </div>
  </GameModeWrapper>
</template>
