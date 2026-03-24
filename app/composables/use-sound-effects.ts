// composables/useSoundEffects.ts
import { ref, reactive, computed, onUnmounted } from "vue";

export type SoundType =
  | "success"
  | "failure"
  | "correct"
  | "click"
  | "heartbeat"
  | "timerTick"
  | "timerEnd"
  | "ding";

interface PlaySoundOptions {
  playbackRate?: number;
  volume?: number;
  loop?: boolean;
}

interface LoopingSoundConfig {
  type: SoundType;
  playbackRate: number;
  volume?: number;
  audio?: HTMLAudioElement;
}

const SOUND_PATHS: Record<SoundType, string> = {
  success: "/sounds/appealsuccess.mp3",
  failure: "/sounds/buzz.wav",
  correct: "/sounds/ding.mp3",
  click: "/sounds/beep.wav",
  heartbeat: "/sounds/heartbeat.mp3",
  timerTick: "/sounds/clock-ticking.mp3",
  timerEnd: "/sounds/tick-tock-close-up.wav",
  ding: "/sounds/bell-ding.mp3",
};

export function useSoundEffects(defaultVolume = 0.7) {
  const soundEnabled = ref(true);
  const playbackRates = reactive<Record<SoundType, number>>({
    success: 1.0,
    failure: 1.0,
    correct: 1.0,
    click: 1.0,
    heartbeat: 1.0,
    timerTick: 1.0,
    timerEnd: 1.0,
    ding: 1.0,
  });

  const currentLoopingSound = ref<LoopingSoundConfig | null>(null);

  const createAudio = (type: SoundType, options?: PlaySoundOptions) => {
    const audio = new Audio(SOUND_PATHS[type]);
    audio.volume = options?.volume ?? defaultVolume;
    audio.loop = options?.loop ?? false;
    audio.playbackRate = options?.playbackRate ?? playbackRates[type];
    audio.preload = "auto";
    return audio;
  };

  // Play a non-looping sound
  const playSound = (type: SoundType, options?: PlaySoundOptions) => {
    if (!soundEnabled.value) return;

    // Looping sounds should go through playLoopingSound
    if (["heartbeat", "timerTick", "timerEnd"].includes(type)) {
      playLoopingSound(type, options);
      return;
    }

    const audio = createAudio(type, options);
    audio.play().catch(() => {});
  };

  // Play looping sound
  const playLoopingSound = (type: SoundType, options?: PlaySoundOptions) => {
    if (!soundEnabled.value) return;

    // Stop current looping sound if different
    if (currentLoopingSound.value && currentLoopingSound.value.type !== type) {
      stopLoopingSound();
    }

    const audio =
      currentLoopingSound.value?.audio ??
      createAudio(type, { ...options, loop: true });
    audio.loop = true;
    audio.volume = options?.volume ?? defaultVolume * 0.8;
    audio.playbackRate = options?.playbackRate ?? playbackRates[type];
    audio.play().catch(() => {});

    currentLoopingSound.value = {
      type,
      playbackRate: audio.playbackRate,
      volume: audio.volume,
      audio,
    };
  };

  const stopLoopingSound = () => {
    currentLoopingSound.value?.audio?.pause();
    currentLoopingSound.value = null;
  };

  const stopAllSounds = () => {
    stopLoopingSound();
  };

  const setPlaybackRate = (type: SoundType, rate: number) => {
    const clamped = Math.max(0.25, Math.min(4.0, rate));
    playbackRates[type] = clamped;

    if (currentLoopingSound.value?.type === type) {
      currentLoopingSound.value.audio!.playbackRate = clamped;
      currentLoopingSound.value.playbackRate = clamped;
    }
  };

  const getPlaybackRate = (type: SoundType) => playbackRates[type];

  const enableSounds = () => (soundEnabled.value = true);
  const disableSounds = () => {
    soundEnabled.value = false;
    stopAllSounds();
  };

  // Dynamic playback rate based on timer urgency (0-1)
  const calculateUrgencyRate = (
    urgency: number,
    baseRate = 1.0,
    maxRate = 2.5,
  ) => {
    const clamped = Math.max(0, Math.min(1, urgency));
    return baseRate + clamped * (maxRate - baseRate);
  };

  const playTimerBasedSound = (
    type: SoundType,
    timeLeft: number,
    totalTime: number,
    isLooping = false,
  ) => {
    if (!soundEnabled.value) return;
    const progress = 1 - timeLeft / totalTime;
    let baseRate = 1.0,
      maxRate = 2.5;
    if (type === "heartbeat") [baseRate, maxRate] = [0.8, 1.8];
    if (type === "timerTick") [baseRate, maxRate] = [1.0, 2.0];
    if (type === "timerEnd") [baseRate, maxRate] = [1.2, 3.0];

    const dynamicRate = calculateUrgencyRate(progress, baseRate, maxRate);

    if (isLooping) playLoopingSound(type, { playbackRate: dynamicRate });
    else playSound(type, { playbackRate: dynamicRate });
  };

  const updateLoopingPlaybackRate = (rate: number) => {
    if (!currentLoopingSound.value?.audio) return;

    const clamped = Math.max(0.25, Math.min(4.0, rate));

    try {
      currentLoopingSound.value.audio.playbackRate = clamped;
      currentLoopingSound.value.playbackRate = clamped;
    } catch (e) {
      console.error("Error updating looping playback rate:", e);
    }
  };

  const getCurrentLoopingSound = () => {
    return currentLoopingSound.value;
  };
  onUnmounted(() => stopAllSounds());

  return {
    // Basic controls
    playSound,
    playLoopingSound,
    stopLoopingSound,
    stopAllSounds,
    enableSounds,
    disableSounds,
    soundEnabled,
    getCurrentLoopingSound,
    // Playback rates
    setPlaybackRate,
    getPlaybackRate,
    calculateUrgencyRate,
    playTimerBasedSound,
    updateLoopingPlaybackRate,
    // State
    currentLoopingSound,
    playbackRates,
  };
}
