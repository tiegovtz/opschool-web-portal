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
              {{ mode === 'multi-user' ? 'Practice with a partner' : 'Practice with AI tutor' }}
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
            <!-- Script info -->
            <div v-if="script" class="text-sm">
              {{ script.title }}
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
          :is-ai-speaking="textToSpeech.isSpeaking.value"
          :current-word-index="currentWordIndex"
          :student1-name="student1DisplayName"
          :student2-name="participantTwoName"
          :ai-name="aiDisplayName"
        />

        <!-- Mic control -->
        <EnglishPracticeMicControl
          :is-recording="speechRecognition.isListening.value"
          :current-turn="turnManager.currentTurn.value"
          :can-record="canRecord"
          @toggle="handleMicToggle"
        />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ConversationScript, ScriptLine, SpeakerType, PracticeMode } from '~/types/script.interface';
import { useSpeechRecognition } from '~/composables/useSpeechRecognition';
import { useTurnManager } from '~/composables/useTurnManager';
import { useTextToSpeech } from '~/composables/useTextToSpeech';

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
const originalBodyOverflow = ref('');
const allowOverlayClose = ref(false);
const returnTo = ref('');
const scriptLoading = ref(false);
const scriptError = ref('');
const student1DisplayName = ref('Student 1');
const student2DisplayName = ref('Student 2');
const aiDisplayName = ref('AI Tutor');
const participantTwoName = computed(() =>
  mode.value === 'single-user' ? aiDisplayName.value : student2DisplayName.value
);

const isEmbedded = computed(() => String(route.query.embed || '') === '1');

// Composables
const speechRecognition = useSpeechRecognition();
const turnManager = useTurnManager(() => mode.value);
const textToSpeech = useTextToSpeech();

// Computed
const currentScriptLine = computed<ScriptLine | undefined>(() => {
  if (!script.value || currentLineIndex.value >= script.value.lines.length) {
    return undefined;
  }
  return script.value.lines[currentLineIndex.value];
});

