<template>
  <ClientOnly>
    <div ref="containerRef" class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref="videoRef"
        class="w-full h-full object-contain"
        preload="auto"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @click="handleVideoClick"
        @play="handlePlay"
        @pause="handlePause"
        @mouseenter="showControls = true"
        @mousemove="resetControlsTimer"
        @mouseleave="startControlsTimer"
        @error="handleVideoError"
        @loadstart="handleLoadStart"
        @contextmenu.prevent
        crossorigin="anonymous"
      >
        <source :src="videoSrc" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <!-- Interaction Overlay -->
      <div
        v-if="activeHotspots.length > 0"
        class="absolute inset-0 pointer-events-none z-30"
      >
        <InteractiveHotspot
          v-for="hotspot in activeHotspots"
          :key="hotspot.id"
          :interaction="hotspot"
          :active="true"
          @click="handleHotspotClick"
        />
      </div>

      <!-- Enhanced Play/Pause Button Overlay -->
      <button
        v-if="!videoState.isPlaying.value"
        class="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all duration-300 z-20 group"
        @click="handleVideoClick"
        aria-label="Play video"
      >
        <div class="relative">
          <div class="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
          <div class="relative w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <svg class="w-10 h-10 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </button>

      <!-- Enhanced Timeline Controls -->
      <div 
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 backdrop-blur-sm z-40 transition-opacity duration-300"
        :class="showControls || isQuizModalOpen ? 'opacity-100' : 'opacity-0'"
        @mouseenter="showControls = true"
        @mouseleave="startControlsTimer"
      >
        <div class="flex items-center gap-3">
          <!-- Play/Pause Button -->
          <button
            class="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
            :aria-label="videoState.isPlaying.value ? 'Pause' : 'Play'"
            @click="handleVideoClick"
          >
            <svg
              v-if="!videoState.isPlaying.value"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          
          <!-- Time Display -->
          <span class="text-white text-sm font-mono min-w-[45px]">
            {{ formatTime(videoState.currentTime.value) }}
          </span>
          
          <!-- Progress Bar -->
          <div class="flex-1 min-w-0">
            <VideoTimeline
              :current-time="videoState.currentTime.value || 0"
              :duration="videoState.duration.value || 0"
              :markers="videoState.timelineMarkers.value || []"
              @seek="handleSeek"
            />
          </div>
          
          <span class="text-white text-sm font-mono min-w-[45px] text-right">
            {{ formatTime(videoState.duration.value) }}
          </span>
          
          <!-- Fullscreen Button -->
          <button
            class="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            @click="toggleFullscreen"
          >
            <svg
              v-if="!isFullscreen"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Quiz Modal - Positioned within video container -->
      <QuizModal
        v-if="activeQuiz && isQuizModalOpen"
        :quiz="activeQuiz"
        :is-open="isQuizModalOpen"
        :is-fullscreen="isFullscreen"
        @submit="handleQuizSubmit"
        @continue="handleQuizContinue"
        @close="handleQuizClose"
      />
      
      <!-- Selection Modal -->
      <SelectionModal
        v-if="activeSelection && isSelectionModalOpen"
        :interaction="activeSelection"
        :is-open="isSelectionModalOpen"
        :is-fullscreen="isFullscreen"
        @submit="handleSelectionSubmit"
        @continue="handleSelectionContinue"
        @close="handleSelectionClose"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useInteractiveVideo } from '~/composable/useInteractiveVideo'
import VideoTimeline from '~/components/interactive/VideoTimeline.vue'
import InteractiveHotspot from '~/components/interactive/InteractiveHotspot.vue'
import QuizModal from '~/components/interactive/QuizModal.vue'
import SelectionModal from '~/components/interactive/SelectionModal.vue'
import type { Interaction, HotspotInteraction, QuizInteraction, SelectionInteraction } from '~/types/interactive-video.interface'

