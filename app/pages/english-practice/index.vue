<template>
  <div
    :class="isEmbedded
      ? 'relative w-full h-full p-4'
      : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'"
    @click.self="!isEmbedded && handleOverlayClick"
  >
    <div
      class="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="english-practice-title"
      @click.stop
    >
      <button
        v-if="!isEmbedded"
        type="button"
        class="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 hover:text-gray-900 shadow-md z-10"
        aria-label="Close English practice"
        @click="closeModal"
      >
        <span class="text-xl leading-none">&times;</span>
      </button>
      <div class="flex flex-col h-[calc(100vh-200px)] max-h-[800px] overflow-hidden">
      <!-- Header -->
      <header class="px-6 py-4 bg-gradient-to-r from-oceanBlue to-deepBlue text-white">
        <div class="flex items-center justify-between">
          <div>
            <h1 id="english-practice-title" class="text-2xl font-bold">English Speaking Practice</h1>
            <p class="text-sm text-blue-100 mt-1">
              Practice speaking with guided conversation
            </p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Mode switcher -->
            <div class="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              <button
                @click="switchMode('multi-user')"
                :class="[
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  mode === 'multi-user'
                    ? 'bg-white text-oceanBlue shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                ]"
              >
                Multi-user
              </button>
              <button
                @click="switchMode('single-user')"
                :class="[
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  mode === 'single-user'
                    ? 'bg-white text-oceanBlue shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                ]"
              >
                Single-user
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content area -->
      <div v-if="scriptLoading" class="text-center text-sm text-gray-500 mt-4 mb-2">
        Loading conversation content…
      </div>
      <div
        v-else-if="scriptError"
        class="text-center text-sm text-red-600 mt-4 mb-2"
      >
        {{ scriptError }}
      </div>
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <!-- Teleprompter display -->
        <EnglishPracticeTeleprompter
          :current-script-line="currentScriptLine"
          :current-line-index="currentLineIndex"
          :total-lines="script?.lines.length || 0"
          :current-turn="turnManager.currentTurn.value"
          :is-recording="speechRecognition.isListening.value"
          :highlighted-word="highlightedWord"
          :current-transcript="currentTranscript"
          :mode="mode"
          :is-ai-speaking="mode === 'single-user'
            ? turnManager.currentTurn.value !== primarySpeakerId && (isAiAudioLoading || isPlayingAiAudio)
            : turnManager.currentTurn.value === aiSpeakerId && (isAiAudioLoading || isPlayingAiAudio)"
          :current-word-index="currentWordIndex"
          :participants="participants"
        />

        <!-- Mic control -->
        <EnglishPracticeMicControl
          :is-recording="speechRecognition.isListening.value"
          :current-turn="turnManager.currentTurn.value"
          :current-speaker-name="currentSpeakerName"
          :can-record="canRecord"
          @toggle="handleMicToggle"
        />

        <!-- TEMP DEBUG: Manual skip for faster QA without speaking every turn -->
        <div v-if="showDebugSkipButton" class="absolute right-6 bottom-6 z-50">
          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors"
            @click="handleSkipTurn"
          >
            Skip Turn
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ConversationScript, ScriptLine, SpeakerType, PracticeMode, ConversationParticipant } from '~/types/script.interface';
import { useSpeechRecognition } from '~/composables/useSpeechRecognition';
import { useTurnManager } from '~/composables/useTurnManager';
import { inferVoiceTypeByName } from '~/utilities/inferVoiceTypeByName';

// Page metadata - disable layout to remove header/footer
definePageMeta({
  layout: false,
});

// State
const script = ref<ConversationScript | null>(null);
const currentLineIndex = ref(0);
const messages = ref<Array<{
  id: string;
  speaker: SpeakerType;
  scriptText?: string;
  transcript?: string;
}>>([]);
const highlightedWord = ref<string>('');
const currentTranscript = ref<string>('');
const spokenWords = ref<Set<string>>(new Set());
const currentWordIndex = ref(0); // Track current position in script words
const mode = ref<PracticeMode>('multi-user'); // Can be changed based on user detection
const route = useRoute();
const router = useRouter();
const isDebugMode = computed(() => {
  const debugParam = route.query.debug;
  return Array.isArray(debugParam) ? debugParam[0] === '1' : debugParam === '1';
});
const showDebugSkipButton = isDebugMode;
if (String(route.query.mode || '').trim().toLowerCase() === 'single') {
  mode.value = 'single-user';
}
const originalBodyOverflow = ref('');
const allowOverlayClose = ref(false);
const returnTo = ref('');
const scriptLoading = ref(false);
const scriptError = ref('');
const participants = ref<ConversationParticipant[]>([]);
const participantNameMap = computed(() => {
  const map = new Map<string, string>();
  participants.value.forEach((participant, index) => {
    map.set(participant.id, participant.name || `Speaker ${index + 1}`);
  });
  return map;
});
const aiSpeakerId = computed(() => participants.value.find((participant) => participant.type === 'ai')?.id || 'ai');
const primarySpeakerId = computed(() => participants.value.find((participant) => participant.type !== 'ai')?.id || participants.value[0]?.id || 'speaker-1');
const currentSpeakerName = computed(() => participantNameMap.value.get(turnManager.currentTurn.value) || 'Speaker');

