<template>
  <div class="interactive-vidstack-wrapper relative">
    <div v-if="error" class="error-message p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
      {{ error }}
    </div>
    
    <ClientOnly v-else>
      <div class="relative w-full h-full">
        <media-player 
          ref="playerRef"
          :title="title" 
          :src="src"
          @timeupdate="handleTimeUpdate"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleEnded"
        >
          <media-provider />
          <media-video-layout />
          
          <!-- Quiz markers on progress bar (custom) -->
          <media-progress>
            <media-progress-track>
              <media-progress-bar />
              <!-- Quiz markers -->
              <div
                v-for="quiz in quizzes"
                :key="quiz.id"
                :style="{ left: `${(quiz.timestamp / videoDuration) * 100}%` }"
                :class="[
                  'absolute top-0 w-1 h-full bg-yellow-400 transform -translate-x-1/2 cursor-pointer hover:bg-yellow-500 transition-colors',
                  isQuizAnswered(quiz.id) ? 'bg-green-500' : '',
                ]"
                :title="`Quiz at ${formatTime(quiz.timestamp)}`"
                @click="seekToTimestamp(quiz.timestamp)"
              />
            </media-progress-track>
          </media-progress>
        </media-player>

        <!-- Quiz Overlay -->
        <VideoQuizOverlay
          v-if="activeQuiz"
          :quiz="activeQuiz"
          :required="activeQuiz?.required || false"
          @submit="handleQuizSubmit"
          @close="handleQuizClose"
          @continue="handleQuizContinue"
        />

        <!-- Path Indicator (optional, shown when branching enabled) -->
        <div v-if="showPathIndicator && (quizzes.length > 0 || currentPath.length > 0)" class="absolute top-4 right-4 z-40 max-w-xs">
          <BranchingPathIndicator
            :current-path="currentPath"
            :quizzes="quizzes"
            :completed-quizzes="completedQuizzesCount"
            :current-score="totalScore"
            :current-timestamp="currentTime"
            :show-path-indicator="showPathIndicator"
            @switch-path="handlePathSwitch"
          />
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { VideoQuiz, BranchResult, QuizResult } from '~/types/video-quiz.interface';
import { useVideoQuiz } from '~/composables/useVideoQuiz';
import { useVideoBranching } from '~/composables/useVideoBranching';

interface Props {
  src: string;
  title?: string;
  videoId: string;
  userId: string;
  quizzes?: VideoQuiz[];
  showPathIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  quizzes: () => [],
  showPathIndicator: true,
});

const emit = defineEmits<{
  'time-update': [timestamp: number];
  'quiz-trigger': [quiz: VideoQuiz];
  'quiz-complete': [result: QuizResult];
  'branch-execute': [result: BranchResult];
  'video-complete': [];
}>();

const playerRef = ref<any>(null);
const error = ref<string | null>(null);
const currentTime = ref(0);
const videoDuration = ref(0);
const isPaused = ref(false);
const lastCheckedTimestamp = ref(-1);

// Composables
const videoQuiz = useVideoQuiz(props.videoId);
const videoBranching = useVideoBranching();

// Load quizzes
watch(() => props.quizzes, (newQuizzes) => {
  if (newQuizzes && newQuizzes.length > 0) {
    videoQuiz.loadQuizzes(newQuizzes);
  }
}, { immediate: true });

// Set up quiz handlers
videoQuiz.onQuizTrigger.value = (quiz: VideoQuiz) => {
  pauseVideo();
  emit('quiz-trigger', quiz);
};

videoQuiz.onQuizSubmit.value = (result: QuizResult) => {
  emit('quiz-complete', result);
  
  // Check if quiz has branching
  const quiz = videoQuiz.quizzes.value.find(q => q.id === result.quizId);
  if (quiz?.branching) {
    const branchResult = videoBranching.evaluateBranch(quiz.branching, result);
    executeBranch(branchResult);
  }
};

videoBranching.onBranchExecute.value = (branchResult: BranchResult) => {
  emit('branch-execute', branchResult);
};

// Computed
const activeQuiz = computed(() => videoQuiz.activeQuiz.value);
const currentPath = computed(() => videoBranching.currentPath.value);
const completedQuizzesCount = computed(() => videoQuiz.quizHistory.value.length);
const totalScore = computed(() => videoQuiz.totalScore.value);

const quizzes = computed(() => videoQuiz.quizzes.value);

