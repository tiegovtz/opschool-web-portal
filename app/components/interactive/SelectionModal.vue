<script setup lang="ts">
import type { VideoInteraction } from '~/types/interactive-video.interface'

interface Props {
  interaction: VideoInteraction
  isOpen: boolean
  isFullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFullscreen: false
})

const emit = defineEmits<{
  submit: [answers: Record<string, string>]
  continue: [isCorrect: boolean]
  close: []
}>()

const selectedLabels = ref<Record<string, string>>({})
const selectedItemId = ref<string | null>(null)
const showFeedback = ref(false)
const feedbackMessage = ref('')
const isCorrect = ref(false)

const availableLabels = computed(() => {
  // Return labels that haven't been selected yet
  const usedLabels = Object.values(selectedLabels.value)
  return props.interaction.labels?.filter(label => !usedLabels.includes(label))
})

const isComplete = computed(() => {
  // Check if all items have labels
  return props.interaction.items?.every(item => selectedLabels.value[item.id])
})

const handleItemClick = (itemId: string) => {
  // Toggle selection - if already selected, deselect; otherwise select
  if (selectedItemId.value === itemId) {
    selectedItemId.value = null
  } else {
    selectedItemId.value = itemId
  }
}

const handleLabelSelect = (label: string) => {
  if (!selectedItemId.value) return

  // Remove label from previous item if it exists
  Object.keys(selectedLabels.value).forEach(key => {
    if (selectedLabels.value[key] === label) {
      delete selectedLabels.value[key]
    }
  })

  // Assign label to selected item
  selectedLabels.value[selectedItemId.value] = label

  // Clear selection and close menu
  selectedItemId.value = null
}

const handleClickOutside = (event: MouseEvent) => {
  // Close selection menu if clicking outside
  const target = event.target as HTMLElement
  if (!target.closest('.item-container') && !target.closest('.selection-menu')) {
    selectedItemId.value = null
  }
}

const handleSubmit = () => {
  if (!isComplete.value) return

  // Check if all answers are correct
  const allCorrect = props.interaction.items?.every(item => {
    return selectedLabels.value[item.id] === item.correctLabel
  })

  isCorrect.value = allCorrect as boolean

  // Set feedback message
  feedbackMessage.value = allCorrect
    ? (props.interaction.feedback?.correct || 'Correct! All labels are matched correctly.')
    : (props.interaction.feedback?.incorrect || 'Some labels are incorrect. Try again!')

  // Show feedback
  showFeedback.value = true

  // Emit submit event with answers
  emit('submit', { ...selectedLabels.value })
}

const handleContinue = () => {
  // Store correctness before resetting
  const wasCorrect = isCorrect.value

  // Reset UI state
  showFeedback.value = false
  selectedLabels.value = {}
  feedbackMessage.value = ''
  isCorrect.value = false

  // Emit continue event with correctness so parent can handle video playback
  emit('continue', wasCorrect)

  // Close the modal
  handleClose()
}

const handleClose = () => {
  selectedLabels.value = {}
  showFeedback.value = false
  feedbackMessage.value = ''
  isCorrect.value = false
  selectedItemId.value = null
  emit('close')
}

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedLabels.value = {}
    showFeedback.value = false
    feedbackMessage.value = ''
    isCorrect.value = false
    selectedItemId.value = null
  }
})

