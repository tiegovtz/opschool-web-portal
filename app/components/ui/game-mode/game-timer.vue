<script setup lang="ts">
import CircularTimer, { type TimerState } from "../circular-timer";

type GameTimerProps = {
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
};

const props = withDefaults(defineProps<GameTimerProps>(), {
  size: "md",
  className: "",
});

const handleTimeUp = () => {
  props.onTimeUp();
};

const handleStateChange = (state: TimerState) => {
  props.onStateChange?.(state);
};
</script>

<template>
  <div :class="['flex flex-col items-center gap-2', props.className]">
    <CircularTimer
      :time-left="props.timeLeft"
      :total-time-limit="props.totalTimeLimit"
      :is-timer-active="props.isActive"
      :play-timer-sounds="true"
      sound-trigger-type="full-activity"
      :on-time-up="handleTimeUp"
      :on-state-change="handleStateChange"
      :warning-threshold="props.warningThreshold"
      :critical-threshold="props.criticalThreshold"
      :size="props.size"
    />
  </div>
</template>