const lineAudioMap = ref<Record<string, string>>({});
const piperAudioMap = ref<Record<string, string>>({});
const currentAudioUrl = ref('');
const isAiAudioLoading = ref(false);
const isPlayingAiAudio = ref(false);
const activeAiLineId = ref('');
const activeAiAudioSource = ref<'' | 'constant' | 'piper'>('');
const aiPlaybackStartedAt = ref(0);
const aiTurnToken = ref(0);
const isHandlingAiTurn = ref(false);
const aiAudio = typeof Audio !== 'undefined' ? new Audio() : null;
const TTS_LOG_PREFIX = '[ENG-PRACTICE-TTS]';

const isEmbedded = computed(() => String(route.query.embed || '') === '1');

// Composables
const speechRecognition = useSpeechRecognition();
const turnManager = useTurnManager(() => mode.value);

// Computed
const currentScriptLine = computed<ScriptLine | undefined>(() => {
  if (!script.value || currentLineIndex.value >= script.value.lines.length) {
    return undefined;
  }
  return script.value.lines[currentLineIndex.value];
});

const canRecord = computed(() => {
  const currentTurn = turnManager.currentTurn.value;
  const isAITurn =
    mode.value === 'single-user'
      ? currentTurn !== primarySpeakerId.value
      : currentTurn === aiSpeakerId.value;
  const isListening = speechRecognition.isListening.value;
  const isSpeaking = isPlayingAiAudio.value || isAiAudioLoading.value;
  
  // Can record if it's a student's turn and not currently listening or speaking
  return !isAITurn && !isListening && !isSpeaking;
});

// Get script words for current line (preserve original case and punctuation for display)
const scriptWords = computed(() => {
  if (!currentScriptLine.value?.text) return [];
  return currentScriptLine.value.text.trim().split(/\s+/);
});

// Get normalized script words for matching
const normalizedScriptWords = computed(() => {
  if (!currentScriptLine.value?.text) return [];
  return currentScriptLine.value.text
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
});

// Function to check if enough words have been spoken
const hasSpokenEnoughWords = (transcript: string): boolean => {
  if (!currentScriptLine.value || normalizedScriptWords.value.length === 0) return false;
  
  const spoken = transcript
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  if (spoken.length === 0) return false;
  
  // Check how many script words appear in spoken transcript
  // Use fuzzy matching - word contains or is contained by script word
  const matchedWords = normalizedScriptWords.value.filter(scriptWord => 
    spoken.some(spokenWord => {
      const normalizedScript = scriptWord.toLowerCase().trim();
      const normalizedSpoken = spokenWord.toLowerCase().trim();
      // Exact match or contains match
      return normalizedSpoken === normalizedScript || 
             normalizedSpoken.includes(normalizedScript) || 
             normalizedScript.includes(normalizedSpoken);
    })
  );
  
  // Require at least 80% of words to be spoken
  const matchPercentage = matchedWords.length / normalizedScriptWords.value.length;
  return matchPercentage >= 0.8;
};

// Speech recognition handlers
const setTurnForLine = (line?: ScriptLine) => {
  if (line?.speaker) {
    turnManager.setTurn(line.speaker);
    return;
  }
  turnManager.setTurn(primarySpeakerId.value);
};

const getAudioDebugState = () => {
  if (!aiAudio) {
    return {
      src: '',
      readyState: -1,
      networkState: -1,
      currentTime: -1,
      duration: -1,
    };
  }
  return {
    src: aiAudio.src ? (aiAudio.src.startsWith('blob:') ? 'blob:url' : aiAudio.src) : '',
    readyState: aiAudio.readyState,
    networkState: aiAudio.networkState,
    currentTime: aiAudio.currentTime,
    duration: aiAudio.duration,
  };
};

const logTtsDebug = (message: string, payload: Record<string, unknown> = {}) => {
  if (!isDebugMode.value) return;
  console.debug(TTS_LOG_PREFIX, message, {
    mode: mode.value,
    lineIndex: currentLineIndex.value,
    lineId: currentScriptLine.value?.id || activeAiLineId.value || '',
    speaker: currentScriptLine.value?.speaker || '',
    ...payload,
    audio: getAudioDebugState(),
  });
};

const advanceToNextLine = (
  triggerSource: 'speech' | 'ai',
  reason = ''
) => {
  logTtsDebug('advanceToNextLine before', {
    triggerSource,
    reason,
  });
  const canAdvance = currentLineIndex.value < (script.value?.lines.length || 0) - 1;
  if (!canAdvance) {
    turnManager.setTurn(primarySpeakerId.value);
    logTtsDebug('advanceToNextLine blocked at end', {
      triggerSource,
      reason,
    });
    return;
  }
  currentLineIndex.value += 1;

  const nextLine = currentScriptLine.value;
  setTurnForLine(nextLine);

  if (
    triggerSource === 'speech' &&
    mode.value === 'single-user' &&
    nextLine &&
    nextLine.speaker !== primarySpeakerId.value
  ) {
    setTimeout(() => {
      handleAITurn();
    }, 300);
  }
  logTtsDebug('advanceToNextLine after', {
    triggerSource,
    reason,
    nextLineIndex: currentLineIndex.value,
    nextLineId: currentScriptLine.value?.id || '',
  });
};

