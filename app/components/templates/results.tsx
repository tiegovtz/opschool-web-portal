import { computed, defineComponent, ref, watch } from "vue";
import { cn } from "~/utilities/utils";
import { Button } from "~/components/ui/button";

interface ResultsProps {
  score?: number;
  total?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRestart?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

const resolveMessage = (score: number, total: number) => {
  if (!total) {
    return "No questions were available for scoring.";
  }

  const ratio = score / total;
  if (ratio === 1) return "Excellent work.";
  if (ratio >= 0.7) return "Strong result.";
  if (ratio >= 0.4) return "Good attempt. Review and try again.";
  return "Keep practicing and try again.";
};

const ResultsCard = defineComponent({
  name: "ActivityResults",
  props: {
    score: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    onRestart: Function,
    title: String,
    description: String,
    className: String,
  },
  setup(props) {
    const percentage = computed(() =>
      props.total ? Math.round((props.score / props.total) * 100) : 0,
    );

    return () => (
      <div
        class={cn(
          "rounded-2xl border border-oceanBlue/15 bg-white p-5 shadow-sm",
          props.className,
        )}
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium uppercase tracking-[0.18em] text-oceanBlue/70">
              {props.title || "Results"}
            </p>
            <h3 class="text-2xl font-semibold text-oceanBlue">
              {props.score}/{props.total}
            </h3>
            <p class="text-sm text-slate-600">
              {props.description || resolveMessage(props.score, props.total)}
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-lg font-semibold text-oceanBlue">
              {percentage.value}%
            </div>
            {props.onRestart ? (
              <Button variant="brand" onClick={() => props.onRestart?.()}>
                Play Again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
});

export const ActivityResultsAlertDialog = defineComponent({
  name: "ActivityResultsAlertDialog",
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    onOpenChange: Function,
    onRestart: Function,
    isCompletionOnly: {
      type: Boolean,
      default: false,
    },
    completionMessage: String,
    title: String,
    description: String,
  },
  setup(props) {
    const close = () => props.onOpenChange?.(false);

    type ConfettiPiece = {
      leftPct: number;
      sizePx: number;
      delayMs: number;
      durationMs: number;
      rotateDeg: number;
      color: string;
      radiusPx: number;
      opacity: number;
    };

    const confettiColors = [
      "#2cabff",
      "#56ade8",
      "#0ea5e9",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#a855f7",
      "#fb7185",
    ];

    const mulberry32 = (a: number) => {
      return () => {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const createConfettiPieces = (seed: number, count: number) => {
      const rand = mulberry32(seed);
      const pieces: ConfettiPiece[] = [];

      for (let i = 0; i < count; i += 1) {
        const leftPct = rand() * 100;
        const sizePx = 6 + rand() * 12;
        const delayMs = rand() * 250;
        const durationMs = 650 + rand() * 800;
        const rotateDeg = rand() * 360;
        const color = confettiColors[Math.floor(rand() * confettiColors.length)]!;
        const radiusPx = rand() > 0.8 ? sizePx / 2 : 3;
        const opacity = 0.65 + rand() * 0.35;

        pieces.push({
          leftPct,
          sizePx,
          delayMs,
          durationMs,
          rotateDeg,
          color,
          radiusPx,
          opacity,
        });
      }

      return pieces;
    };

    const celebrate = ref(false);
    const confettiPieces = ref<ConfettiPiece[]>([]);
    const animationKey = ref(0);

    const scorePercentage = computed(() => {
      if (!props.total) return 0;
      const ratio = props.score / props.total;
      if (!Number.isFinite(ratio) || ratio < 0) return 0;
      return Math.round(ratio * 100);
    });

    const emojiSrc = computed(() => {
      if (props.isCompletionOnly) {
        return "/images/activities/result-modal/perfect.png";
      }

      if (scorePercentage.value === 100) return "/images/activities/result-modal/perfect.png";
      if (scorePercentage.value >= 50) return "/images/activities/result-modal/good.png";
      if (scorePercentage.value > 0) return "/images/activities/result-modal/ok.png";
      return "/images/activities/result-modal/bad.png";
    });

    const triggerCelebration = () => {
      celebrate.value = true;
      window.setTimeout(() => {
        celebrate.value = false;
      }, 900);
    };

    watch(
      () => props.open,
      (nextOpen) => {
        if (!nextOpen) return;
        // Ensure the user can see the result popup immediately,
        // even if the activity content was scrolled down.
        if (typeof window !== "undefined") {
          window.requestAnimationFrame(() => {
            try {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } catch {
              window.scrollTo(0, 0);
            }
          });
        }

        animationKey.value += 1;
        const seed = props.score * 997 + props.total * 619 + animationKey.value;
        confettiPieces.value = createConfettiPieces(seed, 34);
        triggerCelebration();
      },
    );

    const modalTitle = computed(() =>
      props.isCompletionOnly ? "" : props.title || "Results",
    );

    const modalDescription = computed(() => {
      if (props.isCompletionOnly) {
        return props.completionMessage || resolveMessage(props.score, props.total);
      }

      return props.description || resolveMessage(props.score, props.total);
    });

    return () =>
      props.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          class="fixed inset-0 z-[130] flex items-start justify-center px-4 pb-8 pt-12 md:pt-16"
        >
          {/* Blur/dim the activity behind the modal */}
          <div
            class="absolute inset-0 bg-oceanBlue/25 backdrop-blur-[6px]"
            aria-hidden="true"
          />

          <div
            key={animationKey.value}
            class="relative w-full max-w-md overflow-hidden rounded-3xl border border-oceanBlue/15 bg-white/95 shadow-[0_30px_120px_-60px_rgba(1,61,96,0.7)] md:max-w-lg"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-amber-50 opacity-70" />

            <div
              class="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {confettiPieces.value.map((piece, index) => (
                <span
                  key={index}
                  class="absolute top-0"
                  style={{
                    left: `${piece.leftPct}%`,
                    width: `${piece.sizePx}px`,
                    height: `${Math.max(4, piece.sizePx * 0.55)}px`,
                    borderRadius: `${piece.radiusPx}px`,
                    backgroundColor: piece.color,
                    opacity: piece.opacity,
                    transform: `rotate(${piece.rotateDeg}deg)`,
                    animationName: "tie-confetti-fall",
                    animationDuration: `${piece.durationMs}ms`,
                    animationDelay: `${piece.delayMs}ms`,
                    animationTimingFunction: "linear",
                    animationFillMode: "both",
                  }}
                />
              ))}
            </div>

            <div class="relative px-5 py-6 text-center md:px-8 md:py-8">
              <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-50 shadow-sm ring-1 ring-oceanBlue/10 md:h-28 md:w-28">
                <img
                  src={emojiSrc.value}
                  alt="Result Emoji"
                  class={cn(
                    "h-16 w-16 object-contain md:h-20 md:w-20",
                    celebrate.value ? "animate-bounce" : "",
                  )}
                  draggable={false}
                />
              </div>

              {!props.isCompletionOnly ? (
                <>
                  <p class="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-oceanBlue/70">
                    {modalTitle.value}
                  </p>

                  <div class="mt-2 text-4xl font-black text-oceanBlue md:text-5xl">
                    {props.score}/{props.total}
                  </div>

                  <div class="mt-2 text-xl font-semibold text-oceanBlue md:text-2xl">
                    {modalDescription.value}
                  </div>

                  <div class="mt-4 inline-flex items-center justify-center rounded-full bg-sky-50 px-5 py-2 text-lg font-bold text-oceanBlue md:py-3 md:px-7 md:text-xl">
                    {scorePercentage.value}%
                  </div>
                </>
              ) : (
                <div class="mt-4 text-lg font-bold text-oceanBlue md:text-xl">
                  {modalDescription.value}
                </div>
              )}
            </div>

            <div class="relative flex flex-col gap-3 px-5 pb-6 pt-0 md:flex-row md:items-center md:justify-center md:pb-8">
              {props.onRestart ? (
                <Button
                  variant="outline-brand"
                  onClick={() => {
                    props.onRestart?.();
                    close();
                  }}
                  class="w-full md:w-auto"
                >
                  Restart
                </Button>
              ) : null}

              <Button
                variant="brand"
                onClick={close}
                class="w-full md:w-auto"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null;
  },
});

export default ResultsCard;
