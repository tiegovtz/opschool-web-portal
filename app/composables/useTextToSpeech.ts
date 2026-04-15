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
      const errMsg = 'Text-to-speech is not supported in this browser';
      error.value = errMsg;
      console.error('[useTextToSpeech]', errMsg);
      if (onError.value) {
        onError.value(errMsg);
      }
      return;
    }

    if (!text || text.trim().length === 0) {
      const errMsg = 'Cannot speak empty text';
      error.value = errMsg;
      console.error('[useTextToSpeech]', errMsg);
      if (onError.value) {
        onError.value(errMsg);
      }
      return;
    }

    // Cancel any ongoing speech
    stop();

    // Wait for voices to load if needed (browsers may load voices asynchronously)
    const loadVoices = (): Promise<void> => {
      return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve();
          return;
        }

        // Wait for voiceschanged event
        const onVoicesChanged = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          resolve();
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        
        // Timeout after 1 second if voices don't load
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          resolve();
        }, 1000);
      });
    };

    loadVoices().then(() => {
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang || 'en-US';
      utterance.pitch = options?.pitch ?? 1;
      utterance.rate = options?.rate ?? 1;
      utterance.volume = options?.volume ?? 1;

      // Try to select a good English voice if not specified
      if (!options?.voice) {
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      } else {
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
        console.error('[useTextToSpeech] Error:', errorMessage, event);
        if (onError.value) {
          onError.value(errorMessage);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        const errMsg = `Failed to start speech: ${err.message}`;
        error.value = errMsg;
        console.error('[useTextToSpeech]', errMsg, err);
        if (onError.value) {
          onError.value(errMsg);
        }
      }
    });
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