speechRecognition.onResult.value = (result) => {
  if (result.isFinal && result.transcript) {
    const transcript = result.transcript.trim();
    
    // Check if enough words were spoken
    if (hasSpokenEnoughWords(transcript)) {
      const currentTurn = turnManager.currentTurn.value;
      
      // Clear transcript display
      currentTranscript.value = '';
      highlightedWord.value = '';
      spokenWords.value.clear();
      currentWordIndex.value = 0; // Reset word index for next line

      // Stop recording
      speechRecognition.stop();
      advanceToNextLine('speech', 'speech_result_validated');
    } else {
      // Not enough words - keep recording and show feedback
      console.log('Please continue speaking to complete the line. You need to say at least 80% of the words.');
      // The transcript will continue to accumulate
    }
  }
};

speechRecognition.onWord.value = (word) => {
  if (!currentScriptLine.value) return;
  
  const normalizedSpoken = word.toLowerCase().replace(/[.,!?;:]/g, '');
  
  // Check if the spoken word matches the next expected word in sequence
  if (currentWordIndex.value < normalizedScriptWords.value.length) {
    const expectedWord = normalizedScriptWords.value[currentWordIndex.value];
    
    // Ensure expectedWord is defined before matching
    if (expectedWord) {
      const normalizedExpected = expectedWord.toLowerCase().trim();
      
      // Use fuzzy matching to handle variations
      if (normalizedSpoken === normalizedExpected || 
          normalizedSpoken.includes(normalizedExpected) || 
          normalizedExpected.includes(normalizedSpoken)) {
        // Match! Highlight this word and advance position
        highlightedWord.value = normalizedSpoken;
        currentWordIndex.value++;
      }
    }
  }
};

// Update current transcript in real-time
watch(() => speechRecognition.transcript.value + speechRecognition.interimTranscript.value, (fullTranscript) => {
  if (speechRecognition.isListening.value) {
    currentTranscript.value = fullTranscript.trim();
  }
});

speechRecognition.onSilence.value = () => {
  const transcript = speechRecognition.transcript.value.trim();
  
  // Only switch if:
  // 1. Student has actually spoken something
  // 2. Enough words have been spoken (80%+)
  if (transcript && hasSpokenEnoughWords(transcript)) {
    const currentTurn = turnManager.currentTurn.value;
    
    // Clear transcript display
    currentTranscript.value = '';
    highlightedWord.value = '';
    spokenWords.value.clear();
    currentWordIndex.value = 0; // Reset word index for next line

    speechRecognition.stop();
    advanceToNextLine('speech', 'speech_silence_validated');
  } else if (transcript) {
    // Not enough words - show feedback but don't switch
    // Keep recording to allow student to continue
    console.log('Please speak more words from the script. You need to say at least 80% of the words.');
  }
};

speechRecognition.onError.value = (error) => {
  // Ignore "no-speech" errors - they're expected when user doesn't speak
  if (error === 'no-speech' || error.includes('no-speech')) {
    return;
  }
};

// Methods
const handleMicToggle = () => {
  if (speechRecognition.isListening.value) {
    speechRecognition.stop();
    highlightedWord.value = '';
    currentTranscript.value = '';
    spokenWords.value.clear();
  } else {
    if (canRecord.value) {
      // Reset word index when starting to speak
      currentWordIndex.value = 0;
      speechRecognition.start();
      highlightedWord.value = '';
      currentTranscript.value = '';
      spokenWords.value.clear();
    }
  }
};

const handleSkipTurn = () => {
  logTtsDebug('manual skip button clicked', {
    reason: 'manual_skip_button',
  });
  if (speechRecognition.isListening.value) {
    speechRecognition.stop();
  }
  highlightedWord.value = '';
  currentTranscript.value = '';
  spokenWords.value.clear();
  currentWordIndex.value = 0;
  const triggerSource = canRecord.value ? 'speech' : 'ai';
  advanceToNextLine(triggerSource, 'manual_skip_button');
};

const resolvePlayableAudio = (audioUrl: string): string => {
  if (!audioUrl) return '';
  if (/^(blob:|data:)/i.test(audioUrl)) return audioUrl;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  if (audioUrl.startsWith('/')) return audioUrl;
  return `/${audioUrl}`;
};

const getPiperAudioForText = async (
  text: string,
  voiceType: 'male' | 'female' = 'female'
): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Piper audio decoding is only available in browser context');
  }
  logTtsDebug('piper request start', {
    voiceType,
    textLength: text.length,
  });
  const response = await $fetch('/api/conversation/tts', {
    method: 'POST',
    body: {
      text,
      voiceType,
      inline: true,
    },
  });

  if (!response?.success || !response?.audioBase64) {
    logTtsDebug('piper request failed response', {
      voiceType,
      hasSuccess: Boolean(response?.success),
      hasAudioBase64: Boolean(response?.audioBase64),
    });
    throw new Error('Piper TTS response is missing audio data');
  }
  logTtsDebug('piper request success', {
    voiceType,
    hasContentType: Boolean(response?.contentType),
  });

  const binary = atob(response.audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: response.contentType || 'audio/wav' });
  return URL.createObjectURL(blob);
};

const playAiAudio = async (audioUrl: string) => {
  if (!aiAudio) return;
  const resolved = resolvePlayableAudio(audioUrl);
  if (!resolved) throw new Error('No playable audio URL found');

  if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:') && currentAudioUrl.value !== resolved) {
    URL.revokeObjectURL(currentAudioUrl.value);
  }

  currentAudioUrl.value = resolved;
  aiAudio.src = resolved;
  aiAudio.currentTime = 0;
  aiPlaybackStartedAt.value = Date.now();
  isAiAudioLoading.value = true;
  isPlayingAiAudio.value = true;
  logTtsDebug('playAiAudio assigned src', {
    source: activeAiAudioSource.value,
    elapsedMs: 0,
  });

  try {
    await aiAudio.play();
    logTtsDebug('audio.play() resolved', {
      source: activeAiAudioSource.value,
      elapsedMs: performance.now() - aiPlaybackStartedAt.value,
    });
  } finally {
    isAiAudioLoading.value = false;
  }
};

