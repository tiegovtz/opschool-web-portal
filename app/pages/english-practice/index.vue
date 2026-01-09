<template>
  <NuxtLayout name="home-layout">
    <div class="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <header class="px-6 py-4 bg-gradient-to-r from-oceanBlue to-deepBlue text-white">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">English Speaking Practice</h1>
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
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { ConversationScript, ScriptLine, SpeakerType, PracticeMode } from '~/types/script.interface';
import { useSpeechRecognition } from '~/composable/useSpeechRecognition';
import { useTurnManager } from '~/composable/useTurnManager';
import { useTextToSpeech } from '~/composable/useTextToSpeech';

// Sample script for testing (can be replaced with API call or prop)
const sampleScript: ConversationScript = {
  id: 'sample-1',
  title: 'Greetings and Introductions',
  lines: [
    { id: '1', speaker: 'student1', text: 'Hello, my name is John. What is your name?', order: 1 },
    { id: '2', speaker: 'student2', text: 'Hi John! My name is Sarah. Nice to meet you.', order: 2 },
    { id: '3', speaker: 'student1', text: 'Nice to meet you too, Sarah. Where are you from?', order: 3 },
    { id: '4', speaker: 'student2', text: 'I am from Dar es Salaam. How about you?', order: 4 },
    { id: '5', speaker: 'student1', text: 'I am from Arusha. It is a beautiful city.', order: 5 },
  ],
};

// State
const script = ref<ConversationScript | null>(sampleScript);
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
      
      // If next turn is AI, speak the script line
      if (turnManager.currentTurn.value === 'ai' && mode.value === 'single-user') {
        handleAITurn();
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
    
    // Use fuzzy matching to handle variations
    if (normalizedSpoken === expectedWord || 
        normalizedSpoken.includes(expectedWord) || 
        expectedWord.includes(normalizedSpoken)) {
      // Match! Highlight this word and advance position
      highlightedWord.value = normalizedSpoken;
      currentWordIndex.value++;
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
    
    // If next turn is AI, speak the script line
    if (turnManager.currentTurn.value === 'ai' && mode.value === 'single-user') {
      handleAITurn();
    }
  } else if (transcript) {
    // Not enough words - show feedback but don't switch
    // Keep recording to allow student to continue
    console.log('Please speak more words from the script. You need to say at least 80% of the words.');
  }
};

speechRecognition.onError.value = (error) => {
  console.error('Speech recognition error:', error);
};

// Text-to-speech handlers
textToSpeech.onEnd.value = () => {
  // After AI finishes speaking, move to next line and switch back to student
  if (mode.value === 'single-user') {
    if (currentLineIndex.value < (script.value?.lines.length || 0) - 1) {
      currentLineIndex.value++;
    }
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
  if (!scriptLine || scriptLine.speaker !== 'ai') return;

  // Speak the script line
  textToSpeech.speak(scriptLine.text, {
    lang: 'en-US',
    rate: 0.9,
    pitch: 1.1,
  });

  // Move to next script line after AI speaks
  // (This will happen in the onEnd handler)
};

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

// Lifecycle
onMounted(() => {
  detectMode();
  turnManager.reset();
});

onUnmounted(() => {
  speechRecognition.stop();
  textToSpeech.stop();
});
</script>

