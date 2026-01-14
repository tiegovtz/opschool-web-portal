<template>
  <Transition name="quiz-overlay">
    <div
      v-if="quiz"
      class="absolute inset-0 z-50 flex items-center justify-center glass-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-question"
      @keydown.esc="handleClose"
    >
      <div
        class="relative w-full max-w-2xl mx-4 glass-container rounded-3xl overflow-hidden"
        @keydown.esc="handleClose"
      >
        <!-- Header -->
        <div class="glass-header px-6 py-5 text-white">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/30">
              <Icon name="heroicons:question-mark-circle" class="w-6 h-6" />
            </div>
            <h2 id="quiz-question" class="text-xl md:text-2xl font-bold flex-1">
              {{ quiz.question }}
            </h2>
            <button
              v-if="!required || answerSubmitted"
              @click="handleClose"
              @keydown.enter.prevent="handleClose"
              class="flex-shrink-0 p-2 rounded-full hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close quiz"
              tabindex="0"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
          <!-- Time limit indicator -->
          <div v-if="timeLimit && !answerSubmitted" class="mt-3" :class="timeRemaining < 10 ? 'time-warning' : ''">
            <div class="flex items-center gap-2 text-sm">
              <Icon name="heroicons:clock" class="w-4 h-4" />
              <span>Time remaining: {{ formatTime(timeRemaining) }}</span>
            </div>
            <div class="mt-2 h-2 glass-progress-track rounded-full overflow-hidden">
              <div
                class="h-full glass-progress-fill transition-all duration-1000"
                :style="{ width: `${(timeRemaining / timeLimit) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Quiz Content -->
        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <!-- Learning Objective -->
          <div v-if="quiz.metadata?.learningObjective" class="mb-4">
            <div class="text-sm text-gray-400 italic glass-badge px-3 py-1.5 rounded-full inline-block">
              Learning Objective: {{ quiz.metadata.learningObjective }}
            </div>
          </div>

          <!-- Answer Options (Multiple Choice) -->
          <div v-if="quiz.type === 'multiple_choice' && quiz.options" class="space-y-3">
            <button
              v-for="(option, index) in quiz.options"
              :key="option.id"
              @click="handleOptionSelect(option)"
              @keydown.enter.prevent="handleOptionSelect(option)"
              :disabled="answerSubmitted"
              :class="[
                'glass-option-card w-full p-4 text-left rounded-xl transition-all duration-300 transform',
                selectedOptionId === option.id
                  ? answerSubmitted
                    ? option.isCorrect
                      ? 'glass-feedback-correct'
                      : 'glass-feedback-incorrect'
                    : 'glass-option-selected scale-[1.02]'
                  : 'glass-option-unselected hover:scale-[1.02]',
                answerSubmitted && option.isCorrect
                  ? 'ring-2 ring-green-400/50'
                  : '',
                answerSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'
              ]"
              tabindex="0"
            >
              <div class="flex items-start gap-3">
                <div
                  :class="[
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold transition-all duration-300',
                    selectedOptionId === option.id
                      ? answerSubmitted
                        ? option.isCorrect
                          ? 'glass-badge-correct'
                          : 'glass-badge-incorrect'
                        : 'glass-badge-selected text-white'
                      : 'glass-badge-unselected'
                  ]"
                >
                  {{ String.fromCharCode(65 + index) }}
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ option.text }}</p>
                  <!-- Show explanation after answer submitted -->
                  <p
                    v-if="answerSubmitted && option.isCorrect && option.explanation"
                    class="mt-2 text-sm text-green-700 font-medium"
                  >
                    {{ option.explanation }}
                  </p>
                  <p
                    v-else-if="answerSubmitted && selectedOptionId === option.id && !option.isCorrect && option.explanation"
                    class="mt-2 text-sm text-red-700 font-medium"
                  >
                    {{ option.explanation }}
                  </p>
                </div>
                <!-- Checkmark/X mark -->
                <div v-if="answerSubmitted">
                  <Icon
                    v-if="option.isCorrect"
                    name="heroicons:check-circle"
                    class="w-6 h-6 text-green-500"
                  />
                  <Icon
                    v-else-if="selectedOptionId === option.id && !option.isCorrect"
                    name="heroicons:x-circle"
                    class="w-6 h-6 text-red-500"
                  />
                </div>
              </div>
            </button>
          </div>

          <!-- True/False -->
          <div v-else-if="quiz.type === 'true_false'" class="space-y-3">
            <button
              v-for="(value, label) in { true: 'True', false: 'False' }"
              :key="value"
              @click="handleTrueFalseSelect(value === 'True')"
              @keydown.enter.prevent="handleTrueFalseSelect(value === 'True')"
              :disabled="answerSubmitted"
              :class="[
                'glass-option-card w-full p-4 text-center rounded-xl transition-all duration-300 transform',
                selectedAnswer === (value === 'True')
                  ? answerSubmitted
                    ? (value === 'True' ? quiz.correctAnswer === true : quiz.correctAnswer === false)
                      ? 'glass-feedback-correct'
                      : 'glass-feedback-incorrect'
                    : 'glass-option-selected scale-[1.02]'
                  : 'glass-option-unselected hover:scale-[1.02]',
                answerSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'
              ]"
              tabindex="0"
            >
              <span class="text-lg font-semibold text-gray-800">{{ label }}</span>
            </button>
          </div>

          <!-- Short Answer -->
          <div v-else-if="quiz.type === 'short_answer'" class="space-y-3">
            <textarea
              v-model="shortAnswer"
              :disabled="answerSubmitted"
              placeholder="Type your answer here..."
              rows="4"
              class="glass-input w-full p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
              tabindex="0"
            />
            <button
              @click="handleShortAnswerSubmit"
              @keydown.enter.prevent="handleShortAnswerSubmit"
              :disabled="answerSubmitted || !shortAnswer.trim()"
              class="glass-button w-full px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              tabindex="0"
            >
              Submit Answer
            </button>
          </div>

          <!-- Feedback after submission -->
          <Transition name="fade-in">
            <div v-if="answerSubmitted" class="mt-6 p-4 rounded-xl" :class="isCorrect ? 'glass-feedback-correct' : 'glass-feedback-incorrect'">
            <div class="flex items-start gap-3">
              <Icon
                :name="isCorrect ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                :class="isCorrect ? 'w-6 h-6 text-green-500' : 'w-6 h-6 text-red-500'"
              />
              <div class="flex-1">
                <p :class="isCorrect ? 'text-green-800 font-semibold' : 'text-red-800 font-semibold'">
                  {{ isCorrect ? 'Correct!' : 'Incorrect' }}
                </p>
                <p v-if="quiz.explanation" class="mt-2 text-sm" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                  {{ quiz.explanation }}
                </p>
                <p class="mt-2 text-sm font-medium" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                  Points: {{ isCorrect ? quiz.points : 0 }} / {{ quiz.points }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="glass-footer px-6 py-4 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <span v-if="quiz.metadata?.difficulty" class="capitalize">
              Difficulty: {{ quiz.metadata.difficulty }}
            </span>
          </div>
          <button
            v-if="answerSubmitted"
            @click="handleContinue"
            @keydown.enter.prevent="handleContinue"
            class="glass-button px-6 py-2.5 text-white rounded-xl font-semibold transition-all duration-300"
            tabindex="0"
          >
            Continue
          </button>
          <button
            v-else-if="required"
            disabled
            class="px-6 py-2.5 glass-button-disabled text-gray-400 rounded-xl font-semibold cursor-not-allowed"
            tabindex="0"
          >
            Required Question
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { VideoQuiz, QuizOption } from '~/types/video-quiz.interface';

interface Props {
  quiz: VideoQuiz | null;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
});