const resolveAiLineAudio = async (
  line: ScriptLine
): Promise<{ audioUrl: string; source: 'constant' | 'piper' }> => {
  if (lineAudioMap.value[line.id]) {
    logTtsDebug('resolveAiLineAudio chose constant', {
      targetLineId: line.id,
      source: 'constant',
    });
    return { audioUrl: lineAudioMap.value[line.id], source: 'constant' };
  }
  if (piperAudioMap.value[line.id]) {
    logTtsDebug('resolveAiLineAudio chose cached piper', {
      targetLineId: line.id,
      source: 'piper',
    });
    return { audioUrl: piperAudioMap.value[line.id], source: 'piper' };
  }

  const speakerName = participantNameMap.value.get(line.speaker) || '';
  const piperAudioUrl = await getPiperAudioForText(
    line.text,
    inferVoiceTypeByName(speakerName)
  );
  piperAudioMap.value[line.id] = piperAudioUrl;
  logTtsDebug('resolveAiLineAudio generated piper', {
    targetLineId: line.id,
    source: 'piper',
  });
  return { audioUrl: piperAudioUrl, source: 'piper' };
};

const attachPlaybackCompletionHandlers = (token: number, source: 'constant' | 'piper') => {
  if (!aiAudio) return;
  aiAudio.onended = () => {
    if (token !== aiTurnToken.value) return;
    const elapsed = performance.now() - aiPlaybackStartedAt.value;
    logTtsDebug('audio completion onended', {
      token,
      source,
      elapsedMs: elapsed,
    });
    isPlayingAiAudio.value = false;
    isAiAudioLoading.value = false;
    currentWordIndex.value = 0;
    highlightedWord.value = '';
    currentTranscript.value = '';
    spokenWords.value.clear();
    if (mode.value === 'single-user') {
      advanceToNextLine('ai', 'playback_ended');
    }
  };

  aiAudio.onerror = () => {
    if (token !== aiTurnToken.value) return;
    const elapsed = performance.now() - aiPlaybackStartedAt.value;
    const hadProgress = (aiAudio.currentTime || 0) > 0.1;
    logTtsDebug('audio completion onerror', {
      token,
      source,
      elapsedMs: elapsed,
      hadProgress,
    });
    isPlayingAiAudio.value = false;
    isAiAudioLoading.value = false;
    if (mode.value === 'single-user' && hadProgress) {
      advanceToNextLine('ai', 'playback_error_after_progress');
    }
  };
};

