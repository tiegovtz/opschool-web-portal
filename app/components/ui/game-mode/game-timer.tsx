// components/GameTimer.tsx
import { defineComponent, type PropType } from "vue";
import CircularTimer, { type TimerState } from "../circular-timer";

export interface GameTimerProps {
  timeLeft: number;
  totalTimeLimit: number;
  isActive: boolean;
  onTimeUp: () => void;
  onTick?: (timeLeft: number) => void;
  onStateChange?: (state: TimerState) => void;
  showWarning?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const GameTimer = defineComponent({
  name: "GameTimer",
  props: {
    timeLeft: { type: Number, required: true },
    totalTimeLimit: { type: Number, required: true },
    isActive: { type: Boolean, required: true },
    onTimeUp: { type: Function as PropType<() => void>, required: true },
    onTick: { type: Function as PropType<(timeLeft: number) => void> },
    onStateChange: { type: Function as PropType<(state: TimerState) => void> },
    showWarning: { type: Boolean, default: true },
    warningThreshold: { type: Number },
    criticalThreshold: { type: Number },
    size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
    className: { type: String },
  },
  setup(props: GameTimerProps) {
    // Time formatting function
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    };

    const handleTimeUp = () => {
      props.onTimeUp();
    };

    const handleStateChange = (state: TimerState) => {
      props.onStateChange?.(state);
    };

    return () => (
      <div class={`flex flex-col items-center gap-2 ${props.className || ""}`}>
        {/* Circular Timer */}
        <CircularTimer
          timeLeft={props.timeLeft}
          totalTimeLimit={props.totalTimeLimit}
          isTimerActive={props.isActive}
          playTimerSounds={true}
          soundTriggerType="full-activity"
          onTimeUp={handleTimeUp}
          onStateChange={handleStateChange}
          warningThreshold={props.warningThreshold}
          criticalThreshold={props.criticalThreshold}
          size={props.size}
        />

        {/* Optional additional time display */}
        {/* <div class="flex items-center gap-2 text-sm">
          <Clock size={16} />
          <span class="font-medium text-gray-600">
            {formatTime(props.timeLeft)} remaining
          </span>
        </div> */}
      </div>
    );
  },
});

export default GameTimer;
