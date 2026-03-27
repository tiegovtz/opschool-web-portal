// @ts-nocheck
import {
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { Button } from "../button";
import CircularTimer, { type TimerState } from "../circular-timer";
import { Slider } from "../slider";

export default defineComponent({
  name: "SoundTestComponent",
  setup() {
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

    // Timer
    const timerActive = ref(false);
    const timeLeft = ref(60);
    const totalTime = ref(60);
    const timerState = ref<TimerState>("idle");
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    // Playback rate controls
    const selectedSoundType = ref<string>("timerTick");
    const customPlaybackRate = ref(1.0);
    const urgencyLevel = ref(0.5);
    const dynamicRateEnabled = ref(false);
    const testScenario = ref<string>("normal");

    const currentLoopingSound = computed(() => getCurrentLoopingSound());

    // Timer functions
    const startTimer = () => {
      if (timerActive.value) return;
      timerActive.value = true;
      timeLeft.value = totalTime.value;

      timerInterval = setInterval(() => {
        if (timeLeft.value <= 1) {
          timerActive.value = false;
          clearInterval(timerInterval!);
          timeLeft.value = 0;
        } else {
          timeLeft.value -= 1;
        }
      }, 1000);
    };

    const resetTimer = () => {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
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
      setPlaybackRate(selectedSoundType.value as any, rate);
    };

    const handleLoopingRateUpdate = (rate: number) => {
      updateLoopingPlaybackRate(rate);
    };

    const playDynamicSound = (soundType: string) => {
      playTimerBasedSound(
        soundType as any,
        timeLeft.value,
        totalTime.value,
        true,
      );
    };

    const testUrgencyScenario = (scenario: string) => {
      testScenario.value = scenario;
      let urgency = 0;
      let time = totalTime.value;

      switch (scenario) {
        case "calm":
          urgency = 0.1;
          time = totalTime.value * 0.9;
          break;
        case "warning":
          urgency = 0.5;
          time = totalTime.value * 0.4;
          break;
        case "critical":
          urgency = 0.8;
          time = totalTime.value * 0.1;
          break;
        case "panic":
          urgency = 1.0;
          time = 5;
          break;
      }

      const dynamicRate = calculateUrgencyRate(urgency, 1.0, 3.0);
      playLoopingSound("heartbeat", { playbackRate: dynamicRate });
    };

    const soundTypes = [
      "success",
      "failure",
      "correct",
      "click",
      "ding",
      "heartbeat",
      "timerTick",
      "timerEnd",
    ];

    const loopingSoundTypes = ["heartbeat", "timerTick", "timerEnd"];

    const getRateColor = (rate: number) => {
      if (rate < 0.75) return "text-blue-600";
      if (rate > 1.5) return "text-red-600";
      return "text-green-600";
    };

    // Watch for dynamic rate updates
    watch([urgencyLevel, dynamicRateEnabled, currentLoopingSound], () => {
      if (dynamicRateEnabled.value && currentLoopingSound.value) {
        const dynamicRate = calculateUrgencyRate(urgencyLevel.value, 1.0, 2.5);
        updateLoopingPlaybackRate(dynamicRate);
      }
    });

    onBeforeUnmount(() => {
      if (timerInterval) clearInterval(timerInterval);
    });

    return () => (
      <div class="p-8 max-w-6xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h1 class="text-3xl font-bold mb-8 text-center">
            Advanced Sound System Test
          </h1>

          {/* Sound Enable/Disable */}
          <div class="mb-8 text-center">
            <Button
              onClick={() =>
                soundEnabled.value ? disableSounds() : enableSounds()
              }
              class="mb-4"
            >
              Sounds: {soundEnabled.value ? "ON" : "OFF"}
            </Button>
            <p class="text-sm text-gray-600">
              {soundEnabled.value
                ? "All sound features are enabled"
                : "Enable sounds to test features"}
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div>
              <div class="mb-6">
                <h2 class="text-xl font-semibold mb-4">Basic Sound Tests</h2>
                <div class="grid grid-cols-2 gap-3">
                  {["success", "failure", "correct", "click", "ding"].map(
                    (sound) => (
                      <Button
                        key={sound}
                        onClick={() => playSound(sound as any)}
                        class="text-sm"
                      >
                        {sound.charAt(0).toUpperCase() + sound.slice(1)}
                      </Button>
                    ),
                  )}
                  <Button onClick={stopLoopingSound} class="text-sm">
                    Stop All
                  </Button>
                </div>
              </div>

              {/* Looping Sounds */}
              <div class="mb-6">
                <h2 class="text-xl font-semibold mb-4">Looping Sounds</h2>
                <div class="grid grid-cols-1 gap-3">
                  {loopingSoundTypes.map((sound) => (
                    <Button
                      key={sound}
                      onClick={() => playLoopingSound(sound as any)}
                    >
                      {sound.charAt(0).toUpperCase() + sound.slice(1)} Loop
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div>
                <h2 class="text-xl font-semibold mb-4">
                  Integrated Timer Test
                </h2>
                <div class="flex flex-col items-center gap-4">
                  <CircularTimer
                    timeLeft={timeLeft.value}
                    totalTimeLimit={totalTime.value}
                    isTimerActive={timerActive.value}
                    playTimerSounds={soundEnabled.value}
                    soundTriggerType="full-activity"
                    onTimeUp={() => {
                      timerActive.value = false;
                      console.log("Timer finished!");
                    }}
                    onStateChange={handleTimerStateChange}
                    warningThreshold={20}
                    criticalThreshold={10}
                    size="md"
                    position="inline"
                  />
                  <div class="text-center flex gap-2">
                    <Button onClick={startTimer} disabled={timerActive.value}>
                      Start
                    </Button>
                    <Button onClick={resetTimer}>Reset</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Playback Rate Controls */}
              <div class="mb-6">
                <h2 class="text-xl font-semibold mb-4">
                  Playback Rate Controls
                </h2>
                <select
                  value={selectedSoundType.value}
                  onChange={(e) => {
                    const target = e.target as HTMLSelectElement;
                    selectedSoundType.value = target.value;
                  }}
                  class="w-full p-2 border rounded mb-4"
                >
                  {soundTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <Slider
                  value={[customPlaybackRate.value]}
                  onValueChange={(values: number[]) =>
                    handlePlaybackRateChange(values[0] as number)
                  }
                  min={0.25}
                  max={4.0}
                  step={0.05}
                />
                <Button
                  onClick={() =>
                    playSound(selectedSoundType.value as any, {
                      playbackRate: customPlaybackRate.value,
                    })
                  }
                >
                  Test Sound
                </Button>
                {loopingSoundTypes.includes(selectedSoundType.value) && (
                  <Button
                    onClick={() =>
                      playLoopingSound(selectedSoundType.value as any, {
                        playbackRate: customPlaybackRate.value,
                      })
                    }
                  >
                    Test Loop
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