const playAudioAndConfirmStarted = async ({
  src,
  source,
  token,
  timeoutMs = 4000,
  attempts,
}: {
  src: string;
  source: 'constant' | 'piper';
  token: number;
  timeoutMs?: number;
  attempts: { constantAttempted: boolean; piperAttempted: boolean };
}) => {
  if (!aiAudio) return false;
  if (token !== aiTurnToken.value) return false;

  activeAiAudioSource.value = source;
  currentAudioUrl.value = resolvePlayableAudio(src);
  if (!currentAudioUrl.value) return false;

  if (
    aiAudio.src &&
    aiAudio.src.startsWith('blob:') &&
    aiAudio.src !== currentAudioUrl.value
  ) {
    URL.revokeObjectURL(aiAudio.src);
  }

  aiAudio.src = currentAudioUrl.value;
  aiAudio.currentTime = 0;
  aiPlaybackStartedAt.value = performance.now();
  isAiAudioLoading.value = true;
  isPlayingAiAudio.value = false;

  logTtsDebug('playAudioAndConfirmStarted start', {
    source,
    token,
    constantAttempted: attempts.constantAttempted,
    piperAttempted: attempts.piperAttempted,
    t0: aiPlaybackStartedAt.value,
  });

  return await new Promise<boolean>((resolve) => {
    let resolved = false;
    let started = false;
    let playPromiseResolved = false;
    let sawCanPlay = false;
    let sawTimeUpdate = false;
    const t0 = aiPlaybackStartedAt.value;

    const cleanup = () => {
      aiAudio.removeEventListener('play', onPlay);
      aiAudio.removeEventListener('playing', onPlaying);
      aiAudio.removeEventListener('canplay', onCanPlay);
      aiAudio.removeEventListener('timeupdate', onTimeUpdate);
      aiAudio.removeEventListener('ended', onEnded);
      aiAudio.removeEventListener('error', onError);
      if (timer) window.clearTimeout(timer);
      isAiAudioLoading.value = false;
      if (!started) {
        isPlayingAiAudio.value = false;
      }
    };

    const settle = (value: boolean, detail: string) => {
      if (resolved) return;
      resolved = true;
      logTtsDebug('playAudioAndConfirmStarted settle', {
        source,
        token,
        value,
        detail,
        elapsedMs: performance.now() - t0,
        started,
      });
      cleanup();
      resolve(value);
    };

    const tokenMismatch = () => token !== aiTurnToken.value;

    const onPlay = () => {
      if (tokenMismatch()) return settle(false, 'token_mismatch_on_play');
      logTtsDebug('audio event: play', {
        source,
        token,
        elapsedMs: performance.now() - t0,
      });
    };

    const onPlaying = () => {
      if (tokenMismatch()) return settle(false, 'token_mismatch_on_playing');
      started = true;
      isPlayingAiAudio.value = true;
      logTtsDebug('audio event: playing', {
        source,
        token,
        elapsedMs: performance.now() - t0,
      });
      settle(true, 'playing_event');
    };

    const onCanPlay = () => {
      if (tokenMismatch()) return;
      sawCanPlay = true;
      logTtsDebug('audio event: canplay', {
        source,
        token,
        elapsedMs: performance.now() - t0,
        readyState: aiAudio.readyState,
      });
    };

    const onTimeUpdate = () => {
      if (tokenMismatch()) return;
      sawTimeUpdate = true;
      const progressed = (aiAudio.currentTime || 0) > 0.01;
      logTtsDebug('audio event: timeupdate', {
        source,
        token,
        elapsedMs: performance.now() - t0,
        currentTime: aiAudio.currentTime || 0,
        duration: Number.isFinite(aiAudio.duration) ? aiAudio.duration : null,
        progressed,
      });
      if (progressed && !started) {
        started = true;
        isPlayingAiAudio.value = true;
        settle(true, 'timeupdate_progress');
      }
    };

    const onEnded = async () => {
      const elapsed = performance.now() - t0;
      logTtsDebug('audio event: ended', {
        source,
        token,
        elapsedMs: elapsed,
        started,
      });
      if (tokenMismatch()) return settle(false, 'token_mismatch_on_ended');
      if (!started && !playPromiseResolved && aiAudio.currentTime <= 0.01) {
        return settle(false, 'ended_without_start');
      }
      if (!resolved) {
        // ended may happen before playing event on bad files, treat non-zero progress as started
        started =
          started ||
          aiAudio.currentTime > 0.01 ||
          (playPromiseResolved && (sawCanPlay || sawTimeUpdate || aiAudio.readyState >= 2));
        if (started) {
          settle(true, 'ended_after_progress');
        }
      }
    };

    const onError = () => {
      if (tokenMismatch()) return settle(false, 'token_mismatch_on_error');
      logTtsDebug('audio event: error', {
        source,
        token,
        elapsedMs: performance.now() - t0,
      });
      settle(false, 'audio_error');
    };

    const timer = window.setTimeout(() => {
      if (tokenMismatch()) return settle(false, 'token_mismatch_timeout');
      if (
        aiAudio.currentTime > 0.01 ||
        (playPromiseResolved && (sawCanPlay || sawTimeUpdate || aiAudio.readyState >= 2))
      ) {
        started = true;
        isPlayingAiAudio.value = true;
        return settle(true, 'time_progress');
      }
      settle(false, 'timeout_no_start');
    }, timeoutMs);

    aiAudio.addEventListener('play', onPlay, { once: false });
    aiAudio.addEventListener('playing', onPlaying, { once: false });
    aiAudio.addEventListener('canplay', onCanPlay, { once: false });
    aiAudio.addEventListener('timeupdate', onTimeUpdate, { once: false });
    aiAudio.addEventListener('ended', onEnded, { once: false });
    aiAudio.addEventListener('error', onError, { once: false });

    aiAudio.play()
      .then(() => {
        playPromiseResolved = true;
        logTtsDebug('audio.play promise resolved', {
          source,
          token,
          elapsedMs: performance.now() - t0,
          paused: aiAudio.paused,
          readyState: aiAudio.readyState,
          currentTime: aiAudio.currentTime || 0,
          duration: Number.isFinite(aiAudio.duration) ? aiAudio.duration : null,
        });
        if (!resolved && !aiAudio.paused && (aiAudio.readyState >= 2 || aiAudio.currentTime > 0.01)) {
          started = true;
          isPlayingAiAudio.value = true;
          settle(true, 'play_promise_resolved_with_ready_state');
        }
      })
      .catch((error: any) => {
        logTtsDebug('audio.play promise rejected', {
          source,
          token,
          elapsedMs: performance.now() - t0,
          errorName: error?.name || '',
          errorMessage: error?.message || '',
        });
        settle(false, 'play_rejected');
      });
  });
};

