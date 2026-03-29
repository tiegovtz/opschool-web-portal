import { computed, defineComponent } from "vue";
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
    title: String,
    description: String,
  },
  setup(props) {
    const close = () => props.onOpenChange?.(false);

    return () =>
      props.open ? (
        <div class="fixed inset-0 z-[90] flex items-center justify-center bg-oceanBlue/45 px-4 backdrop-blur-sm">
          <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <ResultsCard
              score={props.score}
              total={props.total}
              title={props.title}
              description={props.description}
            />

            <div class="mt-5 flex justify-end gap-3">
              {props.onRestart ? (
                <Button
                  variant="outline-brand"
                  onClick={() => {
                    props.onRestart?.();
                    close();
                  }}
                >
                  Restart
                </Button>
              ) : null}
              <Button variant="brand" onClick={close}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null;
  },
});

export default ResultsCard;
