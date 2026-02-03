<script setup lang="ts">
import type { VideoInteraction } from '~/types/interactive-video.interface'

interface Props {
  quiz: VideoInteraction
  isOpen: boolean
  isFullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFullscreen: false
})

const emit = defineEmits<{
  submit: [answer: string, isCorrect: boolean]
  continue: [isCorrect: boolean]
  close: []
}>()

type QuizOption = string | { id?: string; label?: string }

const selectedAnswer = ref<string | null>(null)
const showFeedback = ref(false)
const feedbackMessage = ref('')
const isCorrect = ref(false)

const handleSelectAnswer = (answerId: string) => {
  selectedAnswer.value = answerId
}

const normalizeAnswer = (value: unknown) => {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]\)\s*|^[a-z]:\s*/i, '')
}

const getOptionLabel = (option: QuizOption): string => {
  if (typeof option === 'string') return option
  return option.label ?? option.id ?? ''
}

const getOptionValue = (option: QuizOption): string => {
  if (typeof option === 'string') return option
  return option.id ?? option.label ?? ''
}

const getOptionLabelById = (optionId: string, options: ReadonlyArray<QuizOption>): string | null => {
  const matched = options.find((opt) => typeof opt !== 'string' && opt.id === optionId)
  if (matched && typeof matched !== 'string') {
    return matched.label ?? matched.id ?? null
  }

  const indexMatch = optionId.match(/^option-(\d+)/i)
  if (indexMatch) {
    const index = Number(indexMatch[1]) - 1
    const option = options[index]
    return option ? getOptionLabel(option) : null
  }

  return null
}

const isAnswerCorrect = (selected: string, quiz: VideoInteraction): boolean => {
  const correctAnswer = quiz.correctAnswer ?? ''
  if (!correctAnswer) return false

  if (selected === correctAnswer) return true

  const options = (quiz.options ?? []) as ReadonlyArray<QuizOption>
  const selectedOption = options.find((opt) => getOptionValue(opt) === selected)
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : selected
  const correctLabel = getOptionLabelById(correctAnswer, options)

  if (correctLabel && normalizeAnswer(selectedLabel) === normalizeAnswer(correctLabel)) {
    return true
  }

  return (
    normalizeAnswer(selected) === normalizeAnswer(correctAnswer) ||
    normalizeAnswer(selectedLabel) === normalizeAnswer(correctAnswer)
  )
}

const handleSubmit = () => {
  if (!selectedAnswer.value) return

  // Check if answer is correct
  isCorrect.value = isAnswerCorrect(selectedAnswer.value, props.quiz)

  // Set feedback message
  feedbackMessage.value = isCorrect.value
    ? (props.quiz.feedback?.correct || 'Correct!')
    : (props.quiz.feedback?.incorrect || 'Incorrect. Try again!')

  // Show feedback
  showFeedback.value = true

  // Emit submit event with correctness
  emit('submit', selectedAnswer.value, isCorrect.value)
}

const handleContinue = () => {
  // Store correctness before resetting
  const wasCorrect = isCorrect.value
  console.log('QuizModal handleContinue - wasCorrect:', wasCorrect)

  // Reset UI state
  showFeedback.value = false
  selectedAnswer.value = null
  feedbackMessage.value = ''
  isCorrect.value = false

  // Emit continue event with correctness so parent can handle video playback
  emit('continue', wasCorrect)

  // Close the modal
  handleClose()
}

