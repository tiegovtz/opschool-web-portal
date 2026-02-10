import { ref, onUnmounted } from 'vue';

export const useReadAloud = () => {
  const isPlaying = ref(false);
  const currentPlaybackWordIndex = ref(-1);
  const hasPlayed = ref(false);
  const isLoading = ref(false);
  
  let wordHighlightIntervals: Array<ReturnType<typeof setTimeout>> = [];
  let audioElement: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  const clearWordHighlights = () => {
    wordHighlightIntervals.forEach((interval) => clearTimeout(interval));
    wordHighlightIntervals = [];
    currentPlaybackWordIndex.value = -1;
  };

  const decodeAudioBase64 = (audioBase64: string, contentType = 'audio/wav') => {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: contentType });
    return URL.createObjectURL(blob);
  };

  const scheduleWordHighlighting = (
    text: string,
    durationMs: number,
    onWordProgress?: (wordIndex: number) => void
  ) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;

    const timePerWord = Math.max(durationMs / words.length, 120);
    words.forEach((_, index) => {
      const timeout = setTimeout(() => {
        if (!isPlaying.value) return;
        currentPlaybackWordIndex.value = index;
        onWordProgress?.(index);
      }, Math.round(index * timePerWord));
      wordHighlightIntervals.push(timeout);
    });
  };
  
  const playLine = async (
    text: string,
    onWordProgress?: (wordIndex: number) => void,
    options?: {
      lang?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
      voiceType?: 'male' | 'female';
      audioUrl?: string;
      disableHighlighting?: boolean;
    }
  ) => {
    const normalizedText = String(text || '').trim();
    if (!normalizedText) return;
    if (typeof window === 'undefined') return;

    if (isPlaying.value) {
      stop();
    }

    isLoading.value = true;
    try {
      const resolvedAudioUrl = String(options?.audioUrl || '').trim();
      let audioSrc: string | null = null;

      if (resolvedAudioUrl) {
        audioSrc = resolvedAudioUrl;
      } else {
        const response = await $fetch('/api/conversation/tts', {
          method: 'POST',
          body: {
            text: normalizedText,
            voiceType: options?.voiceType || 'female',
            inline: true,
          },
        });

        if (!response?.success || !response?.audioBase64) {
          throw new Error('TTS audio unavailable');
        }

        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
        objectUrl = decodeAudioBase64(response.audioBase64, response.contentType || 'audio/wav');
        audioSrc = objectUrl;
      }

      hasPlayed.value = true;
      isPlaying.value = true;
      clearWordHighlights();

      if (!audioSrc) {
        throw new Error('No audio source available');
      }

      if (!audioElement) {
        audioElement = new Audio();
      }
      audioElement.src = audioSrc;
      audioElement.playbackRate = options?.rate || 1;
      audioElement.onended = () => {
        isPlaying.value = false;
        setTimeout(() => {
          clearWordHighlights();
          onWordProgress?.(-1);
        }, 150);
      };
      audioElement.onerror = () => {
        isPlaying.value = false;
        clearWordHighlights();
      };

      if (!options?.disableHighlighting) {
        const estimatedDurationMs = Math.max(normalizedText.split(/\s+/).length * 420, 1200);
        scheduleWordHighlighting(normalizedText, estimatedDurationMs, onWordProgress);
      } else {
        currentPlaybackWordIndex.value = -1;
        onWordProgress?.(-1);
      }
      await audioElement.play();
    } catch (error) {
      console.error('[useReadAloud] Piper TTS failed:', error);
      isPlaying.value = false;
      clearWordHighlights();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Play a single word (useful for word-by-word pronunciation)
   */
  const playWord = (word: string) => {
    const normalizedWord = word.replace(/[.,!?;:]/g, '').trim();
    if (!normalizedWord) return;
    playLine(normalizedWord, undefined, { rate: 0.85 });
  };

  /**
   * Stop playback and reset state
   */
  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.onended = null;
      audioElement.onerror = null;
    }
    isPlaying.value = false;
    clearWordHighlights();
  };

  /**
   * Repeat the last played line
   */
  const repeat = (
    text: string,
    onWordProgress?: (wordIndex: number) => void,
    options?: {
      lang?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
      voiceType?: 'male' | 'female';
    }
  ) => {
    stop();
    setTimeout(() => {
      playLine(text, onWordProgress, options);
    }, 100);
  };

  /**
   * Toggle playback (play if paused, pause if playing)
   */
  const toggle = (
    text: string,
    onWordProgress?: (wordIndex: number) => void,
    options?: {
      lang?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
      voiceType?: 'male' | 'female';
    }
  ) => {
    if (isPlaying.value) {
      stop();
    } else {
      playLine(text, onWordProgress, options);
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stop();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  });

  return {
    isPlaying,
    isLoading,
    currentPlaybackWordIndex,
    hasPlayed,
    playLine,
    playWord,
    stop,
    repeat,
    toggle,
  };
};