const emit = defineEmits<{
  submit: [answer: any];
  close: [];
  continue: [];
}>();

const selectedOptionId = ref<string | null>(null);
const selectedAnswer = ref<boolean | null>(null);
const shortAnswer = ref<string>('');
const answerSubmitted = ref(false);
const isCorrect = ref(false);
const timeRemaining = ref(0);
let timeLimitInterval: NodeJS.Timeout | null = null;

// Computed
const timeLimit = computed(() => props.quiz?.timeLimit);
const required = computed(() => props.required || props.quiz?.required || false);

// Methods
const handleOptionSelect = (option: QuizOption) => {
  if (answerSubmitted.value) return;
  
  selectedOptionId.value = option.id;
  
  // Auto-submit if immediate feedback desired
  // For now, require explicit submit button
  // Can be changed based on UX preference
};

const handleTrueFalseSelect = (value: boolean) => {
  if (answerSubmitted.value) return;
  
  selectedAnswer.value = value;
  submitAnswer(value);
};

const handleShortAnswerSubmit = () => {
  if (answerSubmitted.value || !shortAnswer.value.trim()) return;
  submitAnswer(shortAnswer.value.trim());
};

const submitAnswer = (answer: any) => {
  if (answerSubmitted.value) return;

  answerSubmitted.value = true;

  // Determine if answer is correct
  if (props.quiz) {
    if (props.quiz.type === 'multiple_choice' && selectedOptionId.value) {
      const selectedOption = props.quiz.options?.find(opt => opt.id === selectedOptionId.value);
      isCorrect.value = selectedOption?.isCorrect || false;
      answer = selectedOptionId.value;
    } else if (props.quiz.type === 'true_false') {
      isCorrect.value = answer === props.quiz.correctAnswer;
    } else if (props.quiz.type === 'short_answer') {
      const userAnswer = String(answer).toLowerCase().trim();
      const correctAnswer = String(props.quiz.correctAnswer).toLowerCase().trim();
      isCorrect.value = userAnswer === correctAnswer || 
                        userAnswer.includes(correctAnswer) || 
                        correctAnswer.includes(userAnswer);
    }
  }

  emit('submit', answer);
};