const handleClose = () => {
  selectedAnswer.value = null
  showFeedback.value = false
  feedbackMessage.value = ''
  isCorrect.value = false
  emit('close')
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedAnswer.value = null
    showFeedback.value = false
    feedbackMessage.value = ''
    isCorrect.value = false
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      :class="[
        'flex flex-col md:flex-row items-stretch',
        isFullscreen ? 'fixed z-[9999]' : 'absolute z-50'
      ]"
      :style="isFullscreen 
        ? 'width: 100vw; height: 100vh; top: 0; left: 0; display: flex; align-items: center; justify-content: center;' 
        : 'top: 0; left: 0; right: 0; bottom: 88px;'"
    >
      <!-- Fullscreen: Constrain to video aspect ratio container (16:9) -->
      <div
        v-if="isFullscreen"
        class="flex flex-col md:flex-row items-stretch"
        style="width: min(calc(100vh * 16 / 9), 100vw); height: min(calc(100vw * 9 / 16), calc(100vh - 80px)); max-width: 100vw; max-height: calc(100vh - 80px);"
      >
        <!-- Left side - Video area (hidden on mobile, visible on desktop) -->
        <div class="hidden md:flex flex-1 relative pointer-events-none" style="background: transparent;">
          <!-- Video continues playing here and is visible through this transparent section -->
        </div>

        <!-- Quiz panel - Full width on mobile, fixed width on desktop -->
        <div
          class="bg-[#0a7ac8]/95 backdrop-blur-md w-full md:w-[500px] lg:w-[600px] xl:w-[650px] flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-question"
          style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1);"
        >
          <!-- Question Header -->
          <div class="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
            <h2 id="quiz-question" class="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
              {{ quiz.question }}
            </h2>
          </div>

          <!-- Feedback Message (shown after submission) -->
          <div v-if="showFeedback" class="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div class="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center" role="status" aria-live="polite">
                {{ feedbackMessage }}
              </p>
            </div>
          </div>

          <!-- Options (hidden after submission) -->
          <div v-else class="flex-1 px-4 sm:px-6 md:px-8 space-y-2 sm:space-y-3 overflow-y-auto pb-3 sm:pb-4" role="radiogroup" aria-labelledby="quiz-question">
            <button
              v-for="(option, index) in quiz.options"
              :key="getOptionValue(option) || index"
              :class="[
                'w-full text-left bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 transition-all duration-200',
                'hover:shadow-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50',
                selectedAnswer === option
                  ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a7ac8]/50 shadow-lg bg-white'
                  : '',
              ]"
              :aria-label="`Option ${String.fromCharCode(65 + index)}: ${getOptionLabel(option).replace(/^[A-Z]\)\s*/, '')}`"
              :aria-pressed="selectedAnswer === getOptionValue(option)"
              role="radio"
              :tabindex="0"
              @click="handleSelectAnswer(getOptionValue(option))"
              @keydown.enter="handleSelectAnswer(getOptionValue(option))"
              @keydown.space.prevent="handleSelectAnswer(getOptionValue(option))"
            >
              <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
                <!-- Letter indicator (A, B, C, D) - Black text with colon -->
                <span class="flex-shrink-0 text-base sm:text-lg md:text-xl font-semibold text-black">
                  {{ String.fromCharCode(65 + index) }}:
                </span>
                
                <!-- Option text -->
                <span class="text-base sm:text-lg md:text-xl text-black flex-1 font-normal leading-tight sm:leading-normal">{{ getOptionLabel(option) }}</span>
                
                <!-- Radio button - Gray circle on right -->
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center',
                      selectedAnswer === getOptionValue(option)
                        ? 'border-gray-700 bg-gray-700'
                        : 'border-gray-400 bg-white'
                    ]"
                  >
                    <div
                      v-if="selectedAnswer === getOptionValue(option)"
                      class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <!-- Footer with Submit/Continue button -->
          <div class="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
            <button
              v-if="!showFeedback"
              :disabled="!selectedAnswer"
              :class="[
                'w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50',
                selectedAnswer
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              ]"
              aria-label="Submit your answer"
              @click="handleSubmit"
            >
              Submit
            </button>
            <button
              v-else
              class="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50"
              aria-label="Continue watching video"
              @click="handleContinue"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <!-- Non-fullscreen: Original layout -->
      <template v-else>
        <!-- Left side - Video area (hidden on mobile, visible on desktop) -->
        <div class="hidden md:flex flex-1 relative pointer-events-none" style="background: transparent;">
          <!-- Video continues playing here and is visible through this transparent section -->
        </div>

        <!-- Quiz panel - Full width on mobile, fixed width on desktop -->
        <div
          class="bg-[#0a7ac8]/95 backdrop-blur-md w-full md:w-[500px] lg:w-[600px] xl:w-[650px] flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-question"
          style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1);"
        >
          <!-- Question Header -->
          <div class="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
            <h2 id="quiz-question" class="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
              {{ quiz.question }}
            </h2>
          </div>

          <!-- Feedback Message (shown after submission) -->
          <div v-if="showFeedback" class="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div class="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center" role="status" aria-live="polite">
                {{ feedbackMessage }}
              </p>
            </div>
          </div>

          <!-- Options (hidden after submission) -->
          <div v-else class="flex-1 px-4 sm:px-6 md:px-8 space-y-2 sm:space-y-3 overflow-y-auto pb-3 sm:pb-4" role="radiogroup" aria-labelledby="quiz-question">
            <button
              v-for="(option, index) in quiz.options"
              :key="option"
              :class="[
                'w-full text-left bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 transition-all duration-200',
                'hover:shadow-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50',
                selectedAnswer === option
                  ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a7ac8]/50 shadow-lg bg-white'
                  : '',
              ]"
              :aria-label="`Option ${String.fromCharCode(65 + index)}: ${option.replace(/^[A-Z]\)\s*/, '')}`"
              :aria-pressed="selectedAnswer === option"
              role="radio"
              :tabindex="0"
              @click="handleSelectAnswer(option)"
              @keydown.enter="handleSelectAnswer(option)"
              @keydown.space.prevent="handleSelectAnswer(option)"
            >
              <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
                <!-- Letter indicator (A, B, C, D) - Black text with colon -->
                <span class="flex-shrink-0 text-base sm:text-lg md:text-xl font-semibold text-black">
                  {{ String.fromCharCode(65 + index) }}:
                </span>
                
                <!-- Option text -->
                <span class="text-base sm:text-lg md:text-xl text-black flex-1 font-normal leading-tight sm:leading-normal">{{ option }}</span>
                
                <!-- Radio button - Gray circle on right -->
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center',
                      selectedAnswer === option
                        ? 'border-gray-700 bg-gray-700'
                        : 'border-gray-400 bg-white'
                    ]"
                  >
                    <div
                      v-if="selectedAnswer === option"
                      class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <!-- Footer with Submit/Continue button -->
          <div class="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
            <button
              v-if="!showFeedback"
              :disabled="!selectedAnswer"
              :class="[
                'w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50',
                selectedAnswer
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              ]"
              aria-label="Submit your answer"
              @click="handleSubmit"
            >
              Submit
            </button>
            <button
              v-else
              class="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50"
              aria-label="Continue watching video"
              @click="handleContinue"
            >
              Continue
            </button>
          </div>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.3s ease-out;
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  /* Mobile: slide up from bottom, Desktop: slide in from right */
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-enter-from > div:last-child {
    transform: translateX(100%);
  }
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to > div:last-child {
  /* Mobile: slide down to bottom, Desktop: slide out to right */
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-leave-to > div:last-child {
    transform: translateX(100%);
  }
}
</style>
