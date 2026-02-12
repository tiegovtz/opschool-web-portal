<template>
  <div
    :class="isEmbedded
      ? 'fixed inset-0 p-2 sm:p-4 flex items-start justify-center overflow-y-auto'
      : 'fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-2 sm:p-4 overflow-y-auto'"
    @click.self="!isEmbedded && handleOverlayClick"
  >
    <div
      class="modal-shell practice-modal relative w-[min(1100px,calc(100vw-16px))] max-h-[calc(100vh-16px)] overflow-hidden flex flex-col p-0 rounded-2xl bg-transparent mt-2 sm:mt-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="english-practice-title"
      @click.stop
    >
      <div class="modal-inner relative w-full flex flex-col min-h-0 rounded-2xl bg-white overflow-hidden">
        <div v-if="showLoadingBar" class="loading-bar">
          <div class="loading-bar__inner"></div>
        </div>
        <header class="practice-header shrink-0 flex items-start justify-between gap-4 px-3 py-3 sm:px-6 sm:py-4 border-b border-slate-200">
          <div>
            <h1 id="english-practice-title" class="text-lg font-semibold tracking-tight text-blue-700">English Speaking Practice</h1>
            <p class="text-xs text-slate-500 mt-1">
              Practice speaking with guided conversation
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-full bg-slate-100 p-1">
              <button
                @click="switchMode('multi-user')"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                  mode === 'multi-user'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                ]"
              >
                Multi-user
              </button>
              <button
                @click="switchMode('single-user')"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                  mode === 'single-user'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                ]"
              >
                Single-user
              </button>
            </div>
            <button
              v-if="!isEmbedded"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50"
              aria-label="Close English practice"
              @click="closeModal"
            >
              <span class="text-xl leading-none">&times;</span>
            </button>
          </div>
        </header>

        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 py-3 sm:px-6 sm:py-4 min-h-0"
          :class="speechRecognition.isListening.value ? 'pb-[190px]' : ''"
          @scroll="handleUserScroll"
        >
          <div
            v-if="showRotateBanner"
            class="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:hidden"
          >
            Rotate to landscape for a better experience.
          </div>
          <div ref="topAnchor" aria-hidden="true"></div>
          <div v-if="scriptLoading" class="text-center text-sm text-gray-500 mt-2 mb-4">
            Loading conversation content…
          </div>
          <div
            v-else-if="scriptError"
            class="text-center text-sm text-red-600 mt-2 mb-4"
          >
            {{ scriptError }}
          </div>
          <div class="practice-content flex flex-col gap-6 min-h-0">
            <EnglishPracticeTeleprompter
              :current-script-line="currentScriptLine"
              :current-line-index="currentLineIndex"
              :total-lines="script?.lines.length || 0"
              :current-line-audio-url="currentLineAudioUrl"
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
          </div>
          <div class="sticky bottom-4 flex justify-end pointer-events-none">
            <button
              v-if="showBackToTop"
              type="button"
              class="pointer-events-auto rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
              @click="handleBackToTop"
            >
              Back to top
            </button>
          </div>
        </div>

        <footer
          v-if="showDebugSkipButton"
          class="shrink-0 px-3 py-3 sm:px-6 sm:py-4 border-t border-slate-200 flex flex-col items-center gap-2 sm:gap-3"
        >
          <div class="w-full flex justify-end">
            <button
              type="button"
              class="px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors"
              @click="handleSkipTurn"
            >
              Skip Turn
            </button>
          </div>
        </footer>
        <div
          v-if="!speechRecognition.isListening.value"
          class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center"
        >
          <div class="pointer-events-auto">
            <EnglishPracticeMicControl
              :is-recording="speechRecognition.isListening.value"
              :current-turn="turnManager.currentTurn.value"
              :current-speaker-name="currentSpeakerName"
              :can-record="canRecord"
              :is-speech-supported="isSpeechSupported"
              :audio-level="audioLevel"
              @toggle="handleMicToggle"
            />
          </div>
        </div>
        <div
          v-if="speechRecognition.isListening.value"
          class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[170px] w-full"
        >
          <WaveGlowBottom class="w-full h-full" :active="speechRecognition.isListening.value" :audio-level="audioLevel" />
        </div>
        <!-- Hidden Audio Element -->
        <audio
          ref="audioRef"
          @ended="onAudioEnded"
          @error="onAudioError"
          @timeupdate="onAudioTimeUpdate"
          class="absolute w-0 h-0 overflow-hidden"
          :volume="1.0"
        ></audio>

        <div class="toast-container" role="status" aria-live="polite" aria-atomic="true">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="toast"
            :class="[toast.type]"
          >
            {{ toast.message }}
          </div>
        </div>

        <div
          v-if="isDebugMode && scrollDebug"
          class="fixed bottom-4 right-4 z-50 rounded-md bg-orange-500/90 px-3 py-2 text-xs text-white shadow"
        >
          {{ scrollDebug.tag }} {{ scrollDebug.className }} |
          {{ scrollDebug.scrollTop }} / {{ scrollDebug.scrollHeight }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ConversationScript, ScriptLine, SpeakerType, PracticeMode, ConversationParticipant } from '~/types/script.interface';