const handleAITurn = async () => {
  const scriptLine = currentScriptLine.value;
  const t0 = performance.now();
  logTtsDebug('handleAITurn entry', {
    t0,
    isHandlingAiTurn: isHandlingAiTurn.value,
    isAiAudioLoading: isAiAudioLoading.value,
    isPlayingAiAudio: isPlayingAiAudio.value,
  });
  if (!scriptLine) {
    logTtsDebug('handleAITurn exit no_line', { elapsedMs: performance.now() - t0 });
    return;
  }

  const shouldSpeak =
    mode.value === 'single-user'
      ? scriptLine.speaker !== primarySpeakerId.value
      : scriptLine.speaker === aiSpeakerId.value;

  if (!shouldSpeak) {
    logTtsDebug('handleAITurn exit not_ai_turn', {
      elapsedMs: performance.now() - t0,
    });
    return;
  }

  if (isHandlingAiTurn.value || isAiAudioLoading.value || isPlayingAiAudio.value) {
    logTtsDebug('handleAITurn exit already_handling', {
      elapsedMs: performance.now() - t0,
    });
    return;
  }

  isHandlingAiTurn.value = true;
  const myToken = aiTurnToken.value + 1;
  aiTurnToken.value = myToken;
  activeAiLineId.value = scriptLine.id;
  activeAiAudioSource.value = '';
  const attempts = { constantAttempted: false, piperAttempted: false };

  try {
    const constantAudioUrl = lineAudioMap.value[scriptLine.id] || '';
    if (constantAudioUrl) {
      attempts.constantAttempted = true;
      const constantStarted = await playAudioAndConfirmStarted({
        src: constantAudioUrl,
        source: 'constant',
        token: myToken,
        attempts,
      });
      if (constantStarted && myToken === aiTurnToken.value) {
        attachPlaybackCompletionHandlers(myToken, 'constant');
        logTtsDebug('handleAITurn success constant_started', {
          token: myToken,
          elapsedMs: performance.now() - t0,
          constantAttempted: attempts.constantAttempted,
          piperAttempted: attempts.piperAttempted,
        });
        return;
      }
    }

    attempts.piperAttempted = true;
    const piperResolved = await resolveAiLineAudio(scriptLine);
    const piperStarted = await playAudioAndConfirmStarted({
      src: piperResolved.audioUrl,
      source: 'piper',
      token: myToken,
      attempts,
    });
    if (piperStarted && myToken === aiTurnToken.value) {
      attachPlaybackCompletionHandlers(myToken, 'piper');
      logTtsDebug('handleAITurn success piper_started', {
        token: myToken,
        elapsedMs: performance.now() - t0,
        constantAttempted: attempts.constantAttempted,
        piperAttempted: attempts.piperAttempted,
      });
      return;
    }

    if (myToken === aiTurnToken.value) {
      logTtsDebug('handleAITurn both_failed advancing', {
        token: myToken,
        elapsedMs: performance.now() - t0,
        constantAttempted: attempts.constantAttempted,
        piperAttempted: attempts.piperAttempted,
      });
      advanceToNextLine('ai', 'tts_failed');
    }
  } catch (error: any) {
    logTtsDebug('handleAITurn exception', {
      token: myToken,
      elapsedMs: performance.now() - t0,
      errorName: error?.name || '',
      errorMessage: error?.message || '',
      constantAttempted: attempts.constantAttempted,
      piperAttempted: attempts.piperAttempted,
    });
    if (myToken === aiTurnToken.value) {
      advanceToNextLine('ai', 'exception');
    }
  } finally {
    if (myToken === aiTurnToken.value) {
      isHandlingAiTurn.value = false;
    }
    logTtsDebug('handleAITurn exit', {
      token: myToken,
      elapsedMs: performance.now() - t0,
      constantAttempted: attempts.constantAttempted,
      piperAttempted: attempts.piperAttempted,
    });
  }
};

const normalizeQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim();
  }
  return String(value || '').trim();
};

const normalizeSpeakerName = (value: string) => value.toLowerCase().trim();

const isAiSpeakerName = (speaker: string) => {
  const normalized = normalizeSpeakerName(speaker);
  return normalized.includes('ai') || normalized.includes('tutor') || normalized.includes('bot');
};

type RawConversationEntry = {
  order?: number;
  text?: string;
  speaker?: string;
};

const convertPiecesToScript = (
  pieces: Array<string | RawConversationEntry>,
  identifier?: string,
  speakerNameHints: string[] = []
): { lines: ScriptLine[]; participants: ConversationParticipant[] } => {
  const cleanedPieces = pieces
    .map((piece, index) => {
      if (typeof piece === 'string') {
        return { text: String(piece || '').trim(), order: index + 1, speaker: '' };
      }
      return {
        text: String(piece?.text || '').trim(),
        order: Number(piece?.order) || index + 1,
        speaker: String(piece?.speaker || '').trim(),
      };
    })
    .filter((piece) => piece.text.length > 0);

  const speakerAssignments = new Map<string, string>();
  const participantsList: ConversationParticipant[] = [];
  const lines: ScriptLine[] = [];
  let fallbackSpeakerIndex = 0;

  const registerParticipant = (name: string, type: 'student' | 'ai') => {
    const normalized = normalizeSpeakerName(name);
    if (speakerAssignments.has(normalized)) {
      return speakerAssignments.get(normalized)!;
    }
    const id = type === 'ai' ? 'ai' : `speaker-${participantsList.filter((p) => p.type === 'student').length + 1}`;
    speakerAssignments.set(normalized, id);
    participantsList.push({
      id,
      name: String(name || '').trim() || `Speaker ${participantsList.length + 1}`,
      type,
    });
    return id;
  };

  const normalizedHints = speakerNameHints
    .map((name) => String(name || '').trim())
    .filter((name) => name.length > 0);

  cleanedPieces.forEach((rawPiece, index) => {
    let text = rawPiece.text;
    let explicitSpeaker: string | null = rawPiece.speaker || null;
    const colonIndex = text.indexOf(':');
    if (colonIndex > 0) {
      const potentialSpeaker = text.slice(0, colonIndex).trim();
      const remaining = text.slice(colonIndex + 1).trim();
      if (potentialSpeaker && remaining) {
        explicitSpeaker = potentialSpeaker;
        text = remaining;
      }
    }

    let speaker: SpeakerType = '';

    if (explicitSpeaker) {
      if (isAiSpeakerName(explicitSpeaker)) {
        speaker = registerParticipant(explicitSpeaker, 'ai');
      } else {
        speaker = registerParticipant(explicitSpeaker, 'student');
      }
    } else {
      if (normalizedHints.length) {
        const hintedName = normalizedHints[index % normalizedHints.length];
        if (hintedName) {
          speaker = registerParticipant(
            hintedName,
            isAiSpeakerName(hintedName) ? 'ai' : 'student'
          );
        }
      }
    }

    if (!speaker) {
      const students = participantsList.filter((participant) => participant.type === 'student');
      if (!students.length) {
        registerParticipant('Speaker 1', 'student');
        registerParticipant('Speaker 2', 'student');
      }
      const availableStudents = participantsList.filter((participant) => participant.type === 'student');
      speaker = availableStudents[fallbackSpeakerIndex % availableStudents.length]?.id || 'speaker-1';
      fallbackSpeakerIndex += 1;
    }

    const lineId = identifier ? `${identifier}-${index}` : `line-${index}`;
    lines.push({
      id: lineId,
      speaker,
      text,
      order: rawPiece.order,
    });
  });

  if (!participantsList.length) {
    participantsList.push(
      { id: 'speaker-1', name: 'Speaker 1', type: 'student' },
      { id: 'speaker-2', name: 'Speaker 2', type: 'student' }
    );
  }

  return { lines, participants: participantsList };
};

