<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">
            {{ editingInteraction ? 'Edit Interaction' : 'Add New Interaction' }}
          </h2>
          <button
            @click="handleCancel"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <!-- Interaction Type -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Interaction Type *
            </label>
            <select
              v-model="formData.type"
              :disabled="editingInteraction"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select type...</option>
              <option value="quiz">Quiz (Multiple Choice / True/False)</option>
              <option value="selection">Selection (Label Matching)</option>
            </select>
          </div>

          <!-- Time Field -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Time (seconds) - When video is paused at this time, the interaction will appear *
            </label>
            <input
              v-model.number="formData.startTime"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0"
            />
            <p class="mt-1 text-xs text-gray-500">This is the timestamp where the interaction will appear when the video is paused.</p>
          </div>

          <!-- Quiz Form -->
          <div v-if="formData.type === 'quiz'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                v-model="formData.question"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your question here..."
              />
            </div>

            <!-- Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              <div v-for="(option, index) in formData.options" :key="index" class="mb-3 flex items-center gap-3">
                <input
                  v-model="option.label"
                  type="text"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  :placeholder="`Option ${index + 1}`"
                />
                <input
                  type="radio"
                  :value="option.id"
                  v-model="formData.correctAnswer"
                  class="w-5 h-5 text-primary"
                />
                <span class="text-sm text-gray-600">Correct</span>
                <button
                  v-if="formData.options.length > 2"
                  @click="removeOption(index)"
                  class="text-red-600 hover:text-red-800"
                  type="button"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              <button
                @click="addOption"
                type="button"
                class="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                + Add Option
              </button>
            </div>

            <!-- Feedback -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Correct Feedback
                </label>
                <input
                  v-model="formData.feedback.correct"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Great job!"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Incorrect Feedback
                </label>
                <input
                  v-model="formData.feedback.incorrect"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Try again!"
                />
              </div>
            </div>
          </div>

          <!-- Selection Form -->
          <div v-if="formData.type === 'selection'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <textarea
                v-model="formData.task"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Select the correct label for each item..."
              />
            </div>

            <!-- Items -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Items *
              </label>
              <div v-for="(item, index) in formData.items" :key="index" class="mb-3 p-3 border border-gray-200 rounded-lg">
                <div class="grid grid-cols-2 gap-3 mb-2">
                  <input
                    v-model="item.imageUrl"
                    type="text"
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Image URL"
                  />
                  <input
                    v-model="item.imageAlt"
                    type="text"
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Image Alt Text"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-600">Correct Label:</label>
                  <select
                    v-model="item.correctLabel"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    <option value="">Select label...</option>
                    <option v-for="label in formData.labels" :key="label" :value="label">
                      {{ label }}
                    </option>
                  </select>
                  <button
                    @click="removeItem(index)"
                    type="button"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
              <button
                @click="addItem"
                type="button"
                class="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                + Add Item
              </button>
            </div>

            <!-- Labels -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Available Labels *
              </label>
              <div v-for="(label, index) in formData.labels" :key="index" class="mb-2 flex items-center gap-2">
                <input
                  v-model="formData.labels[index]"
                  type="text"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  :placeholder="`Label ${index + 1}`"
                />
                <button
                  @click="removeLabel(index)"
                  type="button"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              <button
                @click="addLabel"
                type="button"
                class="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                + Add Label
              </button>
            </div>

            <!-- Feedback -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Correct Feedback
                </label>
                <input
                  v-model="formData.feedback.correct"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Incorrect Feedback
                </label>
                <input
                  v-model="formData.feedback.incorrect"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            @click="handleCancel"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="!isValid"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ editingInteraction ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Interaction, QuizInteraction, SelectionInteraction } from '~/types/interactive-video.interface'

interface Props {
  isOpen: boolean
  interaction?: Interaction | null
  currentTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  interaction: null,
  currentTime: 0
})

const emit = defineEmits<{
  save: [interaction: Partial<Interaction>]
  cancel: []
}>()

const editingInteraction = computed(() => !!props.interaction)