import { useSpeechRecognition } from '~/composables/useSpeechRecognition';
import { useTurnManager } from '~/composables/useTurnManager';
import { inferVoiceTypeByName } from '~/utilities/inferVoiceTypeByName';
import WaveGlowBottom from '~/components/audio/WaveGlowBottom.vue';

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
const showDebugSkipButton = computed(() => isDebugMode.value); // TEMP: only show when ?debug=1
if (String(route.query.mode || '').trim().toLowerCase() === 'single') {
  mode.value = 'single-user';
}
const originalBodyOverflow = ref('');
const allowOverlayClose = ref(false);
const returnTo = ref('');
const isPortrait = ref(false);
const isSmallScreen = ref(false);
const showRotateBanner = computed(() => isPortrait.value && isSmallScreen.value);
const openedAt = ref(0);
let popstateReady = false;
const scriptLoading = ref(false);
const scriptError = ref('');
const practiceCompleted = ref(false);
const autoCloseSeconds = ref<number>(0);
let autoCloseTimer: number | null = null;
const toasts = ref<Array<{ id: string; message: string; type: 'info' | 'error' }>>([]);
const isSpeechSupported = ref(true);
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
const isModalOpen = computed(() => !isEmbedded.value);

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

const scrollDebug = ref<{
  tag: string;
  className: string;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
} | null>(null);
const lastScrollTarget = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const topAnchor = ref<HTMLElement | null>(null);
const isUserScrolling = ref(false);
const showBackToTop = ref(false);
let scrollIdleTimer: number | null = null;
const showLoadingBar = computed(() => scriptLoading.value || isAiAudioLoading.value);
const audioLevel = ref(0);
let micStream: MediaStream | null = null;
let micAudioContext: AudioContext | null = null;
let micAnalyser: AnalyserNode | null = null;
let micRafId: number | null = null;

const stopMicLevel = () => {
  if (micRafId != null) {
    cancelAnimationFrame(micRafId);
    micRafId = null;
  }
  if (micAudioContext) {
    micAudioContext.close().catch(() => {});
    micAudioContext = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  micAnalyser = null;
  audioLevel.value = 0;
};

const startMicLevel = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
  if (micStream || micAnalyser) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micAudioContext = new AudioContext();
    const source = micAudioContext.createMediaStreamSource(micStream);
    micAnalyser = micAudioContext.createAnalyser();
    micAnalyser.fftSize = 512;
    source.connect(micAnalyser);
    const data = new Uint8Array(micAnalyser.fftSize);
    const update = () => {
      if (!micAnalyser) return;
      micAnalyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      audioLevel.value = Math.min(1, rms * 2.5);
      micRafId = requestAnimationFrame(update);
    };
    update();
  } catch {
    stopMicLevel();
  }
};

const handleUserScroll = () => {
  isUserScrolling.value = true;
  if (scrollIdleTimer) {
    window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = null;
  }
  const target = scrollContainer.value;
  showBackToTop.value = !!target && target.scrollTop > 40;
  scrollIdleTimer = window.setTimeout(() => {
    isUserScrolling.value = false;
  }, 800);
};

const handleBackToTop = () => {
  const target = scrollContainer.value;
  if (!target) return;
  target.scrollTo({ top: 0, behavior: 'smooth' });
};