const loadConversationScript = async () => {
  const chapterId = normalizeQueryValue(route.query.chapterId);
  const identifier = normalizeQueryValue(route.query.identifier);
  const typeFromUrl = normalizeQueryValue(route.query.type);
  if (!chapterId) {
    scriptError.value = 'Chapter ID not configured for this practice.';
    return;
  }

  scriptLoading.value = true;
  scriptError.value = '';

  try {
    // Use type from URL if provided, otherwise default to 'constant' for English practice
    const type = typeFromUrl || 'constant';
    const query: Record<string, string> = { chapterId, type };
    if (identifier) {
      query.identifier = identifier;
    }
    const [response, constantAudio] = await Promise.all([
      $fetch('/api/conversation/engage', { query }),
      $fetch('/api/conversation/constant-audio', {
        query: {
          chapterId,
          identifier,
        },
      }).catch(() => ({ items: [] })),
    ]);
    logTtsDebug('loadConversationScript fetched sources', {
      constantItems: Array.isArray(constantAudio?.items) ? constantAudio.items.length : 0,
      entries: Array.isArray(response?.entries) ? response.entries.length : 0,
      pieces: Array.isArray(response?.pieces) ? response.pieces.length : 0,
    });
    const entriesFromApi = Array.isArray(response?.entries) ? response.entries : [];
    const speakerNamesFromApi = Array.isArray(response?.speakerNames) ? response.speakerNames : [];
    const pieces = Array.isArray(response?.pieces) ? response.pieces : [];
    const normalizedConversationItems = entriesFromApi.length ? entriesFromApi : pieces;

    if (normalizedConversationItems.length === 0) {
      scriptError.value = 'No conversation pieces were returned for this chapter.';
      return;
    }
    const { lines, participants: parsedParticipants } = convertPiecesToScript(
      normalizedConversationItems,
      response?.identifier || identifier || '',
      speakerNamesFromApi
    );
    if (!lines.length) {
      scriptError.value = 'The conversation data appears to be empty.';
      return;
    }

    script.value = {
      id: response?.identifier || `${chapterId}-${Date.now()}`,
      title: response?.name || 'English Speaking Practice',
      lines,
      participants: parsedParticipants,
    };
    participants.value = parsedParticipants.map((participant, index) => ({
      id: participant.id,
      name: participant.name || `Speaker ${index + 1}`,
      type: participant.type,
    }));
    const participantOrder = parsedParticipants.map((participant) => participant.id);
    const firstStudentId =
      parsedParticipants.find((participant) => participant.type === 'student')?.id || participantOrder[0] || 'speaker-1';
    const detectedAiId =
      parsedParticipants.find((participant) => participant.type === 'ai')?.id || 'ai';
    turnManager.configure({
      order: participantOrder.filter((speakerId) => speakerId !== detectedAiId),
      aiId: detectedAiId,
      primaryStudent: firstStudentId,
    });
    const firstLine = lines[0];
    setTurnForLine(firstLine);
    if (mode.value === 'single-user' && firstLine && firstLine.speaker !== primarySpeakerId.value) {
      setTimeout(() => {
        handleAITurn();
      }, 200);
    }

    const constantItems = Array.isArray(constantAudio?.items) ? constantAudio.items : [];
    const audioByOrder = new Map<number, string>();
    constantItems.forEach((item: any) => {
      const order = Number(item?.order) || 0;
      const audioUrl = resolvePlayableAudio(String(item?.audioUrl || '').trim());
      if (order > 0 && audioUrl) {
        audioByOrder.set(order, audioUrl);
      }
    });
    const nextLineAudioMap: Record<string, string> = {};
    lines.forEach((line) => {
      const lineAudioUrl = audioByOrder.get(line.order);
      if (lineAudioUrl) {
        nextLineAudioMap[line.id] = lineAudioUrl;
        logTtsDebug('constant audio assigned to line', {
          lineId: line.id,
          lineOrder: line.order,
          source: 'constant',
        });
      }
    });
    lineAudioMap.value = nextLineAudioMap;
    piperAudioMap.value = {};

    // Prefetch Piper chunks for AI lines without constant audio so playback stays smooth.
    const aiLinesMissingAudio = lines.filter(
      (line) =>
        (mode.value === 'single-user'
          ? line.speaker !== primarySpeakerId.value
          : line.speaker === aiSpeakerId.value) && !nextLineAudioMap[line.id]
    );
    if (typeof window !== 'undefined' && aiLinesMissingAudio.length) {
      const batchResponse = await $fetch('/api/conversation/tts-batch', {
        method: 'POST',
        body: {
          voiceType: 'female',
          chunks: aiLinesMissingAudio.map((line) => ({
            id: line.id,
            text: line.text,
            voiceType: inferVoiceTypeByName(
              participantNameMap.value.get(line.speaker) || ''
            ),
          })),
        },
      }).catch(() => null);
      logTtsDebug('piper batch response received', {
        chunkCount: Array.isArray(batchResponse?.chunks) ? batchResponse.chunks.length : 0,
      });

      const piperChunks = Array.isArray(batchResponse?.chunks) ? batchResponse.chunks : [];
      for (const chunk of piperChunks) {
        if (!chunk?.success || !chunk?.id || !chunk?.audioBase64) continue;
        const binary = atob(chunk.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const blob = new Blob([bytes], { type: chunk.contentType || 'audio/wav' });
        piperAudioMap.value[String(chunk.id)] = URL.createObjectURL(blob);
        logTtsDebug('piper batch chunk assigned to line', {
          lineId: String(chunk.id),
          source: 'piper',
        });
      }
    }

    currentLineIndex.value = 0;
    currentWordIndex.value = 0;
    highlightedWord.value = '';
    currentTranscript.value = '';
    spokenWords.value.clear();
  } catch (error: any) {
    console.error('Failed to load conversation for English practice:', error);
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    if (errorMessage.includes('Failed to load') || errorMessage.includes('response data')) {
      scriptError.value = 'Unable to load conversation content. Please check your connection and try again.';
    } else {
      scriptError.value = `Unable to load conversation content: ${errorMessage}`;
    }
  } finally {
    scriptLoading.value = false;
  }
};

watch(
  () => [route.query.chapterId, route.query.identifier],
  () => {
    loadConversationScript();
  },
  { immediate: true }
);

// Mode detection (can be enhanced with actual user detection)
const detectMode = () => {
  // Check URL params first, then default to multi-user
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'single') {
      mode.value = 'single-user';
    } else {
      mode.value = 'multi-user';
    }
  }
};

