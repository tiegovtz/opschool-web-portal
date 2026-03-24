import { computed, defineComponent, watch, type PropType } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

export type TimerState = "idle" | "normal" | "warning" | "critical" | "ended";

export type CircularTimerProps = {
  timeLeft: number;
  totalTimeLimit: number;
  isTimerActive: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  position?: "fixed-top-left" | "inline";
  onTimeUp?: () => void;
  playTimerSounds?: boolean;
  soundTriggerType?: "single-question" | "full-activity";
  warningThreshold?: number;
  criticalThreshold?: number;
  onStateChange?: (state: TimerState) => void;
};

const sizeConfig = {
  sm: {
    container: "h-16 w-16",
    icon: "h-4 w-4",
    text: "text-sm",
    strokeWidth: 8,
    radius: 28,
  },
  md: {
    container: "h-24 w-24",
    icon: "h-6 w-6",
    text: "text-xl",
    strokeWidth: 10,
    radius: 42,
  },
  lg: {
    container: "h-32 w-32",
    icon: "h-8 w-8",
    text: "text-3xl",
    strokeWidth: 12,
    radius: 58,
  },
} as const;

export const CircularTimer = defineComponent({
  name: "CircularTimer",
  props: {
    timeLeft: {
      type: Number,
      required: true,
    },
    totalTimeLimit: {
      type: Number,
      required: true,
    },
    isTimerActive: {
      type: Boolean,
      required: true,
    },
    className: String,
    size: {
      type: String as PropType<CircularTimerProps["size"]>,
      default: "md",
    },
    position: {
      type: String as PropType<CircularTimerProps["position"]>,
      default: "inline",
    },
    onTimeUp: Function as PropType<CircularTimerProps["onTimeUp"]>,
    playTimerSounds: Boolean,
    soundTriggerType: String as PropType<CircularTimerProps["soundTriggerType"]>,
    warningThreshold: Number,
    criticalThreshold: Number,
    onStateChange: Function as PropType<CircularTimerProps["onStateChange"]>,
  },
  setup(props) {
    const config = computed(() => sizeConfig[props.size]);
    const circumference = computed(() => 2 * Math.PI * config.value.radius);
    const progress = computed(() => {
      if (!props.totalTimeLimit) return 0;
      return Math.max(0, (props.timeLeft / props.totalTimeLimit) * circumference.value);
    });
    const percentage = computed(() => {
      if (!props.totalTimeLimit) return 0;
      return Math.max(0, (props.timeLeft / props.totalTimeLimit) * 100);
    });

    const warningThreshold = computed(
      () => props.warningThreshold ?? Math.max(10, props.totalTimeLimit * 0.4),
    );
    const criticalThreshold = computed(
      () => props.criticalThreshold ?? Math.max(5, props.totalTimeLimit * 0.2),
    );

    const state = computed<TimerState>(() => {
      if (props.timeLeft <= 0) return "ended";
      if (!props.isTimerActive) return "idle";
      if (props.timeLeft <= criticalThreshold.value) return "critical";
      if (props.timeLeft <= warningThreshold.value) return "warning";
      return "normal";
    });

    watch(
      state,
      (next, prev) => {
        if (next !== prev) props.onStateChange?.(next);
      },
      { immediate: true },
    );

    watch(
      () => props.timeLeft,
      (next, prev) => {
        if (next <= 0 && (prev ?? 1) > 0) {
          props.onTimeUp?.();
        }
      },
      { immediate: true },
    );

    const strokeColor = computed(() => {
      switch (state.value) {
        case "critical":
          return "#ef4444";
        case "warning":
          return "#f59e0b";
        case "ended":
          return "#dc2626";
        default:
          return "#0f4c81";
      }
    });

    const containerClasses = computed(() =>
      cn(
        config.value.container,
        "relative inline-flex items-center justify-center",
        props.position === "fixed-top-left" ? "fixed left-4 top-20 z-50" : "",
        props.className,
      ),
    );

    const textClasses = computed(() =>
      cn(
        "font-semibold",
        config.value.text,
        state.value === "critical"
          ? "text-red-500"
          : state.value === "warning"
            ? "text-amber-500"
            : "text-oceanBlue",
      ),
    );

    const formatTime = (seconds: number) => {
      const safe = Math.max(0, seconds);
      const minutes = Math.floor(safe / 60);
      const remainingSeconds = safe % 60;
      return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return () => (
      <div class={containerClasses.value}>
        <svg
          class="-rotate-90"
          viewBox={`0 0 ${config.value.radius * 2 + config.value.strokeWidth} ${config.value.radius * 2 + config.value.strokeWidth}`}
        >
          <circle
            cx={config.value.radius + config.value.strokeWidth / 2}
            cy={config.value.radius + config.value.strokeWidth / 2}
            r={config.value.radius}
            fill="none"
            stroke="#dbeafe"
            stroke-width={config.value.strokeWidth}
          />
          <circle
            cx={config.value.radius + config.value.strokeWidth / 2}
            cy={config.value.radius + config.value.strokeWidth / 2}
            r={config.value.radius}
            fill="none"
            stroke={strokeColor.value}
            stroke-width={config.value.strokeWidth}
            stroke-dasharray={circumference.value}
            stroke-dashoffset={circumference.value - progress.value}
            stroke-linecap="round"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <Icon icon="lucide:clock-3" class={cn(config.value.icon, "mb-1 text-oceanBlue/70")} />
          <span class={textClasses.value}>{formatTime(props.timeLeft)}</span>
          <span class="text-[10px] text-slate-400">{Math.round(percentage.value)}%</span>
        </div>
      </div>
    );
  },
});

export default CircularTimer;
