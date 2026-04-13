import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { cn } from "~/utilities/utils";
import { Button } from "~/components/ui/button";
import {
  normalizeLanguageSupport,
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";

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

const resolveMessage = (score: number, total: number, isSwahili: boolean) => {
  if (!total) {
    return isSwahili
      ? "Hakukuwa na maswali ya kupimwa."
      : "No questions were available for scoring.";
  }

  const ratio = score / total;
  if (ratio === 1) return isSwahili ? "Umefanya vizuri sana." : "Excellent work.";
  if (ratio >= 0.7) return isSwahili ? "Matokeo mazuri sana." : "Strong result.";
  if (ratio >= 0.4) {
    return isSwahili
      ? "Jaribio zuri. Pitia tena kisha ujaribu tena."
      : "Good attempt. Review and try again.";
  }
  return isSwahili
    ? "Endelea kufanya mazoezi kisha ujaribu tena."
    : "Keep practicing and try again.";
};

const useIsSwahiliResultsUi = () => {
  const route = useRoute();
  const hubHeaderLang = useHubHeaderLanguage();
  const primaryContentLanguage = usePrimaryContentLanguage();
  const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
  const routeLanguage = computed(() =>
    resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
  );

  return computed(
    () =>
      normalizeLanguageSupport(
        route.query.lang ||
          routeLanguage.value ||
          hubHeaderLang.value ||
          primaryContentLanguage.value,
        "english",
      ) === "kiswahili",
  );
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
    const isSwahili = useIsSwahiliResultsUi();
    const ui = useActivityUiText();
    const percentage = computed(() =>
      props.total ? Math.round((props.score / props.total) * 100) : 0,
    );
    const resultsHeadingId = `activity-results-heading-${Math.random().toString(36).slice(2, 9)}`;
    const resultsDescriptionId = `activity-results-description-${Math.random().toString(36).slice(2, 9)}`;

    return () => (
      <div
        class={cn(
          "rounded-2xl border border-oceanBlue/15 bg-white p-5 shadow-sm",
          props.className,
        )}
        role="region"
        aria-labelledby={resultsHeadingId}
        aria-describedby={resultsDescriptionId}
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium uppercase tracking-[0.18em] text-oceanBlue/70">
              {props.title || (isSwahili.value ? "Matokeo" : "Results")}
            </p>
            <h3 id={resultsHeadingId} class="text-2xl font-semibold text-oceanBlue">
              {props.score}/{props.total}
            </h3>
            <p id={resultsDescriptionId} class="text-sm text-slate-600">
              {props.description || resolveMessage(props.score, props.total, isSwahili.value)}
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-lg font-semibold text-oceanBlue">
              {percentage.value}%
            </div>
            {props.onRestart ? (
              <Button variant="brand" onClick={() => props.onRestart?.()}>
                {isSwahili.value ? "Fanya tena" : "Play Again"}
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
    const isSwahili = useIsSwahiliResultsUi();
    const ui = useActivityUiText();
    const dialogRef = ref<HTMLElement | null>(null);
    const lastFocusedElement = ref<HTMLElement | null>(null);
    const close = () => props.onOpenChange?.(false);
    const dialogTitleId = `activity-results-dialog-title-${Math.random().toString(36).slice(2, 9)}`;
    const dialogDescriptionId = `activity-results-dialog-description-${Math.random().toString(36).slice(2, 9)}`;

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
      async (nextOpen) => {
        if (!nextOpen) {
          window.requestAnimationFrame(() => {
            lastFocusedElement.value?.focus?.();
          });
          return;
        }
        if (typeof document !== "undefined") {
          lastFocusedElement.value = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        }
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

        await nextTick();
        const firstFocusable = dialogRef.value?.querySelector<HTMLElement>("[data-results-primary-action]");
        firstFocusable?.focus?.();
      },
    );

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (!props.open || event.key !== "Tab" || !dialogRef.value) return;

      const focusableElements = Array.from(
        dialogRef.value.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("keydown", handleDialogKeyDown);
    }

    onBeforeUnmount(() => {
      if (typeof document !== "undefined") {
        document.removeEventListener("keydown", handleDialogKeyDown);
      }
    });

    const modalTitle = computed(() =>
      props.isCompletionOnly
        ? ""
        : props.title || (isSwahili.value ? "Matokeo" : "Results"),
    );

    const modalDescription = computed(() => {
      if (props.isCompletionOnly) {
        return (
          props.completionMessage ||
          resolveMessage(props.score, props.total, isSwahili.value)
        );
      }

      return (
        props.description ||
        resolveMessage(props.score, props.total, isSwahili.value)
      );
    });

    return () =>
      props.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
          class="fixed inset-0 z-[130] flex items-center justify-center px-4 py-8"
        >
          {/* Blur/dim the activity behind the modal */}
          <div
            class="absolute inset-0 bg-oceanBlue/25 backdrop-blur-[6px]"
            aria-hidden="true"
          />

          <div
            key={animationKey.value}
            ref={dialogRef}
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
                  alt={ui.resultEmojiAlt.value}
                  class={cn(
                    "h-16 w-16 object-contain md:h-20 md:w-20",
                    celebrate.value ? "animate-bounce" : "",
                  )}
                  draggable={false}
                />
              </div>

              {!props.isCompletionOnly ? (
                <>
                  <p id={dialogTitleId} class="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-oceanBlue/70">
                    {modalTitle.value}
                  </p>

                  <div class="mt-2 text-4xl font-black text-oceanBlue md:text-5xl">
                    {props.score}/{props.total}
                  </div>

                  <div id={dialogDescriptionId} class="mt-2 text-xl font-semibold text-oceanBlue md:text-2xl">
                    {modalDescription.value}
                  </div>

                  <div class="mt-4 inline-flex items-center justify-center rounded-full bg-sky-50 px-5 py-2 text-lg font-bold text-oceanBlue md:py-3 md:px-7 md:text-xl">
                    {scorePercentage.value}%
                  </div>
                </>
              ) : (
                <div id={dialogDescriptionId} class="mt-4 text-lg font-bold text-oceanBlue md:text-xl">
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
                  {isSwahili.value ? "Fanya tena" : "Restart"}
                </Button>
              ) : null}

              <Button
                variant="brand"
                onClick={close}
                class="w-full md:w-auto"
                data-results-primary-action="true"
              >
                {isSwahili.value ? "Endelea" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      ) : null;
  },
});

export default ResultsCard;
