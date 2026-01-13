<template>
  <NuxtLayout name="home-layout">
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Manage Video Interactions</h1>
              <p v-if="videoInfo" class="text-gray-600 mt-1">{{ videoInfo.title || videoInfo.name || 'Video' }}</p>
            </div>
            <NuxtLink
              to="/admin/video-interactions"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Videos
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Video Player Section -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Video Player -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
              <div class="relative w-full aspect-video bg-black">
                <InteractiveVideo
                  v-if="videoSrc && interactions.length >= 0"
                  ref="interactiveVideoRef"
                  :video-src="videoSrc"
                  :interactions="interactions"
                  @quiz-submit="handleQuizSubmit"
                  @selection-submit="handleSelectionSubmit"
                />
              </div>
              
              <!-- Interactive Timeline -->
              <div class="p-4 border-t border-gray-200">
                <div class="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>{{ formatTime(currentTime) }}</span>
                  <span>{{ formatTime(videoDuration) }}</span>
                </div>
                <div
                  ref="timelineRef"
                  class="relative h-12 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
                  @click="handleTimelineClick"
                >
                  <!-- Progress Bar -->
                  <div
                    class="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
                    :style="{ width: `${(currentTime / videoDuration) * 100}%` }"
                  />
                  
                  <!-- Interaction Markers -->
                  <template v-if="videoDuration > 0">
                    <div
                      v-for="interaction in interactions"
                      :key="interaction.id"
                      class="absolute top-0 h-full w-1 z-10 cursor-pointer hover:opacity-80 transition-opacity transform -translate-x-1/2"
                      :class="getMarkerColor(interaction.type)"
                      :style="{
                        left: `${Math.max(0, Math.min(100, (interaction.startTime / videoDuration) * 100))}%`
                      }"
                      @click.stop="editInteraction(interaction)"
                      :title="getInteractionTooltip(interaction)"
                    />
                  </template>
                  
                  <!-- Current Time Indicator -->
                  <div
                    class="absolute top-0 h-full w-1 bg-white shadow-lg"
                    :style="{ left: `${(currentTime / videoDuration) * 100}%` }"
                  />
                </div>
                
                <div class="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Quiz</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Selection</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interactions List -->
            <InteractionsList
              :interactions="interactions"
              @edit="editInteraction"
              @delete="deleteInteraction"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button
                  @click="openFormAtCurrentTime"
                  class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                >
                  + Add Interaction at {{ formatTime(currentTime) }}
                </button>
                <button
                  @click="saveAll"
                  :disabled="saving"
                  class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {{ saving ? 'Saving...' : 'Save All Changes' }}
                </button>
              </div>
            </div>

            <!-- Video Info -->
            <div v-if="videoInfo" class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Video Information</h3>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Subject:</span>
                  <span class="ml-2 text-gray-600">{{ videoInfo.subject?.name || videoInfo.subject || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Level:</span>
                  <span class="ml-2 text-gray-600">{{ videoInfo.educationLevel?.name || videoInfo.educationLevel || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Type:</span>
                  <span class="ml-2 text-gray-600">{{ videoInfo.videoType || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Duration:</span>
                  <span class="ml-2 text-gray-600">{{ formatTime(videoDuration) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interaction Form Modal -->
    <InteractionForm
      :is-open="showForm"
      :interaction="editingInteraction"
      :current-time="formStartTime"
      @save="handleSaveInteraction"
      @cancel="closeForm"
    />

    <!-- Success/Error Notifications -->
    <Transition name="notification">
      <div
        v-if="notification.show"
        :class="[
          'fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50',
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        ]"
      >
        <p class="text-white font-medium">{{ notification.message }}</p>
      </div>
    </Transition>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Interaction, QuizInteraction, SelectionInteraction } from '~/types/interactive-video.interface'
import InteractiveVideo from '~/components/interactive/InteractiveVideo.vue'
import InteractionForm from '~/components/admin/InteractionForm.vue'
import InteractionsList from '~/components/admin/InteractionsList.vue'
import apiDocs from '~/utilities/apiDocs'

definePageMeta({
  middleware: 'auth',
  ssr: false
})

const route = useRoute()
const videoId = route.params.videoId as string

const videoRef = ref<HTMLVideoElement | null>(null)
const interactiveVideoRef = ref<InstanceType<typeof InteractiveVideo> | null>(null)
const timelineRef = ref<HTMLDivElement | null>(null)
const videoSrc = ref<string>('')
const videoInfo = ref<any>(null)
const videoDuration = ref(0)
const currentTime = ref(0)
const interactions = ref<Interaction[]>([])
const isLoading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const editingInteraction = ref<Interaction | null>(null)
const formStartTime = ref(0)

const notification = ref({
  show: false,
  type: 'success' as 'success' | 'error',
  message: ''
})

const loadVideo = async () => {
  try {
    isLoading.value = true
    
    // Fetch video info
    const response = await $fetch(apiDocs.videos.getPublicVideo, {
      params: { limit: 1000 }
    })
    
    const videos = Array.isArray(response) ? response : (response as any)?.data || []
    const video = videos.find((v: any) => (v._id || v.id) === videoId)
    
    if (video) {
      videoInfo.value = video
      videoSrc.value = `/api/video/${videoId}`
    } else {
      showNotification('Video not found', 'error')
    }
  } catch (error) {
    console.error('Error loading video:', error)
    showNotification('Failed to load video', 'error')
  } finally {
    isLoading.value = false
  }
}

const loadInteractions = async () => {
  try {
    const data = await $fetch(`/api/videos/${videoId}/interactions`)
    const loaded = Array.isArray(data) ? data : []
    interactions.value = loaded
    console.log('Loaded interactions:', loaded.length, loaded)
  } catch (error) {
    console.error('Error loading interactions:', error)
    interactions.value = []
  }
}

const onVideoLoaded = () => {
  // Try to get duration from video ref or interactive video component
  if (videoRef.value) {
    videoDuration.value = videoRef.value.duration
  }
  // Get duration from InteractiveVideo component
  if (interactiveVideoRef.value) {
    const duration = interactiveVideoRef.value.getDuration()
    if (duration > 0) {
      videoDuration.value = duration
    }
  }
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
  // Get current time from InteractiveVideo component
  if (interactiveVideoRef.value) {
    const time = interactiveVideoRef.value.getCurrentTime()
    if (time >= 0) {
      currentTime.value = time
    }
  }
}

// Handle events from InteractiveVideo component
const handleQuizSubmit = (interaction: QuizInteraction, answer: string) => {
  console.log('Quiz submitted in admin:', interaction, answer)
  // In admin mode, we don't need to do anything special, just log it
}

const handleSelectionSubmit = (interaction: SelectionInteraction, answers: Record<string, string>) => {
  console.log('Selection submitted in admin:', interaction, answers)
  // In admin mode, we don't need to do anything special, just log it
}


// Update time from InteractiveVideo's internal video element
// We'll use a watch or interval to sync the timeline
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null

const startTimeSync = () => {
  if (timeUpdateInterval) clearInterval(timeUpdateInterval)
  timeUpdateInterval = setInterval(() => {
    // Get current time and duration from InteractiveVideo component
    if (interactiveVideoRef.value) {
      const time = interactiveVideoRef.value.getCurrentTime()
      const duration = interactiveVideoRef.value.getDuration()
      if (time >= 0) {
        currentTime.value = time
      }
      if (duration > 0 && videoDuration.value === 0) {
        videoDuration.value = duration
      }
    }
  }, 100)
}

const stopTimeSync = () => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
}

const handleTimelineClick = (event: MouseEvent) => {
  if (!timelineRef.value || videoDuration.value === 0) return
  
  const rect = timelineRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const time = percentage * videoDuration.value
  
  formStartTime.value = time
  editingInteraction.value = null
  showForm.value = true
  
  // Note: InteractiveVideo manages its own video element, so seeking would need
  // to be done through the component's exposed methods or we'd need to add that functionality
  // For now, the form will open at the clicked time
}

const openFormAtCurrentTime = () => {
  formStartTime.value = currentTime.value
  editingInteraction.value = null
  showForm.value = true
}

const editInteraction = (interaction: Interaction) => {
  editingInteraction.value = interaction
  formStartTime.value = interaction.startTime
  showForm.value = true
  
  // Note: InteractiveVideo manages its own video element
  // Seeking would need to be implemented through the component if needed
  // For now, the form will open with the interaction's time
}

const handleSaveInteraction = async (interaction: Partial<Interaction>) => {
  try {
    saving.value = true
    
    console.log('Saving interaction:', interaction)
    console.log('Video ID:', videoId)
    console.log('Editing interaction:', editingInteraction.value)
    
    if (editingInteraction.value) {
      // Update existing
      const response = await $fetch(`/api/videos/${videoId}/interactions/${editingInteraction.value.id}`, {
        method: 'PUT',
        body: interaction
      })
      console.log('Update response:', response)
      showNotification('Interaction updated successfully', 'success')
    } else {
      // Create new
      const response = await $fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        body: interaction
      })
      console.log('Create response:', response)
      showNotification('Interaction created successfully', 'success')
    }
    
    await loadInteractions()
    closeForm()
  } catch (error: any) {
    console.error('Error saving interaction:', error)
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      data: error.data,
      stack: error.stack
    })
    showNotification(error.message || error.data?.message || 'Failed to save interaction', 'error')
  } finally {
    saving.value = false
  }
}

const deleteInteraction = async (interactionId: string) => {
  try {
    await $fetch(`/api/videos/${videoId}/interactions/${interactionId}`, {
      method: 'DELETE'
    })
    showNotification('Interaction deleted successfully', 'success')
    await loadInteractions()
  } catch (error: any) {
    console.error('Error deleting interaction:', error)
    showNotification(error.message || 'Failed to delete interaction', 'error')
  }
}

const saveAll = async () => {
  // All interactions are saved immediately, so this is just a confirmation
  showNotification('All interactions are saved', 'success')
}

const closeForm = () => {
  showForm.value = false
  editingInteraction.value = null
  formStartTime.value = 0
  // Reset form data by triggering a watch
  nextTick(() => {
    // Form will reset when showForm becomes false and editingInteraction is null
  })
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getMarkerColor = (type: string): string => {
    const colors: Record<string, string> = {
      quiz: 'bg-blue-500',
      selection: 'bg-green-500'
    }
  return colors[type] || 'bg-gray-500'
}

const getInteractionTooltip = (interaction: Interaction): string => {
  if (interaction.type === 'quiz') {
      return (interaction as any).question || 'Quiz'
      } else if (interaction.type === 'selection') {
        return (interaction as any).task || 'Selection'
      }
  return interaction.type
}

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

onMounted(async () => {
  await loadVideo()
  await loadInteractions()
  // Start syncing time if needed
  startTimeSync()
})

onUnmounted(() => {
  stopTimeSync()
})

useHead({
  title: 'Manage Video Interactions - TIE',
  meta: [
    {
      name: 'description',
      content: 'Manage interactive video interactions'
    }
  ]
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