const canRecord = computed(() => {
  const currentTurn = turnManager.currentTurn.value;
  const isAITurn = currentTurn === 'ai';
  const isListening = speechRecognition.isListening.value;
  const isSpeaking = textToSpeech.isSpeaking.value;
  
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

      // Move to next script line
      if (currentScriptLine.value && currentLineIndex.value < (script.value?.lines.length || 0) - 1) {
        currentLineIndex.value++;
      }

      // Switch turn
      turnManager.switchTurn();
      
      // Stop recording
      speechRecognition.stop();
      
      // If next turn is AI, speak the script line (with small delay to ensure speech recognition stops)
      if (turnManager.currentTurn.value === 'ai' && mode.value === 'single-user') {
        console.log('[onResult] Turn switched to AI, current line index:', currentLineIndex.value);
        // Small delay to ensure speech recognition is fully stopped
        setTimeout(() => {
          handleAITurn();
        }, 300);
      }
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

    // Move to next script line
    const scriptLine = currentScriptLine.value;
    if (scriptLine && currentLineIndex.value < (script.value?.lines.length || 0) - 1) {
      currentLineIndex.value++;
    }

    // Switch turn
    speechRecognition.stop();
    turnManager.switchTurn();
    
    // If next turn is AI, speak the script line (with small delay to ensure speech recognition stops)
    if (turnManager.currentTurn.value === 'ai' && mode.value === 'single-user') {
      console.log('[onSilence] Turn switched to AI, current line index:', currentLineIndex.value);
      // Small delay to ensure speech recognition is fully stopped
      setTimeout(() => {
        handleAITurn();
      }, 300);
    }
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

// Text-to-speech handlers
textToSpeech.onEnd.value = () => {
  // After AI finishes speaking, switch back to student and move to next line
  if (mode.value === 'single-user') {
    // Reset word index for student's next turn
    currentWordIndex.value = 0;
    highlightedWord.value = '';
    currentTranscript.value = '';
    spokenWords.value.clear();
    
    // Move to next script line for student
    if (currentLineIndex.value < (script.value?.lines.length || 0) - 1) {
      currentLineIndex.value++;
    }
    
    // Switch back to student
    turnManager.setTurn('student1');
  }
};

textToSpeech.onError.value = (error) => {
  console.error('Text-to-speech error:', error);
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

const handleAITurn = () => {
  const scriptLine = currentScriptLine.value;
  if (!scriptLine) {
    console.log('[handleAITurn] No script line available');
    return;
  }

  // In single-user mode, AI speaks lines marked as 'student2' or 'ai'
  // In multi-user mode, only speak lines marked as 'ai' (if any)
  const shouldSpeak = mode.value === 'single-user' 
    ? (scriptLine.speaker === 'student2' || scriptLine.speaker === 'ai')
    : scriptLine.speaker === 'ai';

  if (!shouldSpeak) {
    console.log('[handleAITurn] Line speaker is:', scriptLine.speaker, 'Mode:', mode.value, '- No AI line to speak');
    return;
  }

  console.log('[handleAITurn] AI speaking line:', scriptLine.text);
  
  // Speak the script line
  textToSpeech.speak(scriptLine.text, {
    lang: 'en-US',
    rate: 0.9,
    pitch: 1.1,
  });

  // Move to next script line after AI speaks
  // (This will happen in the onEnd handler)
};

const normalizeQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim();
  }
  return String(value || '').trim();
};

const convertPiecesToScript = (
  pieces: string[],
  identifier?: string
): { lines: ScriptLine[]; displayNames: { student1: string; student2: string; ai: string } } => {
  const cleanedPieces = pieces
    .map((piece) => String(piece || '').trim())
    .filter((text) => text.length > 0);

  const speakerAssignments = new Map<string, SpeakerType>();
  let assignmentCount = 0;
  const displayNames = {
    student1: 'Student 1',
    student2: 'Student 2',
    ai: 'AI Tutor',
  };

  const lines: ScriptLine[] = [];

  cleanedPieces.forEach((rawText, index) => {
    let text = rawText;
    let explicitSpeaker: string | null = null;
    const colonIndex = rawText.indexOf(':');
    if (colonIndex > 0) {
      const potentialSpeaker = rawText.slice(0, colonIndex).trim();
      const remaining = rawText.slice(colonIndex + 1).trim();
      if (potentialSpeaker && remaining) {
        explicitSpeaker = potentialSpeaker;
        text = remaining;
      }
    }

    let speaker: SpeakerType = index % 2 === 0 ? 'student1' : 'student2';

    if (explicitSpeaker) {
      const normalizedSpeaker = explicitSpeaker.toLowerCase();
      if (
        normalizedSpeaker.includes('ai') ||
        normalizedSpeaker.includes('tutor') ||
        normalizedSpeaker.includes('bot')
      ) {
        speaker = 'ai';
        displayNames.ai = explicitSpeaker;
      } else {
        if (speakerAssignments.has(normalizedSpeaker)) {
          speaker = speakerAssignments.get(normalizedSpeaker)!;
        } else {
          const nextRole: SpeakerType =
            assignmentCount === 0
              ? 'student1'
              : assignmentCount === 1
                ? 'student2'
                : 'ai';
          speakerAssignments.set(normalizedSpeaker, nextRole);
          assignmentCount += 1;
          if (nextRole === 'student1') {
            displayNames.student1 = explicitSpeaker;
          } else if (nextRole === 'student2') {
            displayNames.student2 = explicitSpeaker;
          }
          speaker = nextRole;
        }
      }
    }

    const lineId = identifier ? `${identifier}-${index}` : `line-${index}`;
    lines.push({
      id: lineId,
      speaker,
      text,
      order: index + 1,
    });
  });

  return { lines, displayNames };
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
    const response = await $fetch('/api/conversation/engage', { query });
    const pieces = Array.isArray(response?.pieces) ? response.pieces : [];
    
    if (pieces.length === 0) {
      scriptError.value = 'No conversation pieces were returned for this chapter.';
      return;
    }
    const { lines, displayNames } = convertPiecesToScript(
      pieces,
      response?.identifier || identifier || ''
    );
    if (!lines.length) {
      scriptError.value = 'The conversation data appears to be empty.';
      return;
    }

    script.value = {
      id: response?.identifier || `${chapterId}-${Date.now()}`,
      title: response?.name || 'English Speaking Practice',
      lines,
    };
    student1DisplayName.value = displayNames.student1 || 'Student 1';
    student2DisplayName.value = displayNames.student2 || 'Student 2';
    aiDisplayName.value = displayNames.ai || 'AI Tutor';
    currentLineIndex.value = 0;
    currentWordIndex.value = 0;
    highlightedWord.value = '';
    currentTranscript.value = '';
    spokenWords.value.clear();
    turnManager.reset();
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
  if (speechRecognition.isListening.value || textToSpeech.isSpeaking.value) {
    console.log('Cannot switch mode while recording or speaking');
    return;
  }
  
  mode.value = newMode;
  
  // Reset turn manager for new mode
  turnManager.reset();
  
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
  turnManager.reset();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = originalBodyOverflow.value;
  }
  speechRecognition.stop();
  textToSpeech.stop();
});
</script>
