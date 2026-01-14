<template>
  <div v-if="showPathIndicator" class="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        Learning Path
      </h3>
      <button
        @click="toggleExpanded"
        @keydown.enter.prevent="toggleExpanded"
        class="p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-oceanBlue"
        aria-label="Toggle path details"
        tabindex="0"
      >
        <Icon 
          :name="isExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" 
          class="w-5 h-5 text-gray-600"
        />
      </button>
    </div>

    <!-- Compact Path View -->
    <div v-if="!isExpanded" class="flex items-center gap-2">
      <div class="flex-1 flex items-center gap-1 overflow-x-auto pb-2">
        <div
          v-for="(segment, index) in pathSegments"
          :key="index"
          class="flex items-center gap-1 flex-shrink-0"
        >
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              segment.completed
                ? 'bg-green-500 text-white'
                : segment.active
                ? 'bg-oceanBlue text-white ring-2 ring-oceanBlue ring-offset-2'
                : 'bg-gray-200 text-gray-600'
            ]"
            :title="segment.label"
          >
            {{ index + 1 }}
          </div>
          <Icon
            v-if="index < pathSegments.length - 1"
            name="heroicons:arrow-right"
            class="w-4 h-4 text-gray-400 flex-shrink-0"
          />
        </div>
      </div>
      <div class="text-xs text-gray-500">
        {{ currentProgress }}% complete
      </div>
    </div>

    <!-- Expanded Path View -->
    <div v-else class="space-y-3">
      <!-- Path Visualization -->
      <div class="space-y-2">
        <div
          v-for="(segment, index) in pathSegments"
          :key="index"
          class="flex items-center gap-3 p-2 rounded-lg transition-colors"
          :class="segment.active ? 'bg-oceanBlue/10 border-2 border-oceanBlue' : 'hover:bg-gray-50'"
        >
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
              segment.completed
                ? 'bg-green-500 text-white'
                : segment.active
                ? 'bg-oceanBlue text-white'
                : 'bg-gray-200 text-gray-600'
            ]"
          >
            {{ index + 1 }}
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">{{ segment.label }}</p>
            <p v-if="segment.description" class="text-xs text-gray-500 mt-1">
              {{ segment.description }}
            </p>
            <p v-if="segment.timestamp !== undefined" class="text-xs text-gray-400 mt-1">
              {{ formatTime(segment.timestamp) }}
            </p>
          </div>
          <div v-if="segment.completed" class="flex-shrink-0">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          </div>
          <div v-else-if="segment.active" class="flex-shrink-0">
            <div class="w-2 h-2 bg-oceanBlue rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Alternative Paths (if any) -->
      <div v-if="alternativePaths && alternativePaths.length > 0" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Alternative Paths
        </p>
        <div class="space-y-1">
          <button
            v-for="(path, index) in alternativePaths"
            :key="index"
            @click="$emit('switch-path', path)"
            class="w-full text-left px-3 py-2 text-xs text-gray-600 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-oceanBlue"
            tabindex="0"
          >
            Path {{ index + 1 }}: {{ path.join(' → ') }}
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500">Quizzes Completed</p>
          <p class="text-lg font-semibold text-gray-800">{{ completedQuizzes }}/{{ totalQuizzes }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Current Score</p>
          <p class="text-lg font-semibold text-oceanBlue">{{ currentScore }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { VideoQuiz } from '~/types/video-quiz.interface';

interface PathSegment {
  id: string;
  label: string;
  description?: string;
  timestamp?: number;
  completed: boolean;
  active: boolean;
}

interface Props {
  currentPath?: string[];
  quizzes?: VideoQuiz[];
  completedQuizzes?: number;
  currentScore?: number;
  currentTimestamp?: number;
  showPathIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: () => [],
  quizzes: () => [],
  completedQuizzes: 0,
  currentScore: 0,
  currentTimestamp: 0,
  showPathIndicator: true,
});

const emit = defineEmits<{
  'switch-path': [path: string[]];
}>();

const isExpanded = ref(false);

// Computed
const totalQuizzes = computed(() => props.quizzes?.length || 0);

const pathSegments = computed<PathSegment[]>(() => {
  if (!props.quizzes || props.quizzes.length === 0) {
    return [];
  }

  // Create segments based on quizzes
  return props.quizzes.map((quiz, index) => {
    const segmentId = `segment_${index}_${quiz.id}`;
    const isCompleted = props.currentPath.includes(segmentId) || 
                       (props.completedQuizzes !== undefined && index < props.completedQuizzes);
    const isActive = !isCompleted && 
                    (index === props.completedQuizzes || 
                     (props.currentTimestamp !== undefined && 
                      Math.abs(props.currentTimestamp - quiz.timestamp) < 5));

    return {
      id: segmentId,
      label: `Quiz ${index + 1}${quiz.metadata?.topic ? `: ${quiz.metadata.topic}` : ''}`,
      description: quiz.question.substring(0, 50) + (quiz.question.length > 50 ? '...' : ''),
      timestamp: quiz.timestamp,
      completed: isCompleted,
      active: isActive,
    };
  });
});

const currentProgress = computed(() => {
  if (totalQuizzes.value === 0) return 0;
  return Math.floor((props.completedQuizzes / totalQuizzes.value) * 100);
});

const alternativePaths = computed<string[][]>(() => {
  // Generate alternative paths based on quiz branching options
  // This is a simplified version - can be enhanced with actual branch data
  if (!props.quizzes || props.quizzes.length === 0) return [];

  const paths: string[][] = [];
  props.quizzes.forEach((quiz, index) => {
    if (quiz.options && quiz.options.length > 1) {
      quiz.options.forEach((option, optIndex) => {
        if (optIndex > 0) { // Skip first option as it's likely the default
          paths.push([`Path via ${option.text}`]);
        }
      });
    }
  });

  return paths.slice(0, 3); // Limit to 3 alternative paths
});

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>