const formData = ref<any>({
  type: '',
  startTime: props.currentTime || 0,
  question: '',
  options: [
    { id: 'option-1', label: '' },
    { id: 'option-2', label: '' }
  ],
  correctAnswer: '',
  task: '',
  items: [],
  labels: [],
  feedback: {
    correct: '',
    incorrect: ''
  }
})

// Define resetForm before it's used in watch
const resetForm = () => {
  formData.value = {
    type: '',
    startTime: props.currentTime || 0,
    question: '',
    options: [
      { id: 'option-1', label: '' },
      { id: 'option-2', label: '' }
    ],
    correctAnswer: '',
    task: '',
    items: [],
    labels: [],
    feedback: {
      correct: '',
      incorrect: ''
    }
  }
}

watch(() => props.interaction, (interaction) => {
  if (interaction) {
    formData.value = {
      ...interaction,
      startTime: interaction.startTime, // Use the interaction's startTime
      // Don't include endTime in formData since we only use startTime now
      options: (interaction as QuizInteraction).options || formData.value.options,
      items: (interaction as SelectionInteraction).items || formData.value.items,
      labels: (interaction as SelectionInteraction).labels || formData.value.labels,
      feedback: (interaction as QuizInteraction | SelectionInteraction).feedback || formData.value.feedback
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.currentTime, (time) => {
  if (!editingInteraction.value && time > 0) {
    formData.value.startTime = time
  }
})

const addOption = () => {
  const newId = `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  formData.value.options.push({ id: newId, label: '' })
}

const removeOption = (index: number) => {
  if (formData.value.options.length > 2) {
    const removedOption = formData.value.options[index]
    formData.value.options.splice(index, 1)
    if (formData.value.correctAnswer === removedOption?.id) {
      formData.value.correctAnswer = ''
    }
  }
}

const addItem = () => {
  formData.value.items.push({
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    imageUrl: '',
    imageAlt: '',
    correctLabel: ''
  })
}

const removeItem = (index: number) => {
  formData.value.items.splice(index, 1)
}

const addLabel = () => {
  formData.value.labels.push('')
}

const removeLabel = (index: number) => {
  formData.value.labels.splice(index, 1)
}

const isValid = computed(() => {
  if (!formData.value.type || formData.value.startTime === null || formData.value.startTime === undefined) {
    return false
  }
  
  if (formData.value.startTime < 0) {
    return false
  }
  
  if (formData.value.type === 'quiz') {
    return formData.value.question && 
           formData.value.options.length >= 2 &&
           formData.value.options.every((opt: any) => opt.label) &&
           formData.value.correctAnswer
  }
  
  if (formData.value.type === 'selection') {
    return formData.value.task &&
           formData.value.items.length > 0 &&
           formData.value.labels.length > 0 &&
           formData.value.items.every((item: any) => item.correctLabel)
  }
  
  return false
})

const handleSave = () => {
  if (!isValid.value) return
  
  // Set endTime to startTime (or startTime + small buffer) since interactions appear when paused
  const interactionTime = formData.value.startTime
  const interaction: Partial<Interaction> = {
    type: formData.value.type,
    startTime: interactionTime,
    endTime: interactionTime, // Same as startTime - interaction appears when paused at this time
  }
  
  if (formData.value.type === 'quiz') {
    Object.assign(interaction, {
      question: formData.value.question,
      options: formData.value.options,
      correctAnswer: formData.value.correctAnswer,
      feedback: formData.value.feedback
    })
  } else if (formData.value.type === 'selection') {
    Object.assign(interaction, {
      task: formData.value.task,
      items: formData.value.items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        imageUrl: item.imageUrl,
        imageAlt: item.imageAlt,
        correctLabel: item.correctLabel
      })),
      labels: formData.value.labels.filter((l: string) => l),
      feedback: formData.value.feedback
    })
  }
  
  if (editingInteraction.value && props.interaction) {
    interaction.id = props.interaction.id
  }
  
  emit('save', interaction)
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

