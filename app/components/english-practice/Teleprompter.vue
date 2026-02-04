<template>
  <div class="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
    <!-- Avatars at top -->
    <div class="w-full max-w-4xl flex items-center justify-between mb-8">
      <EnglishPracticeAvatar
        :name="primaryAvatar.name"
        :type="primaryAvatar.type"
        position="left"
        :is-active="currentTurn === primaryAvatar.id"
        :is-speaking="currentTurn === primaryAvatar.id && (primaryAvatar.type === 'ai' ? isAISpeaking : isRecording)"
        :is-waiting="currentTurn !== primaryAvatar.id && !(primaryAvatar.type === 'ai' ? isAISpeaking : isRecording)"
      />
      <EnglishPracticeAvatar
        :name="secondaryAvatar.name"
        :type="secondaryAvatar.type"
        position="right"
        :is-active="currentTurn === secondaryAvatar.id"
        :is-speaking="currentTurn === secondaryAvatar.id && (secondaryAvatar.type === 'ai' ? isAISpeaking : isRecording)"
        :is-waiting="currentTurn !== secondaryAvatar.id && !(secondaryAvatar.type === 'ai' ? isAISpeaking : isRecording)"
      />
    </div>

    <!-- Script line display (current line to practice) -->
    <div
      v-if="currentScriptLine"
      class="w-full max-w-5xl mb-12"
    >
      <div class="text-center mb-4">
        <div class="inline-block px-4 py-2 bg-oceanBlue/10 rounded-full">
          <span class="text-sm font-medium text-oceanBlue">
            Line {{ currentLineIndex + 1 }} of {{ totalLines }}
          </span>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-2xl p-8 border-2 border-oceanBlue/20">
        <!-- Header with read-aloud controls -->
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider">
            {{ currentSpeakerLabel }}'s Line
          </div>
          <!-- Read-aloud controls -->
          <div class="flex items-center gap-2">
            <button
              @click="handleReadAloudToggle"
              @keydown.enter.prevent="handleReadAloudToggle"
              @keydown.space.prevent="handleReadAloudToggle"
              :disabled="isReadAloudDisabled"
              :aria-label="readAloud.isPlaying ? 'Pause pronunciation' : 'Play pronunciation'"
              :aria-pressed="readAloud.isPlaying ? 'true' : 'false'"
              tabindex="0"
              :class="[
                'p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:ring-offset-2',
                isReadAloudDisabled
                  ? 'text-gray-300 cursor-not-allowed opacity-50'
                  : readAloud.isPlaying
                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                  : 'text-oceanBlue bg-oceanBlue/10 hover:bg-oceanBlue/20'
              ]"
            >
              <Icon
                :name="readAloud.isPlaying ? 'heroicons:pause' : 'heroicons:play'"
                class="w-5 h-5"
                :class="{ 'animate-pulse': readAloud.isPlaying }"
              />
            </button>
            <!-- Repeat button (only show if has been played) -->
            <button
              v-if="readAloud.hasPlayed && !readAloud.isPlaying"
              @click="handleRepeat"
              @keydown.enter.prevent="handleRepeat"
              @keydown.space.prevent="handleRepeat"
              :disabled="isReadAloudDisabled"
              :aria-label="'Repeat pronunciation'"
              tabindex="0"
              :class="[
                'p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:ring-offset-2',
                isReadAloudDisabled
                  ? 'text-gray-300 cursor-not-allowed opacity-50'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              ]"
            >
              <Icon name="heroicons:arrow-path" class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- Teleprompter text with word highlighting - scrollable container -->
        <div class="text-center max-h-[60vh] overflow-y-auto overflow-x-hidden" ref="textContainer">
          <div
            :class="[
              'font-semibold leading-relaxed text-gray-900 select-none',
              // Adjust text size based on line length - smaller for longer lines
              scriptWords.length > 30
                ? 'text-xl md:text-2xl lg:text-3xl'
                : scriptWords.length > 20
                ? 'text-2xl md:text-3xl lg:text-4xl'
                : 'text-3xl md:text-4xl lg:text-5xl'
            ]"
            style="line-height: 1.6;"
          >
            <span
              v-for="(word, index) in scriptWords"
              :key="index"
              :class="[
                'transition-all duration-200 px-1 rounded',
                // During read-aloud playback
                readAloud.isPlaying && readAloud.currentPlaybackWordIndex.value === index
                  ? 'bg-purple-300 text-gray-900 font-bold scale-110'
                  : readAloud.isPlaying && readAloud.currentPlaybackWordIndex.value > index
                  ? 'text-purple-600 font-medium'
                  // During speech recognition
                  : getWordState(index, word) === 'highlighted'
                  ? 'bg-yellow-300 text-gray-900 font-bold scale-110'
                  : getWordState(index, word) === 'spoken'
                  ? 'text-green-600 font-medium'
                  : getWordState(index, word) === 'next'
                  ? 'text-blue-500 font-medium underline'
                  : getWordState(index, word) === 'upcoming'
                  ? 'text-gray-400 opacity-60'
                  : 'text-gray-900'
              ]"
            >
              {{ word }}{{ index < scriptWords.length - 1 ? ' ' : '' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Spoken transcript display (what was actually said) -->
    <div
      v-if="currentTranscript"
      class="w-full max-w-5xl mt-8"
    >
      <div class="bg-gray-100 rounded-xl p-6 border border-gray-200">
        <div class="text-xs text-gray-500 mb-2 text-center uppercase tracking-wider">
          What You Said
        </div>
        <div class="text-2xl md:text-3xl font-medium text-gray-700 text-center leading-relaxed">
          {{ currentTranscript }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!currentScriptLine"
      class="text-center max-w-2xl"
    >
      <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
        <Icon
          name="heroicons:microphone"
          class="w-12 h-12 text-oceanBlue"
        />
      </div>
      <h2 class="text-3xl font-bold text-gray-800 mb-4">
        Ready to Practice
      </h2>
      <p class="text-lg text-gray-600">
        Click the microphone to start speaking. Words will light up as you speak!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue';
import type { SpeakerType, PracticeMode, ConversationParticipant } from '~/types/script.interface';
import type { ScriptLine } from '~/types/script.interface';
import { useReadAloud } from '~/composables/useReadAloud';
import { inferVoiceTypeByName } from '~/utilities/inferVoiceTypeByName';

interface Props {
  currentScriptLine?: ScriptLine;
  currentLineIndex: number;
  totalLines: number;
  currentTurn?: SpeakerType;
  isRecording: boolean;
  highlightedWord?: string;
  currentTranscript?: string;
  mode: PracticeMode;
  isAISpeaking?: boolean;
  currentWordIndex?: number; // Track current position in script words
  participants?: ConversationParticipant[];
}

const props = defineProps<Props>();

// Read-aloud composable
const readAloud = useReadAloud();

// Text container ref for scrolling
const textContainer = ref<HTMLElement | null>(null);

const scriptWords = computed(() => {
  if (!props.currentScriptLine?.text) return [];
  return props.currentScriptLine.text.trim().split(/\s+/);
});

// Get word state based on sequential position
const getWordState = (wordIndex: number, word: string): 'highlighted' | 'spoken' | 'next' | 'upcoming' | 'default' => {
  // If it's not the current speaker's turn, show default
  if (props.currentTurn !== props.currentScriptLine?.speaker) {
    return 'default';
  }
  
  const currentIndex = props.currentWordIndex || 0;
  const normalizedWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
  const normalizedHighlighted = props.highlightedWord?.toLowerCase().replace(/[.,!?;:]/g, '') || '';
  
  // Word has been spoken (index is less than current position)
  if (wordIndex < currentIndex) {
    return 'spoken';
  }
  
  // Word is currently being spoken (at current position and matches highlighted word)
  if (wordIndex === currentIndex && normalizedHighlighted) {
    if (normalizedWord === normalizedHighlighted || 
        normalizedWord.includes(normalizedHighlighted) || 
        normalizedHighlighted.includes(normalizedWord)) {
      return 'highlighted';
    }
  }
  
  // Word is next to be spoken (at current position but not yet highlighted)
  if (wordIndex === currentIndex) {
    return 'next';
  }
  
  // Word hasn't been reached yet
  if (wordIndex > currentIndex) {
    return 'upcoming';
  }
  
  return 'default';
};

const participants = computed<ConversationParticipant[]>(() => {
  if (Array.isArray(props.participants) && props.participants.length) {
    return props.participants;
  }
  return [
    { id: 'speaker-1', name: 'Speaker 1', type: 'student' },
    { id: 'speaker-2', name: 'Speaker 2', type: props.mode === 'single-user' ? 'ai' : 'student' },
  ];
});

const primaryAvatar = computed<ConversationParticipant>(() => {
  return participants.value[0] || { id: 'speaker-1', name: 'Speaker 1', type: 'student' };
});

const shownSecondarySpeakerId = ref<string>('');

const secondaryAvatar = computed<ConversationParticipant>(() => {
  const fallback = participants.value.find((participant) => participant.id !== primaryAvatar.value.id)
    || { id: 'speaker-2', name: 'Speaker 2', type: 'student' as const };

  const match = participants.value.find(
    (participant) => participant.id === shownSecondarySpeakerId.value && participant.id !== primaryAvatar.value.id
  );
  return match || fallback;
});

const participantNameMap = computed(() => {
  const map = new Map<string, string>();
  participants.value.forEach((participant, index) => {
    map.set(participant.id, participant.name || `Speaker ${index + 1}`);
  });
  return map;
});

watch(
  () => props.currentTurn,
  (turn) => {
    if (!turn) return;
    if (turn !== primaryAvatar.value.id) {
      shownSecondarySpeakerId.value = String(turn);
    }
  },
  { immediate: true }
);

const currentSpeakerLabel = computed(() => {
  if (!props.currentScriptLine) {
    return '';
  }
  return participantNameMap.value.get(props.currentScriptLine.speaker) || 'Speaker';
});

// Check if read-aloud should be disabled
const isReadAloudDisabled = computed(() => {
  return props.isRecording || props.isAISpeaking || !props.currentScriptLine?.text;
});

// Handle read-aloud toggle
const handleReadAloudToggle = () => {
  if (isReadAloudDisabled.value) {
    return;
  }

  if (!props.currentScriptLine?.text) {
    return;
  }

  readAloud.toggle(
    props.currentScriptLine.text,
    (wordIndex: number) => {
      // Word progress callback is handled by the composable's reactive state
    },
    {
      lang: 'en-US',
      rate: 1,
      pitch: 1.1,
      volume: 1,
      voiceType: inferVoiceTypeByName(currentSpeakerLabel.value),
    }
  );
};

// Handle repeat
const handleRepeat = () => {
  if (isReadAloudDisabled.value) {
    return;
  }

  if (!props.currentScriptLine?.text) {
    return;
  }

  readAloud.repeat(
    props.currentScriptLine.text,
    (wordIndex: number) => {
      // Word progress callback is handled by the composable's reactive state
    },
    {
      lang: 'en-US',
      rate: 1,
      pitch: 1.1,
      volume: 1,
      voiceType: inferVoiceTypeByName(currentSpeakerLabel.value),
    }
  );
};

// Stop read-aloud if recording starts
watch(() => props.isRecording, (isRecording) => {
  if (isRecording && readAloud.isPlaying.value) {
    readAloud.stop();
  }
});

// Stop read-aloud if AI starts speaking
watch(() => props.isAISpeaking, (isAISpeaking) => {
  if (isAISpeaking && readAloud.isPlaying.value) {
    readAloud.stop();
  }
});

// Reset playback when script line changes
watch(() => props.currentScriptLine?.id, () => {
  if (readAloud.isPlaying.value) {
    readAloud.stop();
  }
  // Reset hasPlayed for new line
  readAloud.hasPlayed.value = false;
  // Scroll to top when line changes (but not when recording starts)
  nextTick(() => {
    if (textContainer.value && !props.isRecording) {
      textContainer.value.scrollTop = 0;
    }
  });
});

// Don't scroll to top when recording starts - maintain current scroll position
watch(() => props.isRecording, (isRecording) => {
  // When recording starts, don't change scroll position
  // This prevents the "jump to top" issue
});
</script>
