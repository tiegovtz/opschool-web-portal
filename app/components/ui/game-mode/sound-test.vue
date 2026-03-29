<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Button } from "../button";
import CircularTimer, { type TimerState } from "../circular-timer";
import { Slider } from "../slider";
import { useSoundEffects } from "~/composables/use-sound-effects";

const {
  playSound,
  playLoopingSound,
  stopLoopingSound,
  stopAllSounds,
  enableSounds,
  disableSounds,
  soundEnabled,
  setPlaybackRate,
  updateLoopingPlaybackRate,
  calculateUrgencyRate,
  playTimerBasedSound,
  getCurrentLoopingSound,
} = useSoundEffects();

const timerActive = ref(false);
const timeLeft = ref(60);
const totalTime = ref(60);
const timerState = ref<TimerState>("idle");
const selectedSoundType = ref("timerTick");
const customPlaybackRate = ref(1);
const urgencyLevel = ref(0.5);
const dynamicRateEnabled = ref(false);

const currentLoopingSound = computed(() => getCurrentLoopingSound());

let timerInterval: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const startTimer = () => {
  if (timerActive.value) return;
  timerActive.value = true;
  timeLeft.value = totalTime.value;

  clearTimer();
  timerInterval = setInterval(() => {
    if (timeLeft.value <= 1) {
      timeLeft.value = 0;
      timerActive.value = false;
      clearTimer();
      return;
    }

    timeLeft.value -= 1;
  }, 1000);
};

const resetTimer = () => {
  clearTimer();
  timerActive.value = false;
  timeLeft.value = totalTime.value;
  timerState.value = "idle";
  stopAllSounds();
};

const handleTimerStateChange = (state: TimerState) => {
  timerState.value = state;
};

const handlePlaybackRateChange = (rate: number) => {
  customPlaybackRate.value = rate;
  setPlaybackRate(selectedSoundType.value as Parameters<typeof setPlaybackRate>[0], rate);
};

const testUrgencyScenario = (urgency: number) => {
  const dynamicRate = calculateUrgencyRate(urgency, 1, 2.5);
  playLoopingSound("heartbeat", { playbackRate: dynamicRate });
};

watch([urgencyLevel, dynamicRateEnabled, currentLoopingSound], () => {
  if (!dynamicRateEnabled.value || !currentLoopingSound.value) return;
  updateLoopingPlaybackRate(calculateUrgencyRate(urgencyLevel.value, 1, 2.5));
});

onBeforeUnmount(clearTimer);

const soundTypes = [
  "success",
  "failure",
  "correct",
  "click",
  "ding",
  "heartbeat",
  "timerTick",
  "timerEnd",
] as const;
</script>

<template>
  <div class="mx-auto max-w-5xl p-8">
    <div class="rounded-lg bg-white p-6 shadow-lg">
      <h1 class="mb-8 text-center text-3xl font-bold">Sound System Test</h1>

      <div class="mb-8 text-center">
        <Button @click="soundEnabled ? disableSounds() : enableSounds()">
          Sounds: {{ soundEnabled ? "ON" : "OFF" }}
        </Button>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <section class="space-y-6">
          <div>
            <h2 class="mb-4 text-xl font-semibold">Basic Sounds</h2>
            <div class="grid grid-cols-2 gap-3">
              <Button
                v-for="sound in soundTypes"
                :key="sound"
                @click="playSound(sound)"
              >
                {{ sound }}
              </Button>
              <Button @click="stopLoopingSound">Stop Loop</Button>
            </div>
          </div>

          <div>
            <h2 class="mb-4 text-xl font-semibold">Playback Rate</h2>
            <Slider
              :model-value="customPlaybackRate"
              :min="0.25"
              :max="3"
              :step="0.05"
              @update:modelValue="handlePlaybackRateChange"
            />
            <div class="mt-2 text-sm text-gray-600">
              {{ customPlaybackRate.toFixed(2) }}x
            </div>
          </div>

          <div>
            <h2 class="mb-4 text-xl font-semibold">Urgency Test</h2>
            <Slider
              :model-value="urgencyLevel"
              :min="0"
              :max="1"
              :step="0.05"
              @update:modelValue="(value) => (urgencyLevel = Number(value))"
            />
            <div class="mt-3 flex gap-3">
              <Button @click="dynamicRateEnabled = !dynamicRateEnabled">
                Dynamic: {{ dynamicRateEnabled ? "ON" : "OFF" }}
              </Button>
              <Button @click="testUrgencyScenario(urgencyLevel)">Heartbeat</Button>
              <Button
                @click="
                  playTimerBasedSound(
                    selectedSoundType as Parameters<typeof playTimerBasedSound>[0],
                    timeLeft,
                    totalTime,
                    true,
                  )
                "
              >
                Timer Sound
              </Button>
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="flex justify-center">
            <CircularTimer
              :time-left="timeLeft"
              :total-time-limit="totalTime"
              :is-timer-active="timerActive"
              :play-timer-sounds="true"
              sound-trigger-type="full-activity"
              :on-time-up="resetTimer"
              :on-state-change="handleTimerStateChange"
            />
          </div>

          <div class="flex justify-center gap-3">
            <Button @click="startTimer">Start Timer</Button>
            <Button @click="resetTimer">Reset</Button>
          </div>

          <div class="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <div>State: {{ timerState }}</div>
            <div>Time Left: {{ timeLeft }}s</div>
            <div>Looping: {{ currentLoopingSound?.type || "none" }}</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