// Methods
const handleTimeUpdate = (event: any) => {
  if (!playerRef.value) return;
  
  try {
    const player = playerRef.value.$el || playerRef.value;
    const currentTimeValue = player?.currentTime || event?.detail?.currentTime || 0;
    const durationValue = player?.duration || event?.detail?.duration || 0;
    
    currentTime.value = currentTimeValue;
    videoDuration.value = durationValue || 0;
    
    emit('time-update', currentTimeValue);
    
    // Check for quiz at timestamp (debounced check)
    if (Math.abs(currentTimeValue - lastCheckedTimestamp.value) >= 0.5) {
      lastCheckedTimestamp.value = currentTimeValue;
      checkForQuiz(currentTimeValue);
    }
  } catch (err: any) {
    console.error('[InteractiveVidstackPlayer] Time update error:', err);
  }
};

const handlePlay = () => {
  isPaused.value = false;
};

const handlePause = () => {
  isPaused.value = true;
};

const handleEnded = () => {
  emit('video-complete');
};

const checkForQuiz = (timestamp: number) => {
  // Only check if video is playing and not already showing a quiz
  if (isPaused.value || activeQuiz.value) return;
  
  const quiz = videoQuiz.checkQuizAtTimestamp(timestamp);
  if (quiz) {
    pauseVideo();
  }
};

const handleQuizSubmit = (answer: any) => {
  if (!activeQuiz.value) return;
  
  const result = videoQuiz.submitQuizAnswer(
    activeQuiz.value.id,
    answer,
    props.userId
  );
  
  // Result handling is done via onQuizSubmit callback
};

const handleQuizClose = () => {
  if (activeQuiz.value && !activeQuiz.value.required) {
    videoQuiz.activeQuiz.value = null;
    resumeVideo();
  }
};

const handleQuizContinue = () => {
  videoQuiz.activeQuiz.value = null;
  resumeVideo();
};

const executeBranch = (branchResult: BranchResult) => {
  if (!playerRef.value) return;
  
  try {
    const player = playerRef.value.$el || playerRef.value;
    videoBranching.executeBranchAction(branchResult, player);
  } catch (err: any) {
    console.error('[InteractiveVidstackPlayer] Branch execution error:', err);
  }
};

const pauseVideo = () => {
  if (!playerRef.value) return;
  
  try {
    const player = playerRef.value.$el || playerRef.value;
    if (player?.pause) {
      player.pause();
    } else if (playerRef.value?.pause) {
      playerRef.value.pause();
    }
    isPaused.value = true;
  } catch (err: any) {
    console.error('[InteractiveVidstackPlayer] Pause error:', err);
  }
};

const resumeVideo = () => {
  if (!playerRef.value) return;
  
  try {
    const player = playerRef.value.$el || playerRef.value;
    if (player?.play) {
      player.play();
    } else if (playerRef.value?.play) {
      playerRef.value.play();
    }
    isPaused.value = false;
  } catch (err: any) {
    console.error('[InteractiveVidstackPlayer] Resume error:', err);
  }
};

const seekToTimestamp = (timestamp: number) => {
  if (!playerRef.value) return;
  
  try {
    const player = playerRef.value.$el || playerRef.value;
    if (player?.currentTime !== undefined) {
      player.currentTime = timestamp;
    } else if (player?.seek) {
      player.seek(timestamp);
    } else if (player?.fastSeek) {
      player.fastSeek(timestamp);
    }
    currentTime.value = timestamp;
  } catch (err: any) {
    console.error('[InteractiveVidstackPlayer] Seek error:', err);
  }
};

const isQuizAnswered = (quizId: string): boolean => {
  return videoQuiz.quizHistory.value.some(h => h.quizId === quizId);
};

const handlePathSwitch = (path: string[]) => {
  // Handle path switching (could restart video with new path)
  console.log('[InteractiveVidstackPlayer] Switch path:', path);
  // Implementation depends on requirements
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Initialize Vidstack on mount
onMounted(async () => {
  try {
    await import('vidstack/bundle');
  } catch (err: any) {
    error.value = 'Failed to load video player. Please try again later.';
    console.error('[InteractiveVidstackPlayer] Failed to load vidstack:', err);
  }
});

// Cleanup
onUnmounted(() => {
  videoQuiz.reset();
  videoBranching.reset();
});
</script>

<style scoped>
.interactive-vidstack-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: black;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

/* Fullscreen support - wrapper becomes fullscreen element */
.interactive-vidstack-wrapper:fullscreen {
  background: black;
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
  border-radius: 0;
}

.interactive-vidstack-wrapper:-webkit-full-screen {
  background: black;
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
  border-radius: 0;
}

.interactive-vidstack-wrapper:-moz-full-screen {
  background: black;
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
  border-radius: 0;
}

.interactive-vidstack-wrapper:-ms-fullscreen {
  background: black;
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
  border-radius: 0;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>

