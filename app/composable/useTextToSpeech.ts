import { ref, onUnmounted } from 'vue';

export const useTextToSpeech = () => {
  const isSpeaking = ref(false);
  const isPaused = ref(false);
  const error = ref<string | null>(null);

  let utterance: SpeechSynthesisUtterance | null = null;
  const onEnd = ref<(() => void) | null>(null);
  const onError = ref<((error: string) => void) | null>(null);

  const speak = (text: string, options?: {
    lang?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      error.value = 'Text-to-speech is not supported in this browser';
      if (onError.value) {
        onError.value(error.value);
      }
      return;
    }

    // Cancel any ongoing speech
    stop();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang || 'en-US';
    utterance.pitch = options?.pitch ?? 1;
    utterance.rate = options?.rate ?? 1;
    utterance.volume = options?.volume ?? 1;

    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      isSpeaking.value = true;
      isPaused.value = false;
      error.value = null;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
      isPaused.value = false;
      if (onEnd.value) {
        onEnd.value();
      }
    };

    utterance.onerror = (event: any) => {
      isSpeaking.value = false;
      isPaused.value = false;
      const errorMessage = event.error || 'Text-to-speech error';
      error.value = errorMessage;
      if (onError.value) {
        onError.value(errorMessage);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isSpeaking.value && !isPaused.value) {
      window.speechSynthesis.pause();
      isPaused.value = true;
    }
  };

  const resume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isPaused.value) {
      window.speechSynthesis.resume();
      isPaused.value = false;
    }
  };

  const stop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    isSpeaking.value = false;
    isPaused.value = false;
    utterance = null;
  };

  const getVoices = (): SpeechSynthesisVoice[] => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  };

  const getEnglishVoices = (): SpeechSynthesisVoice[] => {
    return getVoices().filter(voice => 
      voice.lang.startsWith('en') && voice.localService
    );
  };

  onUnmounted(() => {
    stop();
  });

  return {
    isSpeaking,
    isPaused,
    error,
    speak,
    pause,
    resume,
    stop,
    getVoices,
    getEnglishVoices,
    onEnd,
    onError,
  };
};