interface Props {
  videoSrc: string
  interactions: Interaction[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  hotspotClick: [interaction: HotspotInteraction]
  quizSubmit: [interaction: QuizInteraction, answer: string]
  selectionSubmit: [interaction: SelectionInteraction, answers: Record<string, string>]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const videoState = useInteractiveVideo(props.interactions)
const activeQuiz = ref<QuizInteraction | null>(null)
const isQuizModalOpen = ref(false)
const activeSelection = ref<SelectionInteraction | null>(null)
const isSelectionModalOpen = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
let controlsTimer: ReturnType<typeof setTimeout> | null = null

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const resetControlsTimer = () => {
  showControls.value = true
  startControlsTimer()
}

const startControlsTimer = () => {
  if (controlsTimer) clearTimeout(controlsTimer)
  if (!isQuizModalOpen.value && !isSelectionModalOpen.value) {
    controlsTimer = setTimeout(() => {
      if (!videoRef.value?.paused) {
        showControls.value = false
      }
    }, 3000)
  }
}

const activeHotspots = computed(() => {
  return videoState.activeInteractions.value.filter(
    (interaction) => interaction.type === 'hotspot'
  ) as HotspotInteraction[]
})

const handleTimeUpdate = () => {
  if (!videoRef.value) return
  const currentTime = videoRef.value.currentTime
  videoState.updateTime(currentTime)

  // Check for quiz interactions - find any quiz that should be active now
  const quizInteraction = props.interactions.find(
    (interaction) => 
      interaction.type === 'quiz' && 
      currentTime >= interaction.startTime && 
      currentTime <= interaction.endTime &&
      !answeredQuizIds.value.has(interaction.id) // Don't show already answered quizzes
  ) as QuizInteraction | undefined

  // Show quiz if we're in the quiz time range and modal isn't already open
  if (quizInteraction && !isQuizModalOpen.value && activeQuiz.value?.id !== quizInteraction.id) {
    console.log('Quiz detected at time:', currentTime, 'Quiz:', quizInteraction)
    activeQuiz.value = quizInteraction
    isQuizModalOpen.value = true
    // Store the current time when quiz appears (before pausing)
    if (videoRef.value) {
      quizPauseTime.value = videoRef.value.currentTime
      console.log('Stored quiz pause time:', quizPauseTime.value)
      if (!videoRef.value.paused) {
        videoRef.value.pause()
      }
    }
  }
  
  // Hide quiz if we're outside the quiz time range (only if we've moved past the end time)
  if (activeQuiz.value && !quizInteraction && currentTime > (activeQuiz.value.endTime || 0)) {
    console.log('Hiding quiz, moved past end time')
    isQuizModalOpen.value = false
    activeQuiz.value = null
  }

  // Check for selection interactions
  const selectionInteraction = props.interactions.find(
    (interaction) => 
      interaction.type === 'selection' && 
      currentTime >= interaction.startTime && 
      currentTime <= interaction.endTime &&
      !answeredQuizIds.value.has(interaction.id) // Don't show already answered interactions
  ) as SelectionInteraction | undefined

  // Show selection if we're in the time range and modal isn't already open
  if (selectionInteraction && !isSelectionModalOpen.value && activeSelection.value?.id !== selectionInteraction.id) {
    console.log('Selection detected at time:', currentTime, 'Interaction:', selectionInteraction)
    activeSelection.value = selectionInteraction
    isSelectionModalOpen.value = true
    // Store the current time when interaction appears (before pausing)
    if (videoRef.value) {
      selectionPauseTime.value = videoRef.value.currentTime
      console.log('Stored selection pause time:', selectionPauseTime.value)
      if (!videoRef.value.paused) {
        videoRef.value.pause()
      }
    }
  }
  
  // Hide selection if we're outside the time range
  if (activeSelection.value && !selectionInteraction && currentTime > (activeSelection.value.endTime || 0)) {
    console.log('Hiding selection, moved past end time')
    isSelectionModalOpen.value = false
    activeSelection.value = null
  }
}

const handleLoadedMetadata = () => {
  if (!videoRef.value) return
  videoState.setDuration(videoRef.value.duration)
  
  // Check if we should show a quiz at the start
  const initialQuiz = videoState.activeInteractions.value.find(
    (interaction) => interaction.type === 'quiz' && interaction.startTime === 0
  ) as QuizInteraction | undefined
  
  if (initialQuiz && !isQuizModalOpen.value) {
    activeQuiz.value = initialQuiz
    isQuizModalOpen.value = true
    if (videoRef.value) {
      videoRef.value.pause()
    }
  }
}

const handleVideoClick = () => {
  if (!videoRef.value) return
  videoState.togglePlay(videoRef.value)
}

const handlePlay = () => {
  if (videoState && videoState.setIsPlaying) {
    videoState.setIsPlaying(true)
  }
}

const handlePause = () => {
  if (videoState && videoState.setIsPlaying) {
    videoState.setIsPlaying(false)
  }
}

const handleLoadStart = () => {
  console.log('Video load started. Source:', props.videoSrc)
}

const handleVideoError = (event: Event) => {
  const video = event.target as HTMLVideoElement
  const error = video.error
  console.error('Video error:', {
    code: error?.code,
    message: error?.message,
    source: props.videoSrc,
    networkState: video.networkState,
    readyState: video.readyState
  })
  
  if (error) {
    let errorMessage = 'Failed to load video'
    switch (error.code) {
      case 1: // MEDIA_ERR_ABORTED
        errorMessage = 'Video loading was aborted'
        break
      case 2: // MEDIA_ERR_NETWORK
        errorMessage = 'Network error while loading video. Check authentication and network connection.'
        break
      case 3: // MEDIA_ERR_DECODE
        errorMessage = 'Error decoding video'
        break
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        errorMessage = 'Video format not supported'
        break
    }
    console.error('Video error details:', errorMessage)
  }
}

// Watch for video source changes and reload
watch(() => props.videoSrc, (newSrc, oldSrc) => {
  if (newSrc && newSrc !== oldSrc && videoRef.value) {
    console.log('Video source changed from', oldSrc, 'to', newSrc)
    videoRef.value.load() // Force reload
  }
}, { immediate: false })

const handleSeek = (time: number) => {
  if (!videoRef.value) return
  videoState.seekTo(time, videoRef.value)
}

const handleHotspotClick = (interaction: HotspotInteraction) => {
  emit('hotspotClick', interaction)
  
  // Handle different action types
  if (interaction.action === 'modal') {
    // Could show a modal with interaction.content
    console.log('Hotspot clicked:', interaction)
  } else if (interaction.action === 'link' && interaction.actionData?.url) {
    window.open(interaction.actionData.url, '_blank')
  }
}

const quizAnswerCorrect = ref<boolean | null>(null)
const quizPauseTime = ref<number>(0)
const answeredQuizIds = ref<Set<string>>(new Set())

const handleQuizSubmit = (answer: string, isCorrect: boolean) => {
  if (!activeQuiz.value) return
  
  // Store if answer was correct
  quizAnswerCorrect.value = isCorrect
  
  emit('quizSubmit', activeQuiz.value, answer)
}

const handleQuizContinue = (isCorrect: boolean) => {
  console.log('handleQuizContinue called with isCorrect:', isCorrect, 'quizPauseTime:', quizPauseTime.value)
  
  if (!videoRef.value || !activeQuiz.value) {
    console.error('Video ref or active quiz is null in handleQuizContinue')
    return
  }
  
  // Mark this quiz as answered so it won't show again
  answeredQuizIds.value.add(activeQuiz.value.id)
  console.log('Marked quiz as answered:', activeQuiz.value.id)
  
  // Close the quiz modal first
  isQuizModalOpen.value = false
  const quizId = activeQuiz.value.id
  activeQuiz.value = null
  
  // Handle video playback based on answer correctness when user clicks Continue
  if (isCorrect === true) {
    // Correct answer: resume from where it was paused, but skip past the quiz time range
    console.log('Resuming video from:', quizPauseTime.value)
    const resumeTime = quizPauseTime.value > 0 ? quizPauseTime.value : videoRef.value.currentTime
    
    // Find the quiz interaction to get its end time
    const quizInteraction = props.interactions.find(i => i.id === quizId && i.type === 'quiz') as QuizInteraction | undefined
    const quizEndTime = quizInteraction?.endTime || resumeTime
    
    // Skip to just after the quiz time range to prevent it from showing again
    const skipTime = Math.max(resumeTime, quizEndTime + 0.5)
    videoRef.value.currentTime = skipTime
    console.log('Skipping to time:', skipTime, 'to avoid quiz time range')
    
    videoRef.value.play().catch(e => {
      console.error('Failed to resume video:', e)
      // Try again after a short delay
      setTimeout(() => {
        videoRef.value?.play().catch(err => console.error('Retry failed:', err))
      }, 200)
    })
  } else if (isCorrect === false) {
    // Incorrect answer: restart from beginning
    console.log('Restarting video from beginning')
    // Remove the quiz from answered list so it can show again
    answeredQuizIds.value.delete(quizId)
    videoRef.value.currentTime = 0
    videoRef.value.play().catch(e => {
      console.error('Failed to restart video:', e)
      // Try again after a short delay
      setTimeout(() => {
        videoRef.value?.play().catch(err => console.error('Retry failed:', err))
      }, 200)
    })
  }
  
  // Reset quiz answer state
  quizAnswerCorrect.value = null
  quizPauseTime.value = 0
}

const handleQuizClose = () => {
  isQuizModalOpen.value = false
  activeQuiz.value = null
  
  // Reset quiz answer state
  quizAnswerCorrect.value = null
  quizPauseTime.value = 0
}

const selectionPauseTime = ref<number>(0)

const handleSelectionSubmit = (answers: Record<string, string>) => {
  if (!activeSelection.value) return
  console.log('Selection submitted with answers:', answers)
  emit('selectionSubmit', activeSelection.value, answers)
}

const handleSelectionContinue = (isCorrect: boolean) => {
  console.log('handleSelectionContinue called with isCorrect:', isCorrect, 'pauseTime:', selectionPauseTime.value)
  
  if (!videoRef.value || !activeSelection.value) {
    console.error('Video ref or active selection is null')
    return
  }
  
  // Mark this interaction as answered so it won't show again
  answeredQuizIds.value.add(activeSelection.value.id)
  console.log('Marked selection as answered:', activeSelection.value.id)
  
  // Close the modal first
  isSelectionModalOpen.value = false
  const interactionId = activeSelection.value.id
  activeSelection.value = null
  
  // Handle video playback based on answer correctness
  if (isCorrect === true) {
    // Correct answer: resume from where it was paused, but skip past the interaction time range
    console.log('Resuming video from:', selectionPauseTime.value)
    const resumeTime = selectionPauseTime.value > 0 ? selectionPauseTime.value : videoRef.value.currentTime
    
    // Find the interaction to get its end time
    const interaction = props.interactions.find(i => i.id === interactionId && i.type === 'selection') as SelectionInteraction | undefined
    const endTime = interaction?.endTime || resumeTime
    
    // Skip to just after the interaction time range
    const skipTime = Math.max(resumeTime, endTime + 0.5)
    videoRef.value.currentTime = skipTime
    console.log('Skipping to time:', skipTime)
    
    videoRef.value.play().catch(e => {
      console.error('Failed to resume video:', e)
      setTimeout(() => {
        videoRef.value?.play().catch(err => console.error('Retry failed:', err))
      }, 200)
    })
  } else if (isCorrect === false) {
    // Incorrect answer: restart from beginning
    console.log('Restarting video from beginning')
    answeredQuizIds.value.delete(interactionId)
    videoRef.value.currentTime = 0
    videoRef.value.play().catch(e => {
      console.error('Failed to restart video:', e)
      setTimeout(() => {
        videoRef.value?.play().catch(err => console.error('Retry failed:', err))
      }, 200)
    })
  }
  
  selectionPauseTime.value = 0
}

const handleSelectionClose = () => {
  isSelectionModalOpen.value = false
  activeSelection.value = null
  selectionPauseTime.value = 0
}

// Expose method to manually trigger quiz (for testing)
const triggerQuiz = (quizId?: string) => {
  console.log('triggerQuiz called with quizId:', quizId)
  console.log('Available interactions:', props.interactions)
  const quizToShow = quizId 
    ? props.interactions.find(i => i.id === quizId && i.type === 'quiz') as QuizInteraction | undefined
    : props.interactions.find(i => i.type === 'quiz') as QuizInteraction | undefined
  
  if (quizToShow) {
    console.log('Manually triggering quiz:', quizToShow)
    activeQuiz.value = quizToShow
    isQuizModalOpen.value = true
    console.log('Quiz state - activeQuiz:', activeQuiz.value, 'isOpen:', isQuizModalOpen.value)
    if (videoRef.value && !videoRef.value.paused) {
      videoRef.value.pause()
    }
  } else {
    console.warn('No quiz found to trigger. Available interactions:', props.interactions)
  }
}

// Expose methods for parent component
defineExpose({
  triggerQuiz
})

const toggleFullscreen = async () => {
  if (!containerRef.value) return

  try {
    if (!document.fullscreenElement) {
      await containerRef.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error)
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  isFullscreen.value = !!document.fullscreenElement
  startControlsTimer()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (controlsTimer) clearTimeout(controlsTimer)
})
</script>