const handleContinue = () => {
  emit('continue');
};

const handleClose = () => {
  if (!required.value || answerSubmitted.value) {
    emit('close');
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Time limit countdown
watch(() => props.quiz?.timeLimit, (limit) => {
  if (limit && limit > 0) {
    timeRemaining.value = limit;
    
    if (timeLimitInterval) {
      clearInterval(timeLimitInterval);
    }

    timeLimitInterval = setInterval(() => {
      if (timeRemaining.value > 0 && !answerSubmitted.value) {
        timeRemaining.value--;
      } else {
        if (timeRemaining.value === 0 && !answerSubmitted.value) {
          // Time's up - auto-submit with empty answer or first option
          if (props.quiz?.type === 'multiple_choice' && props.quiz.options && props.quiz.options.length > 0) {
            handleOptionSelect(props.quiz.options[0]);
          } else {
            submitAnswer(null);
          }
        }
        if (timeLimitInterval) {
          clearInterval(timeLimitInterval);
          timeLimitInterval = null;
        }
      }
    }, 1000);
  }
});

watch(() => props.quiz, (newQuiz) => {
  // Reset state when quiz changes
  selectedOptionId.value = null;
  selectedAnswer.value = null;
  shortAnswer.value = '';
  answerSubmitted.value = false;
  isCorrect.value = false;
  
  if (newQuiz?.timeLimit) {
    timeRemaining.value = newQuiz.timeLimit;
  }
}, { immediate: true });

// Cleanup
onUnmounted(() => {
  if (timeLimitInterval) {
    clearInterval(timeLimitInterval);
  }
});

// Focus management for accessibility
onMounted(() => {
  // Focus the dialog when it opens
  const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
  if (dialog) {
    dialog.focus();
  }
});
</script>

<style scoped>
/* Overlay Background */
.glass-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Modal Container */
.glass-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Header */
.glass-header {
  background: linear-gradient(135deg, rgba(10, 122, 200, 0.9), rgba(8, 97, 154, 0.9));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Progress Bar */
.glass-progress-track {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-progress-fill {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.time-warning {
  animation: pulse-warning 1s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Option Cards */
.glass-option-card {
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-option-unselected {
  background: rgba(255, 255, 255, 0.1);
  color: #1f2937;
}

.glass-option-unselected:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(10, 122, 200, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.glass-option-selected {
  background: rgba(10, 122, 200, 0.2);
  border-color: rgba(10, 122, 200, 0.5);
  box-shadow: 0 4px 16px rgba(10, 122, 200, 0.3);
  color: #1f2937;
}

.glass-feedback-correct {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-feedback-incorrect {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Badges */
.glass-badge {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-badge-unselected {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-color: rgba(156, 163, 175, 0.3);
  color: #9ca3af;
}

.glass-badge-selected {
  background: rgba(10, 122, 200, 0.9);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-color: rgba(10, 122, 200, 1);
  box-shadow: 0 2px 8px rgba(10, 122, 200, 0.4);
}

.glass-badge-correct {
  background: rgba(34, 197, 94, 0.9);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-color: rgba(34, 197, 94, 1);
  color: white;
}

.glass-badge-incorrect {
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-color: rgba(239, 68, 68, 1);
  color: white;
}

/* Input Fields */
.glass-input {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: rgba(10, 122, 200, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(10, 122, 200, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.glass-input::placeholder {
  color: rgba(156, 163, 175, 0.7);
}

/* Buttons */
.glass-button {
  background: linear-gradient(135deg, rgba(10, 122, 200, 0.9), rgba(8, 97, 154, 0.9));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(10, 122, 200, 0.3);
}

.glass-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(8, 97, 154, 0.95), rgba(10, 122, 200, 0.95));
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(10, 122, 200, 0.4);
}

.glass-button:active:not(:disabled) {
  transform: translateY(0);
}

.glass-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(10, 122, 200, 0.3), 0 4px 16px rgba(10, 122, 200, 0.3);
}

.glass-button-disabled {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Footer */
.glass-footer {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Transitions */
.quiz-overlay-enter-active,
.quiz-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.quiz-overlay-enter-from,
.quiz-overlay-leave-to {
  opacity: 0;
}

.quiz-overlay-enter-active > div,
.quiz-overlay-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.quiz-overlay-enter-from > div,
.quiz-overlay-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}

.fade-in-enter-active {
  transition: all 0.3s ease;
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-in-leave-active {
  transition: all 0.2s ease;
}

.fade-in-leave-to {
  opacity: 0;
}
</style>

