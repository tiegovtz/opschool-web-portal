<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import GameTimer from "./game-timer.vue";
import type { GameStats } from "./types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type GameModeWrapperProps = {
  isGameMode: boolean;
  totalQuestions: number;
  completedQuestions: Set<number>;
  incorrectQuestions?: Set<number>;
  currentQuestionIndex?: number;
  totalTimeLimit?: number;
  onTimeUp: () => void;
  onGameComplete?: (stats: GameStats) => void;
  showProgress?: boolean;
  showTimer?: boolean;
  autoSubmitOnComplete?: boolean;
  className?: string;
};

const props = withDefaults(defineProps<GameModeWrapperProps>(), {
  incorrectQuestions: () => new Set<number>(),
  currentQuestionIndex: undefined,
  totalTimeLimit: 300,
  onGameComplete: undefined,
  showProgress: true,
  showTimer: true,
  autoSubmitOnComplete: true,
  className: "",
});

const { playSound } = useSoundEffects();

const timeLeft = ref(props.totalTimeLimit);
const isTimerActive = ref(false);
const gameStartTime = ref<number | null>(null);
const hasGameStarted = ref(false);

let timerId: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

watch(
  () => props.isGameMode,
  (isGameMode) => {
    if (isGameMode && !hasGameStarted.value) {
      hasGameStarted.value = true;
      gameStartTime.value = Date.now();
      isTimerActive.value = true;
      timeLeft.value = props.totalTimeLimit;
      return;
    }

    if (!isGameMode) {
      timeLeft.value = props.totalTimeLimit;
      isTimerActive.value = false;
      gameStartTime.value = null;
      hasGameStarted.value = false;
      clearTimer();
    }
  },
  { immediate: true },
);

watch(
  [isTimerActive, () => props.isGameMode],
  ([active, isGameMode]) => {
    clearTimer();
    if (!active || !isGameMode) return;

    timerId = setInterval(() => {
      if (timeLeft.value <= 1) {
        timeLeft.value = 0;
        isTimerActive.value = false;
        clearTimer();
        props.onTimeUp();
        return;
      }

      timeLeft.value -= 1;
    }, 1000);
  },
  { immediate: true },
);

watch(
  [
    () => props.completedQuestions.size,
    () => props.incorrectQuestions.size,
    timeLeft,
  ],
  () => {
    if (
      !props.isGameMode ||
      !props.autoSubmitOnComplete ||
      props.completedQuestions.size !== props.totalQuestions ||
      props.totalQuestions <= 0 ||
      !hasGameStarted.value ||
      !isTimerActive.value
    ) {
      return;
    }

    const timeTaken = gameStartTime.value ? Date.now() - gameStartTime.value : 0;
    const correctQuestions =
      props.completedQuestions.size - props.incorrectQuestions.size;

    props.onGameComplete?.({
      totalQuestions: props.totalQuestions,
      completedQuestions: props.completedQuestions.size,
      correctQuestions,
      timeSpent: props.totalTimeLimit - timeLeft.value,
      timeTaken,
    });

    isTimerActive.value = false;
    playSound("success");
    clearTimer();
  },
);

onUnmounted(clearTimer);

const wrapperClass = computed(() => props.className);
</script>

<template>
  <div :class="wrapperClass">
    <template v-if="props.isGameMode">
      <div v-if="props.showTimer" class="mb-4 flex justify-center pointer-events-none">
        <GameTimer
          :time-left="timeLeft"
          :total-time-limit="props.totalTimeLimit"
          :is-active="isTimerActive"
          :on-time-up="props.onTimeUp"
        />
      </div>
      <slot />
    </template>
    <slot v-else />
  </div>
</template>