// Switch mode function
const switchMode = (newMode: PracticeMode) => {
  // Don't switch if currently recording or speaking
  if (speechRecognition.isListening.value || isPlayingAiAudio.value || isAiAudioLoading.value) {
    console.log('Cannot switch mode while recording or speaking');
    return;
  }
  
  mode.value = newMode;
  
  // Reset turn manager for new mode
  setTurnForLine(currentScriptLine.value);
  if (
    newMode === 'single-user' &&
    currentScriptLine.value &&
    currentScriptLine.value.speaker !== primarySpeakerId.value
  ) {
    setTimeout(() => {
      handleAITurn();
    }, 100);
  }
  
  // Reset current line if needed (optional - you might want to keep progress)
  // currentLineIndex.value = 0;
  
  // Update URL without page reload
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (newMode === 'single-user') {
      url.searchParams.set('mode', 'single');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
  }
};

// Reset spoken words when starting new line
watch(() => currentLineIndex.value, () => {
  spokenWords.value.clear();
  currentTranscript.value = '';
  highlightedWord.value = '';
  currentWordIndex.value = 0; // Reset word index for new line
});

// Modal functionality
const closeModal = () => {
  if (
    typeof window !== 'undefined' &&
    window.parent &&
    window.parent !== window &&
    typeof window.parent.closeEnglishPractice === 'function'
  ) {
    window.parent.closeEnglishPractice();
    return;
  }
  if (returnTo.value) {
    window.location.href = returnTo.value;
    return;
  }
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/');
};

const handleOverlayClick = () => {
  if (!allowOverlayClose.value) return;
  closeModal();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

// Lifecycle
onMounted(() => {
  if (typeof document !== 'undefined') {
    if (!isEmbedded.value) {
      originalBodyOverflow.value = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    returnTo.value = String(route.query.returnTo || '').trim() || document.referrer || '';
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
    if (!isEmbedded.value) {
      // Avoid immediately closing the modal on the opening click
      setTimeout(() => {
        allowOverlayClose.value = true;
      }, 0);
    }
  }
  detectMode();
  turnManager.configure({
    order: [],
    aiId: aiSpeakerId.value,
    primaryStudent: primarySpeakerId.value,
  });

  if (aiAudio) {
    aiAudio.onended = () => {
      logTtsDebug('audio onended (global noop)', {
        elapsedMs: performance.now() - aiPlaybackStartedAt.value,
      });
    };

    aiAudio.onerror = () => {
      logTtsDebug('audio onerror (global noop)', {
        elapsedMs: performance.now() - aiPlaybackStartedAt.value,
      });
    };
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = originalBodyOverflow.value;
  }
  speechRecognition.stop();
  if (aiAudio) {
    aiAudio.pause();
    aiAudio.onended = null;
    aiAudio.onerror = null;
  }
  if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(currentAudioUrl.value);
  }
  Object.values(piperAudioMap.value).forEach((audioUrl) => {
    if (audioUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  });
});
</script>
