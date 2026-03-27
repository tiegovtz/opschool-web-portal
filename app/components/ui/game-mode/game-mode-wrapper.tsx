// components/GameModeWrapper.tsx
import {
  defineComponent,
  ref,
  watch,
  onUnmounted,
  computed,
  type PropType,
  type Slots,
} from "vue";
import { GameTimer } from ".";
import { useSoundEffects } from "~/composables/use-sound-effects";

export interface GameStats {
  totalQuestions: number;
  completedQuestions: number;
  correctQuestions: number;
  timeSpent: number;
  timeTaken: number;
}

export interface GameModeWrapperProps {
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
}

export const GameModeWrapper = defineComponent({
  name: "GameModeWrapper",
  props: {
    isGameMode: { type: Boolean, required: true },
    totalQuestions: { type: Number, required: true },
    completedQuestions: { type: Object as PropType<Set<number>>, required: true },
    incorrectQuestions: { type: Object as PropType<Set<number>>, default: () => new Set() },
    currentQuestionIndex: { type: Number },
    totalTimeLimit: { type: Number, default: 300 },
    onTimeUp: { type: Function as PropType<() => void>, required: true },
    onGameComplete: { type: Function as PropType<(stats: GameStats) => void> },
    showProgress: { type: Boolean, default: true },
    showTimer: { type: Boolean, default: true },
    autoSubmitOnComplete: { type: Boolean, default: true },
    className: { type: String },
  },
  setup(props, { slots }: { slots: Slots }) {
    const timeLeft = ref(props.totalTimeLimit);
    const isTimerActive = ref(false);
    const gameStartTime = ref<number | null>(null);
    const hasGameStarted = ref(false);

    const { playSound } = useSoundEffects();

    let timerId: ReturnType<typeof setInterval> | null = null;

    // Start the game when isGameMode becomes true
    watch(
      () => props.isGameMode,
      (val) => {
        if (val && !hasGameStarted.value) {
          hasGameStarted.value = true;
          gameStartTime.value = Date.now();
          isTimerActive.value = true;
          timeLeft.value = props.totalTimeLimit;
        } else if (!val) {
          // reset state
          timeLeft.value = props.totalTimeLimit;
          isTimerActive.value = false;
          gameStartTime.value = null;
          hasGameStarted.value = false;
          clearInterval(timerId!);
        }
      },
      { immediate: true }
    );

    // Timer countdown
    watch(
      [isTimerActive, () => props.isGameMode],
      ([active, isGameMode]) => {
        if (!active || !isGameMode) {
          clearInterval(timerId!);
          return;
        }

        timerId = setInterval(() => {
          if (timeLeft.value <= 1) {
            timeLeft.value = 0;
            isTimerActive.value = false;
            props.onTimeUp();
            clearInterval(timerId!);
          } else {
            timeLeft.value -= 1;
          }
        }, 1000);
      },
      { immediate: true }
    );

    // Auto-submit on completion
    watch(
      [
        () => props.completedQuestions.size,
        () => props.incorrectQuestions?.size,
        () => timeLeft.value,
      ],
      () => {
        if (
          props.isGameMode &&
          props.autoSubmitOnComplete &&
          props.completedQuestions.size === props.totalQuestions &&
          props.totalQuestions > 0 &&
          hasGameStarted.value &&
          isTimerActive.value
        ) {
          const timeTaken = gameStartTime.value ? Date.now() - gameStartTime.value : 0;
          const correctQuestions = props.completedQuestions.size - (props.incorrectQuestions?.size ?? 0);

          const stats: GameStats = {
            totalQuestions: props.totalQuestions,
            completedQuestions: props.completedQuestions.size,
            correctQuestions,
            timeSpent: props.totalTimeLimit - timeLeft.value,
            timeTaken,
          };

          props.onGameComplete?.(stats);
          isTimerActive.value = false;
          playSound("success");
          clearInterval(timerId!);
        }
      }
    );

    onUnmounted(() => clearInterval(timerId!));

    const classList = computed(() => props.className);

    return () => {
      if (!props.isGameMode) return <div class={classList.value}>{slots.default?.()}</div>;

      return (
        <div class={classList.value}>
          {/* Timer */}
          {props.showTimer && (
            <div class="flex justify-center mb-4 pointer-events-none">
              <GameTimer
                timeLeft={timeLeft.value}
                totalTimeLimit={props.totalTimeLimit}
                isActive={isTimerActive.value}
                onTimeUp={props.onTimeUp}
              />
            </div>
          )}

          {/* Main content */}
          {slots.default?.()}

          {/* Progress placeholder */}
          {/* {props.showProgress && <GameProgress items={progressItems} />} */}
        </div>
      );
    };
  },
});

export default GameModeWrapper;