// Handle click outside to close selection menu
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

        <!-- Selection panel -->
        <div
          class="bg-[#0a7ac8]/95 backdrop-blur-md w-full md:w-[600px] lg:w-[700px] xl:w-[750px] flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1);"
        >
          <!-- Task Header -->
          <div class="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
            <h2 class="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
              {{ interaction.task }}
            </h2>
          </div>

          <!-- Feedback Message (shown after submission) -->
          <div v-if="showFeedback" class="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div class="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center">
                {{ feedbackMessage }}
              </p>
            </div>
          </div>

          <!-- Selection Content (hidden after submission) -->
          <div v-else class="flex-1 px-4 sm:px-6 md:px-8 overflow-y-auto pb-3 sm:pb-4">
            <!-- Images Grid -->
            <div class="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div
                v-for="item in interaction.items"
                :key="item.id"
                class="relative item-container"
              >
                <div
                  :class="[
                    'relative w-full aspect-square bg-white/10 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                    selectedItemId === item.id 
                      ? 'border-white/90 bg-white/30 shadow-lg ring-4 ring-white/50' 
                      : selectedLabels[item.id] 
                        ? 'border-white/60 bg-white/20 border-solid' 
                        : 'border-white/30 border-dashed hover:border-white/50'
                  ]"
                  @click="handleItemClick(item.id)"
                  role="button"
                  :aria-label="`Select label for ${item.imageAlt || item.id}`"
                  tabindex="0"
                  @keydown.enter="handleItemClick(item.id)"
                  @keydown.space.prevent="handleItemClick(item.id)"
                >
                  <!-- Image -->
                  <div class="absolute inset-0 p-2 flex items-center justify-center">
                    <img
                      :src="item.imageUrl"
                      :alt="item.imageAlt"
                      class="max-w-full max-h-full object-contain"
                      v-if="item.imageUrl"
                    />
                    <div v-else class="text-white/50 text-sm text-center p-4">
                      {{ item.imageAlt }}
                    </div>
                  </div>
                  
                  <!-- Selected Label -->
                  <div
                    v-if="selectedLabels[item.id]"
                    class="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded px-3 py-2 text-center"
                  >
                    <span class="text-base sm:text-lg font-semibold text-gray-900">
                      {{ selectedLabels[item.id] }}
                    </span>
                  </div>

                  <!-- Selection Menu Dropdown -->
                  <Transition name="dropdown">
                    <div
                      v-if="selectedItemId === item.id"
                      class="selection-menu absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 overflow-hidden"
                      @click.stop
                      role="menu"
                      aria-label="Label selection menu"
                    >
                      <div class="p-2 max-h-48 overflow-y-auto">
                        <p class="text-gray-700 text-xs sm:text-sm font-medium px-2 py-1 mb-1">
                          Select a label:
                        </p>
                        <button
                          v-for="(label, index) in availableLabels"
                          :key="index"
                          :class="[
                            'w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer min-h-[44px]',
                            'hover:bg-[#0a7ac8] hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0a7ac8] focus:ring-offset-2',
                            'text-base sm:text-lg font-semibold text-gray-900',
                            'border border-transparent hover:border-white/30'
                          ]"
                          @click="handleLabelSelect(label)"
                          :aria-label="`Select ${label}`"
                          role="menuitem"
                        >
                          {{ label }}
                        </button>
                        <button
                          v-if="availableLabels?.length === 0"
                          class="w-full text-left px-4 py-3 rounded-lg text-gray-500 text-sm cursor-not-allowed min-h-[44px]"
                          disabled
                          aria-disabled="true"
                        >
                          No labels available
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div class="mt-4">
              <p class="text-white text-sm sm:text-base font-medium">
                Click on each image to select a label
              </p>
            </div>
          </div>

          <!-- Footer with Submit/Continue button -->
          <div class="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
            <button
              v-if="!showFeedback"
              :disabled="!isComplete"
              :class="[
                'w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border',
                isComplete
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              ]"
              @click="handleSubmit"
            >
              Submit
            </button>
            <button
              v-else
              class="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95"
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

        <!-- Selection panel -->
        <div
          class="bg-[#0a7ac8]/95 backdrop-blur-md w-full md:w-[600px] lg:w-[700px] xl:w-[750px] flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1);"
        >
          <!-- Task Header -->
          <div class="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
            <h2 class="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
              {{ interaction.task }}
            </h2>
          </div>

          <!-- Feedback Message (shown after submission) -->
          <div v-if="showFeedback" class="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div class="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center">
                {{ feedbackMessage }}
              </p>
            </div>
          </div>

          <!-- Selection Content (hidden after submission) -->
          <div v-else class="flex-1 px-4 sm:px-6 md:px-8 overflow-y-auto pb-3 sm:pb-4">
            <!-- Images Grid -->
            <div class="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div
                v-for="item in interaction.items"
                :key="item.id"
                class="relative item-container"
              >
                <div
                  :class="[
                    'relative w-full aspect-square bg-white/10 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                    selectedItemId === item.id 
                      ? 'border-white/90 bg-white/30 shadow-lg ring-4 ring-white/50' 
                      : selectedLabels[item.id] 
                        ? 'border-white/60 bg-white/20 border-solid' 
                        : 'border-white/30 border-dashed hover:border-white/50'
                  ]"
                  @click="handleItemClick(item.id)"
                  role="button"
                  :aria-label="`Select label for ${item.imageAlt || item.id}`"
                  tabindex="0"
                  @keydown.enter="handleItemClick(item.id)"
                  @keydown.space.prevent="handleItemClick(item.id)"
                >
                  <!-- Image -->
                  <div class="absolute inset-0 p-2 flex items-center justify-center">
                    <img
                      :src="item.imageUrl"
                      :alt="item.imageAlt"
                      class="max-w-full max-h-full object-contain"
                      v-if="item.imageUrl"
                    />
                    <div v-else class="text-white/50 text-sm text-center p-4">
                      {{ item.imageAlt }}
                    </div>
                  </div>
                  
                  <!-- Selected Label -->
                  <div
                    v-if="selectedLabels[item.id]"
                    class="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded px-3 py-2 text-center"
                  >
                    <span class="text-base sm:text-lg font-semibold text-gray-900">
                      {{ selectedLabels[item.id] }}
                    </span>
                  </div>

                  <!-- Selection Menu Dropdown -->
                  <Transition name="dropdown">
                    <div
                      v-if="selectedItemId === item.id"
                      class="selection-menu absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 overflow-hidden"
                      @click.stop
                      role="menu"
                      aria-label="Label selection menu"
                    >
                      <div class="p-2 max-h-48 overflow-y-auto">
                        <p class="text-gray-700 text-xs sm:text-sm font-medium px-2 py-1 mb-1">
                          Select a label:
                        </p>
                        <button
                          v-for="(label, index) in availableLabels"
                          :key="index"
                          :class="[
                            'w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer min-h-[44px]',
                            'hover:bg-[#0a7ac8] hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0a7ac8] focus:ring-offset-2',
                            'text-base sm:text-lg font-semibold text-gray-900',
                            'border border-transparent hover:border-white/30'
                          ]"
                          @click="handleLabelSelect(label)"
                          :aria-label="`Select ${label}`"
                          role="menuitem"
                        >
                          {{ label }}
                        </button>
                        <button
                          v-if="availableLabels?.length === 0"
                          class="w-full text-left px-4 py-3 rounded-lg text-gray-500 text-sm cursor-not-allowed min-h-[44px]"
                          disabled
                          aria-disabled="true"
                        >
                          No labels available
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div class="mt-4">
              <p class="text-white text-sm sm:text-base font-medium">
                Click on each image to select a label
              </p>
            </div>
          </div>

          <!-- Footer with Submit/Continue button -->
          <div class="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
            <button
              v-if="!showFeedback"
              :disabled="!isComplete"
              :class="[
                'w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border',
                isComplete
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              ]"
              @click="handleSubmit"
            >
              Submit
            </button>
            <button
              v-else
              class="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95"
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
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-leave-to > div:last-child {
    transform: translateX(100%);
  }
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: all 0.2s ease-out;
}

.dropdown-leave-active {
  transition: all 0.15s ease-in;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Ensure dropdown appears above other elements */
.selection-menu {
  min-width: 200px;
}

/* Mobile: Adjust dropdown positioning for better visibility */
@media (max-width: 640px) {
  .selection-menu {
    position: fixed;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    width: calc(100vw - 2rem);
    max-width: 300px;
    top: auto !important;
    bottom: 2rem;
  }
  
  /* Ensure touch targets are large enough */
  .item-container {
    min-height: 44px;
  }
}
</style>

