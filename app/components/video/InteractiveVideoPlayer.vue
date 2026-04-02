<template>
  <div
    ref="containerRef"
    class="interactive-video-container relative w-full bg-black rounded-lg overflow-hidden"
    :style="containerStyle"
  >
    <!-- Video Element -->
    <video
      ref="videoRef"
      :src="src"
      class="w-full h-full"
      :controls="controls"
      :preload="preload"
      :autoplay="autoplay"
      :muted="muted"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @click="handleVideoClick"
    >
      <source :src="src" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <!-- Quiz Overlay - Absolutely positioned within container -->
    <Transition name="quiz-overlay">
      <div
        v-if="activeQuiz"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-question"
        @click.self="handleOverlayClick"
      >
        <VideoQuizContent
          :quiz="activeQuiz"
          :required="activeQuiz.required"
          @submit="handleQuizSubmit"
          @close="handleQuizClose"
          @continue="handleQuizContinue"
        />
      </div>
    </Transition>

    <!-- Quiz Timeline Markers (Optional) -->
    <div
      v-if="showTimelineMarkers && quizzes.length > 0 && duration > 0"
      class="absolute bottom-0 left-0 right-0 h-2 bg-black/50 z-30 pointer-events-none"
    >
      <div
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="absolute top-0 bottom-0 w-1 transform -translate-x-1/2"
        :style="{ left: `${(quiz.timestamp / duration) * 100}%` }"
        :class="isQuizCompleted(quiz.id) ? 'bg-green-500' : 'bg-yellow-400'"
        :title="`Quiz at ${formatTime(quiz.timestamp)}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { VideoQuiz } from '~/types/video-quiz.interface';
import { useVideoQuiz } from '~/composables/useVideoQuiz';
import VideoQuizContent from './VideoQuizContent.vue';

interface Props {
  src: string;
  videoId: string;
  userId: string;
  quizzes?: VideoQuiz[];
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  autoplay?: boolean;
  muted?: boolean;
  width?: string;
  height?: string;
  showTimelineMarkers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  quizzes: () => [],
  controls: true,
  preload: 'auto',
  autoplay: false,
  muted: false,
  width: '100%',
  height: 'auto',
  showTimelineMarkers: true,
});

const emit = defineEmits<{
  'quiz-trigger': [quiz: VideoQuiz];
  'quiz-complete': [result: any];
  'video-end': [];
  'time-update': [time: number];
  'play': [];
  'pause': [];
}>();

// Refs
const containerRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

// State
const duration = ref(0);
const currentTime = ref(0);
const isPlaying = ref(false);

// Video Quiz Composable
const videoQuiz = useVideoQuiz(props.videoId);

// Computed
const activeQuiz = computed(() => videoQuiz.activeQuiz.value);
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  aspectRatio: props.height === 'auto' ? '16 / 9' : undefined,
}));

// Methods
const handleTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  currentTime.value = video.currentTime;
  
  // Check for quiz triggers
  if (props.quizzes.length > 0) {
    videoQuiz.checkQuizAtTimestamp(video.currentTime);
  }
  
  emit('time-update', video.currentTime);
};

const handleLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
  }
};

const handlePlay = () => {
  isPlaying.value = true;
  emit('play');
};

const handlePause = () => {
  isPlaying.value = false;
  emit('pause');
};

const handleEnded = () => {
  isPlaying.value = false;
  emit('video-end');
};

const handleVideoClick = () => {
  // Toggle play/pause on click (optional)
  // if (videoRef.value) {
  //   if (videoRef.value.paused) {
  //     videoRef.value.play();
  //   } else {
  //     videoRef.value.pause();
  //   }
  // }
};

const handleQuizSubmit = (answer: any) => {
  if (activeQuiz.value) {
    const result = videoQuiz.submitQuizAnswer(
      activeQuiz.value.id,
      answer,
      props.userId,
    );
    emit('quiz-complete', result);
  }
};

const handleQuizClose = () => {
  if (activeQuiz.value && !activeQuiz.value.required) {
    videoQuiz.activeQuiz.value = null;
    if (videoRef.value) {
      videoRef.value.play();
    }
  }
};

const handleQuizContinue = () => {
  videoQuiz.activeQuiz.value = null;
  if (videoRef.value) {
    videoRef.value.play();
  }
};

const handleOverlayClick = () => {
  // Only allow closing if quiz is not required
  if (activeQuiz.value && !activeQuiz.value.required) {
    handleQuizClose();
  }
};

const isQuizCompleted = (quizId: string) => {
  return videoQuiz.quizHistory.value.some(h => h.quizId === quizId);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Expose methods for parent component
defineExpose({
  play: () => videoRef.value?.play(),
  pause: () => videoRef.value?.pause(),
  currentTime: () => videoRef.value?.currentTime || 0,
  duration: () => duration.value,
  seekTo: (time: number) => {
    if (videoRef.value) {
      videoRef.value.currentTime = time;
    }
  },
});

// Set up quiz handlers
videoQuiz.onQuizTrigger.value = (quiz: VideoQuiz) => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
  emit('quiz-trigger', quiz);
};

// Load quizzes
watch(() => props.quizzes, (newQuizzes) => {
  if (newQuizzes && newQuizzes.length > 0) {
    videoQuiz.loadQuizzes(newQuizzes);
  }
}, { immediate: true });

// Cleanup
onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
.interactive-video-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.interactive-video-container video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Fullscreen support - container becomes fullscreen element */
.interactive-video-container:fullscreen {
  background: black;
  width: 100vw;
  height: 100vh;
}

.interactive-video-container:-webkit-full-screen {
  background: black;
  width: 100vw;
  height: 100vh;
}

.interactive-video-container:-moz-full-screen {
  background: black;
  width: 100vw;
  height: 100vh;
}

.interactive-video-container:-ms-fullscreen {
  background: black;
  width: 100vw;
  height: 100vh;
}

/* Quiz overlay transitions */
.quiz-overlay-enter-active,
.quiz-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.quiz-overlay-enter-from,
.quiz-overlay-leave-to {
  opacity: 0;
}
</style>