const currentLineAudioUrl = computed(() => {
  const lineId = currentScriptLine.value?.id || '';
  if (!lineId) return '';
  return lineAudioMap.value[lineId] || '';
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

const HONORIFICS = ['ms', 'miss', 'mrs', 'mr', 'mister', 'madam', 'maam'];

const normalizeWords = (text: string) => {
  const tokens = text
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const expanded: string[] = [];
  tokens.forEach((token) => {
    const honorific = HONORIFICS.find((prefix) => token.startsWith(prefix) && token.length > prefix.length + 1);
    if (honorific) {
      expanded.push(honorific);
      expanded.push(token.slice(honorific.length));
      return;
    }
    expanded.push(token);
  });

  return expanded.filter((word) => {
    if (word.length === 1) {
      return word === 'a' || word === 'i';
    }
    return true;
  });
};

const toSoundex = (word: string) => {
  const normalized = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return '';
  const first = normalized[0].toUpperCase();
  const map: Record<string, string> = {
    b: '1',
    f: '1',
    p: '1',
    v: '1',
    c: '2',
    g: '2',
    j: '2',
    k: '2',
    q: '2',
    s: '2',
    x: '2',
    z: '2',
    d: '3',
    t: '3',
    l: '4',
    m: '5',
    n: '5',
    r: '6',
  };
  let lastCode = '';
  let result = first;
  for (let i = 1; i < normalized.length; i += 1) {
    const code = map[normalized[i]] || '0';
    if (code !== '0' && code !== lastCode) {
      result += code;
    }
    lastCode = code;
  }
  return (result + '000').slice(0, 4);
};

const normalizeToken = (word: string) => {
  const normalized = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return '';
  const honorifics: Record<string, string> = {
    ms: 'ms',
    miss: 'ms',
    mrs: 'mrs',
    missus: 'mrs',
    mr: 'mr',
    mister: 'mr',
    madam: 'madam',
    maam: 'madam',
    sir: 'sir',
  };
  return honorifics[normalized] || normalized;
};

const OPTIONAL_SCRIPT_WORDS = new Set(['ms', 'mr', 'mrs']);
const MATCH_THRESHOLD = 0.9;

const isFuzzyMatch = (scriptWord: string, spokenWord: string) => {
  const normalizedScript = normalizeToken(scriptWord);
  const normalizedSpoken = normalizeToken(spokenWord);
  if (
    normalizedSpoken === normalizedScript ||
    normalizedSpoken.includes(normalizedScript) ||
    normalizedScript.includes(normalizedSpoken)
  ) {
    return true;
  }
  if (normalizedSpoken.length < 3 || normalizedScript.length < 3) {
    return false;
  }
  return toSoundex(normalizedSpoken) === toSoundex(normalizedScript);
};

const getOrderedMatchCount = (spokenWords: string[]) => {
  let scriptIndex = 0;
  for (const spokenWord of spokenWords) {
    if (scriptIndex >= normalizedScriptWords.value.length) break;
    let scriptWord = normalizedScriptWords.value[scriptIndex];

    while (
      scriptWord &&
      OPTIONAL_SCRIPT_WORDS.has(normalizeToken(scriptWord)) &&
      !isFuzzyMatch(scriptWord, spokenWord)
    ) {
      const nextWord = normalizedScriptWords.value[scriptIndex + 1];
      if (nextWord && isFuzzyMatch(nextWord, spokenWord)) {
        scriptIndex += 1;
        scriptWord = normalizedScriptWords.value[scriptIndex];
        break;
      }
      break;
    }

    if (scriptWord && isFuzzyMatch(scriptWord, spokenWord)) {
      scriptIndex += 1;
    }
  }
  return scriptIndex;
};

// Function to check if enough words have been spoken
const hasSpokenEnoughWords = (transcript: string): boolean => {
  if (!currentScriptLine.value || normalizedScriptWords.value.length === 0) return false;

  const spoken = normalizeWords(transcript);
  
  if (spoken.length === 0) return false;
  
  const matchedCount = getOrderedMatchCount(spoken);
  const matchPercentage = matchedCount / normalizedScriptWords.value.length;
  return matchPercentage >= MATCH_THRESHOLD;
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

const logTtsDebug = (_message: string, _payload: Record<string, unknown> = {}) => {};

const showToast = (message: string, type: 'info' | 'error' = 'info', duration = 4000) => {
  if (isEmbedded.value && typeof window !== 'undefined' && window.parent && window.parent !== window) {
    window.parent.postMessage(
      { type: 'CONVERSATION_OVERLAY_TOAST', message, tone: type },
      window.location.origin
    );
    return;
  }
  const existingIndex = toasts.value.findIndex((t) => t.message === message && t.type === type);
  if (existingIndex !== -1) {
    toasts.value.splice(existingIndex, 1);
  }
  const toast = { id: `${Date.now()}-${Math.random()}`, message, type };
  toasts.value.push(toast);
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== toast.id);
  }, duration);
};

