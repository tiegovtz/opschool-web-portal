import { ref, onUnmounted } from 'vue';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export const useSpeechRecognition = () => {
  const isListening = ref(false);
  const transcript = ref('');
  const interimTranscript = ref('');
  const currentWords = ref<string[]>([]);
  const error = ref<string | null>(null);
  const silenceTimer = ref<number | null>(null);

  let recognition: any = null;
  let silenceTimeout: NodeJS.Timeout | null = null;
  const SILENCE_THRESHOLD = 2000; // advance after 2s of silence once enough is spoken
  let hasSpoken = false; // Track if student has actually started speaking

  const onResult = ref<((result: SpeechRecognitionResult) => void) | null>(null);
  const onWord = ref<((word: string) => void) | null>(null);
  const onSilence = ref<(() => void) | null>(null);
  const onError = ref<((error: string) => void) | null>(null);

  const initializeRecognition = () => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      error.value = 'Speech recognition is not supported in this browser';
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListening.value = true;
      error.value = null;
      transcript.value = '';
      interimTranscript.value = '';
      currentWords.value = [];
      hasSpoken = false;
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      // Reset silence timer on any speech activity
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }

      // Mark that speech has started
      hasSpoken = true;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          final += text + ' ';
          currentWords.value.push(text.trim());
        } else {
          interim += text;
        }
      }

      transcript.value += final;
      interimTranscript.value = interim;

      // Extract words from interim results for highlighting
      if (interim) {
        const words = interim.trim().split(/\s+/);
        if (words.length > 0 && onWord.value) {
          const lastWord = words[words.length - 1] ?? '';
          onWord.value(lastWord);
        }
      }

      // Emit final results
      if (final && onResult.value) {
        onResult.value({
          transcript: final.trim(),
          confidence: 1.0,
          isFinal: true,
        });
      }

      // Set up silence detection - only if student has actually spoken
      if (hasSpoken && (final || interim)) {
        silenceTimeout = setTimeout(() => {
          if (onSilence.value && isListening.value) {
            onSilence.value();
          }
        }, SILENCE_THRESHOLD);
      }
    };

    rec.onerror = (event: any) => {
      const errorMessage = event.error || 'Speech recognition error';
      
      // Ignore "no-speech" errors - they're expected when user doesn't speak
      if (errorMessage === 'no-speech' || errorMessage.includes('no-speech')) {
        return;
      }
      
      error.value = errorMessage;
      isListening.value = false;
      
      if (onError.value) {
        onError.value(errorMessage);
      }
    };

    rec.onend = () => {
      isListening.value = false;
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
    };

    return rec;
  };

  const start = () => {
    if (isListening.value) return;

    hasSpoken = false;

    if (!recognition) {
      recognition = initializeRecognition();
      if (!recognition) return;
    }

    try {
      recognition.start();
    } catch (err: any) {
      error.value = err.message || 'Failed to start speech recognition';
      if (onError.value) {
        onError.value(error.value ?? 'Failed to start speech recognition');
      }
    }
  };

  const stop = () => {
    if (!recognition || !isListening.value) return;

    try {
      recognition.stop();
      isListening.value = false;
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to stop speech recognition';
    }
  };

  const reset = () => {
    stop();
    transcript.value = '';
    interimTranscript.value = '';
    currentWords.value = [];
    error.value = null;
    hasSpoken = false;
  };

  onUnmounted(() => {
    stop();
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
  });

  return {
    isListening,
    transcript,
    interimTranscript,
    currentWords,
    error,
    start,
    stop,
    reset,
    onResult,
    onWord,
    onSilence,
    onError,
  };
};
