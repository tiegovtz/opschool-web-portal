import { ref, onUnmounted } from 'vue';
import { useTextToSpeech } from './useTextToSpeech';

export const useReadAloud = () => {
  const textToSpeech = useTextToSpeech();
  const isPlaying = ref(false);
  const currentPlaybackWordIndex = ref(-1);
  const hasPlayed = ref(false);
  
  // Track playback intervals for cleanup
  let wordHighlightIntervals: NodeJS.Timeout[] = [];
  
  /**
   * Play a line of text with synchronized word highlighting
   * @param text - The text to speak
   * @param onWordProgress - Optional callback for word highlighting updates
   * @param options - Speech options (rate, pitch, etc.)
   */
  const playLine = (
    text: string,
    onWordProgress?: (wordIndex: number) => void,
    options?: {
      lang?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
    }
  ) => {
    if (!text || text.trim().length === 0) {
      console.warn('[useReadAloud] Empty text provided');
      return;
    }

    // If already playing, stop and restart
    if (isPlaying.value) {
      stop();
      // Wait a bit before restarting
      setTimeout(() => {
        playLine(text, onWordProgress, options);
      }, 100);
      return;
    }

    const words = text.trim().split(/\s+/);
    if (words.length === 0) return;

    currentPlaybackWordIndex.value = -1;
    hasPlayed.value = true;
    isPlaying.value = true;

    // Clear any existing intervals
    wordHighlightIntervals.forEach(interval => clearTimeout(interval));
    wordHighlightIntervals = [];

    // Calculate estimated word timings based on text length and speech rate
    // Rough estimate: average speaking rate is ~150 words per minute
    // For more accuracy, we could use a more sophisticated timing algorithm
    const speechRate = options?.rate || 1;
    const wordsPerMinute = 150 * speechRate;
    const millisecondsPerWord = (60 / wordsPerMinute) * 1000;
    
    const wordTimings: number[] = [];
    let currentTime = 0;
    
    words.forEach((word) => {
      wordTimings.push(currentTime);
      // Estimate time based on word length (longer words take more time)
      // Base time + additional time per character
      const wordDuration = millisecondsPerWord * (0.5 + word.length * 0.1);
      currentTime += wordDuration;
    });

    // Set up word highlighting intervals
    words.forEach((word, index) => {
      const timeout = setTimeout(() => {
        if (isPlaying.value) {
          currentPlaybackWordIndex.value = index;
          if (onWordProgress) {
            onWordProgress(index);
          }
        }
      }, wordTimings[index]);
      
      wordHighlightIntervals.push(timeout);
    });

    // Set up end handler to reset highlighting
    const originalOnEnd = textToSpeech.onEnd.value;
    textToSpeech.onEnd.value = () => {
      isPlaying.value = false;
      // Keep the last word highlighted briefly, then reset
      setTimeout(() => {
        currentPlaybackWordIndex.value = -1;
        if (onWordProgress) {
          onWordProgress(-1);
        }
      }, 300);
      
      // Call original handler if it exists
      if (originalOnEnd) {
        originalOnEnd();
      }
    };

    // Set up error handler
    const originalOnError = textToSpeech.onError.value;
    textToSpeech.onError.value = (error: string) => {
      isPlaying.value = false;
      currentPlaybackWordIndex.value = -1;
      wordHighlightIntervals.forEach(interval => clearTimeout(interval));
      wordHighlightIntervals = [];
      
      if (originalOnError) {
        originalOnError(error);
      }
    };

    // Start speaking
    textToSpeech.speak(text, {
      lang: options?.lang || 'en-US',
      rate: speechRate,
      pitch: options?.pitch ?? 1.1,
      volume: options?.volume ?? 1,
    });
  };

  /**
   * Play a single word (useful for word-by-word pronunciation)
   */
  const playWord = (word: string) => {
    if (isPlaying.value) {
      stop();
    }
    
    const normalizedWord = word.replace(/[.,!?;:]/g, '').trim();
    if (!normalizedWord) return;

    textToSpeech.speak(normalizedWord, {
      lang: 'en-US',
      rate: 0.8, // Slower for word pronunciation
      pitch: 1.1,
    });
  };

  /**
   * Stop playback and reset state
   */
  const stop = () => {
    textToSpeech.stop();
    isPlaying.value = false;
    currentPlaybackWordIndex.value = -1;
    
    // Clear all intervals
    wordHighlightIntervals.forEach(interval => clearTimeout(interval));
    wordHighlightIntervals = [];
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
  });

  return {
    isPlaying,
    currentPlaybackWordIndex,
    hasPlayed,
    playLine,
    playWord,
    stop,
    repeat,
    toggle,
  };
};