const startCompletionCountdown = (autoClose: boolean) => {
  if (practiceCompleted.value) return;
  practiceCompleted.value = true;
  autoCloseSeconds.value = 3;
  showToast(`Closing in ${autoCloseSeconds.value}...`, 'info', 900);
  if (autoCloseTimer) window.clearInterval(autoCloseTimer);
  autoCloseTimer = window.setInterval(() => {
    if (!autoCloseSeconds.value) return;
    autoCloseSeconds.value -= 1;
    if (autoCloseSeconds.value > 0) {
      showToast(`Closing in ${autoCloseSeconds.value}...`, 'info', 900);
      return;
    }
    if (autoCloseTimer) {
      window.clearInterval(autoCloseTimer);
      autoCloseTimer = null;
    }
    if (autoClose) {
      closeModal();
    } else {
      showToast('Practice complete.', 'info', 1200);
    }
  }, 1000);
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
    if (reason === 'manual_skip_button') {
      startCompletionCountdown(false);
      logTtsDebug('advanceToNextLine blocked at end (manual skip)', {
        triggerSource,
        reason,
      });
      return;
    }
    startCompletionCountdown(true);
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
    // Don't advance immediately on final result; wait for silence timeout
  }
};

speechRecognition.onWord.value = () => {};

// Update current transcript in real-time
watch(() => speechRecognition.transcript.value + speechRecognition.interimTranscript.value, (fullTranscript) => {
  if (speechRecognition.isListening.value) {
    const transcript = fullTranscript.trim();
    currentTranscript.value = transcript;
    const spoken = normalizeWords(transcript);
    const matchedCount = getOrderedMatchCount(spoken);
    const cappedIndex = Math.min(matchedCount, normalizedScriptWords.value.length);
    currentWordIndex.value = cappedIndex;
    highlightedWord.value =
      normalizedScriptWords.value[Math.min(cappedIndex, normalizedScriptWords.value.length - 1)] || '';
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
      if (!isSpeechSupported.value) {
        showToast('Speech-to-text is not available in this browser. Try Chrome, Edge, or Safari.', 'error');
        return;
      }
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

  if (!response || typeof response !== 'object' || !('success' in response) || !response.success) {
    logTtsDebug('piper request failed response', {
      voiceType,
      hasSuccess: Boolean(response && typeof response === 'object' && 'success' in response && response.success),
    });
    throw new Error('Piper TTS request failed');
  }

  if ('audioBase64' in response && typeof response.audioBase64 === 'string' && response.audioBase64.length > 0) {
    logTtsDebug('piper request success (inline)', {
      voiceType,
      hasContentType: 'contentType' in response && Boolean(response.contentType),
    });
    const binary = atob(response.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const contentType =
      'contentType' in response && typeof response.contentType === 'string' && response.contentType
        ? response.contentType
        : 'audio/wav';
    const blob = new Blob([bytes], { type: contentType });
    return URL.createObjectURL(blob);
  }

  if ('audioUrl' in response && typeof response.audioUrl === 'string' && response.audioUrl) {
    logTtsDebug('piper request success (url)', { voiceType });
    return resolvePlayableAudio(response.audioUrl);
  }

  throw new Error('Piper TTS response is missing audio data');
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
  const constantAudio = lineAudioMap.value[line.id];
  if (constantAudio) {
    logTtsDebug('resolveAiLineAudio chose constant', {
      targetLineId: line.id,
      source: 'constant',
    });
    return { audioUrl: constantAudio, source: 'constant' };
  }
  const cachedPiperAudio = piperAudioMap.value[line.id];
  if (cachedPiperAudio) {
    logTtsDebug('resolveAiLineAudio chose cached piper', {
      targetLineId: line.id,
      source: 'piper',
    });
    return { audioUrl: cachedPiperAudio, source: 'piper' };
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
      const rawAudio = String(item?.audioFile || '').trim();
      const audioUrl = resolvePlayableAudio(rawAudio);
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

watch(
  () => speechRecognition.isListening.value,
  (isListening) => {
    if (isListening) {
      startMicLevel();
    } else {
      stopMicLevel();
    }
  }
);

onMounted(() => {
  if (typeof document === 'undefined') return;
  const onScroll = (event: Event) => {
    if (!isDebugMode.value) return;
    const target = event.target as HTMLElement | null;
    if (!target || typeof target.scrollTop !== 'number') return;
    if (target.scrollHeight <= target.clientHeight) return;
    if (lastScrollTarget.value && lastScrollTarget.value !== target) {
      lastScrollTarget.value.style.outline = '';
    }
    target.style.outline = '2px solid #f97316';
    lastScrollTarget.value = target;
    scrollDebug.value = {
      tag: target.tagName.toLowerCase(),
      className: target.className || '',
      scrollTop: Math.round(target.scrollTop),
      scrollHeight: Math.round(target.scrollHeight),
      clientHeight: Math.round(target.clientHeight),
    };
  };
  document.addEventListener('scroll', onScroll, true);
  onUnmounted(() => {
    document.removeEventListener('scroll', onScroll, true);
    if (lastScrollTarget.value) {
      lastScrollTarget.value.style.outline = '';
    }
  });
});

onUnmounted(() => {
  stopMicLevel();
  if (scrollIdleTimer) {
    window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = null;
  }
});

watch(
  () => currentScriptLine.value?.id,
  () => {
    nextTick(() => {
      if (isUserScrolling.value) return;
      const target = scrollContainer.value;
      if (target) {
        target.scrollTo({ top: 0, behavior: 'smooth' });
        requestAnimationFrame(() => {
          if (!isUserScrolling.value) {
            target.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        return;
      }
      if (topAnchor.value) {
        topAnchor.value.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });
  }
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
  if (openedAt.value && typeof performance !== 'undefined') {
    if (performance.now() - openedAt.value < 250) return;
  }
  closeModal();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

const handlePopstate = () => {
  if (isEmbedded.value) return;
  if (!popstateReady) return;
  setTimeout(() => {
    if (route.path === '/english-practice') {
      closeModal();
    }
  }, 0);
};

const updateOrientationState = () => {
  if (typeof window === 'undefined') return;
  isSmallScreen.value = window.innerWidth < 640;
  isPortrait.value = window.matchMedia('(orientation: portrait)').matches;
};

// Lifecycle
onMounted(() => {
  if (typeof performance !== 'undefined') {
    openedAt.value = performance.now();
  }
  if (typeof document !== 'undefined') {
    if (!originalBodyOverflow.value) {
      originalBodyOverflow.value = document.body.style.overflow;
    }
    returnTo.value = String(route.query.returnTo || '').trim();
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('popstate', handlePopstate);
    updateOrientationState();
    window.addEventListener('resize', updateOrientationState);
    window.addEventListener('orientationchange', updateOrientationState);
    if (!isEmbedded.value) {
      // Avoid immediately closing the modal on the opening click
      setTimeout(() => {
        allowOverlayClose.value = true;
      }, 0);
    }
    setTimeout(() => {
      popstateReady = true;
    }, 300);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      isSpeechSupported.value = false;
      showToast('Speech-to-text is not available in this browser. Try Chrome, Edge, or Safari.', 'error');
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

watch(
  () => isModalOpen.value,
  (open) => {
    if (typeof document === 'undefined') return;
    if (open) {
      if (!originalBodyOverflow.value) {
        originalBodyOverflow.value = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalBodyOverflow.value;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('popstate', handlePopstate);
    window.removeEventListener('resize', updateOrientationState);
    window.removeEventListener('orientationchange', updateOrientationState);
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
  if (autoCloseTimer) {
    window.clearInterval(autoCloseTimer);
    autoCloseTimer = null;
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

<style scoped>
.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  background: rgba(59, 130, 246, 0.15);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.practice-modal {
  background: transparent;
  color: #0f172a;
  border: none;
  box-shadow: none;
}

.modal-inner {
  border: 1px solid #e5e7eb;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  background: #ffffff;
}

.practice-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.practice-body {
  gap: 16px;
}

.practice-content {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.loading-bar__inner {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.9));
  animation: loading-sweep 1.2s ease-in-out infinite;
}

@keyframes loading-sweep {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(60%);
  }
  100% {
    transform: translateX(180%);
  }
}

.mic-overlay {
  width: 100%;
  display: flex;
  justify-content: center;
}

.mic-overlay__inner {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 320px;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@media (max-width: 639px) and (orientation: landscape) {
  .mic-overlay {
    position: absolute;
    inset-inline: 0;
    bottom: 16px;
    z-index: 20;
    pointer-events: none;
  }

  .mic-overlay__inner {
    max-width: 260px;
    gap: 8px;
    pointer-events: auto;
  }
}
</style>

<style scoped>
.toast-container {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 16px;
  flex-direction: column;
  gap: 12px;
  z-index: 1200;
  width: min(92vw, 520px);
  pointer-events: none;
  left: 50%;
  transform: translateX(-50%);
}

.toast {
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  width: 100%;
  text-align: center;
}

.toast.info {
  background: #ffffff;
}

.toast.error {
  background: #ffffff;
  border-color: #fecaca;
  color: #991b1b;
}

@media (max-width: 640px) {
  .toast-container {
    padding-top: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
