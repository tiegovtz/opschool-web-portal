<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, toRef } from 'vue'
import { useInteractiveVideo } from '~/composable/useInteractiveVideo'
import VideoTimeline from '~/components/interactive/VideoTimeline.vue'
import QuizModal from '~/components/interactive/QuizModal.vue'
import SelectionModal from '~/components/interactive/SelectionModal.vue'
import type { VideoInteraction } from '~/types/interactive-video.interface'

interface Props {
  videoSrc: string
  interactions: VideoInteraction[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  quizSubmit: [interaction: VideoInteraction, answer: string]
  selectionSubmit: [interaction: VideoInteraction, answers: Record<string, string>]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const videoState = useInteractiveVideo(toRef(props, 'interactions'))
const activeQuiz = ref<VideoInteraction | null>(null)
const isQuizModalOpen = ref(false)
const activeSelection = ref<VideoInteraction | null>(null)
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

const handleTimeUpdate = () => {
  if (!videoRef.value) return
  const currentTime = videoRef.value.currentTime
  videoState.updateTime(currentTime)

  // Threshold for detecting interactions (since startTime === endTime, we need a small window)
  const INTERACTION_THRESHOLD = 0.5 // seconds

  // Check for quiz interactions - find any quiz that should be active now
  // Since interactions appear when paused at a specific time, we check if we're at or near that time
  const quizInteraction = props.interactions.find(
    (interaction) =>
      interaction.type === 'Quiz' &&
      !answeredQuizIds.value.has(interaction._id) && // Don't show already answered quizzes
      Math.abs(currentTime - interaction.startTime) <= INTERACTION_THRESHOLD // Within threshold of interaction time
  ) as VideoInteraction | undefined

  // Show quiz if we're at the interaction time and modal isn't already open
  if (quizInteraction && !isQuizModalOpen.value && activeQuiz.value?._id !== quizInteraction._id) {
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

  // Hide quiz if we've moved away from the interaction time
  if (activeQuiz.value && !quizInteraction) {
    const timeDiff = Math.abs(currentTime - activeQuiz.value.startTime)
    if (timeDiff > INTERACTION_THRESHOLD) {
      console.log('Hiding quiz, moved away from interaction time')
      isQuizModalOpen.value = false
      activeQuiz.value = null
    }
  }

  // Check for selection interactions
  const selectionInteraction = props.interactions.find(
    (interaction) =>
      interaction.type === 'Selection' &&
      !answeredQuizIds.value.has(interaction._id) && // Don't show already answered interactions
      Math.abs(currentTime - interaction.startTime) <= INTERACTION_THRESHOLD // Within threshold of interaction time
  ) as VideoInteraction | undefined

  // Show selection if we're at the interaction time and modal isn't already open
  if (selectionInteraction && !isSelectionModalOpen.value && activeSelection.value?._id !== selectionInteraction._id) {
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

  // Hide selection if we've moved away from the interaction time
  if (activeSelection.value && !selectionInteraction) {
    const timeDiff = Math.abs(currentTime - activeSelection.value.startTime)
    if (timeDiff > INTERACTION_THRESHOLD) {
      console.log('Hiding selection, moved away from interaction time')
      isSelectionModalOpen.value = false
      activeSelection.value = null
    }
  }
}

const handleLoadedMetadata = () => {
  if (!videoRef.value) return
  videoState.setDuration(videoRef.value.duration)

  // Check if we should show a quiz at the start
  const initialQuiz = videoState.activeInteractions.value.find(
    (interaction: VideoInteraction) => interaction.type === 'Quiz' && interaction.startTime === 0
  ) as VideoInteraction | undefined

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
  // When video is paused, check if we're at an interaction time
  if (videoRef.value) {
    // Use nextTick to ensure currentTime is updated
    nextTick(() => {
      handleTimeUpdate()
    })
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

// Watch for interactions changes and check if we should show any at current time
watch(() => props.interactions, (newInteractions) => {
  console.log('Interactions updated:', newInteractions.length)
  // If video is paused, check if we're at an interaction time
  if (videoRef.value && videoRef.value.paused) {
    handleTimeUpdate()
  }
}, { deep: true })

const handleSeek = (time: number) => {
  if (!videoRef.value) return
  videoState.seekTo(time, videoRef.value)
  // After seeking, check if we're at an interaction time
  nextTick(() => {
    handleTimeUpdate()
  })
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
  answeredQuizIds.value.add(activeQuiz.value._id)
  console.log('Marked quiz as answered:', activeQuiz.value._id)

  // Close the quiz modal first
  isQuizModalOpen.value = false
  const quizId = activeQuiz.value._id
  activeQuiz.value = null

  // Handle video playback based on answer correctness when user clicks Continue
  if (isCorrect === true) {
    // Correct answer: resume from where it was paused, but skip past the quiz time range
    console.log('Resuming video from:', quizPauseTime.value)
    const resumeTime = quizPauseTime.value > 0 ? quizPauseTime.value : videoRef.value.currentTime

    // Find the quiz interaction to get its end time
    const quizInteraction = props.interactions.find(i => i._id === quizId && i.type === 'Quiz') as VideoInteraction | undefined
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
    // Incorrect answer: go back to just after the previous interaction's end time + 1 second
    console.log('Incorrect answer - finding previous interaction')

    // Sort all interactions by startTime to find the previous one
    const sortedInteractions = [...props.interactions].sort((a, b) => a.startTime - b.startTime)

    // Find the current quiz interaction
    const currentInteraction = sortedInteractions.find(i => i._id === quizId)
    const currentIndex = currentInteraction ? sortedInteractions.indexOf(currentInteraction) : -1

    // Find the previous interaction (before the current one)
    let previousInteraction = null
    if (currentIndex > 0) {
      previousInteraction = sortedInteractions[currentIndex - 1]
    }

    // Remove the quiz from answered list so it can show again
    answeredQuizIds.value.delete(quizId)

    if (previousInteraction) {
      // Jump to previous interaction's end time + 1 second
      const jumpTime = previousInteraction.endTime + 1
      console.log('Jumping to previous interaction end time + 1s:', jumpTime, 'Previous interaction:', previousInteraction._id)
      videoRef.value.currentTime = jumpTime
    } else {
      // If no previous interaction, restart from beginning
      console.log('No previous interaction found - restarting from beginning')
      videoRef.value.currentTime = 0
    }

    videoRef.value.play().catch(e => {
      console.error('Failed to resume video:', e)
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
  answeredQuizIds.value.add(activeSelection.value._id)
  console.log('Marked selection as answered:', activeSelection.value._id)

  // Close the modal first
  isSelectionModalOpen.value = false
  const interactionId = activeSelection.value._id
  activeSelection.value = null

  // Handle video playback based on answer correctness
  if (isCorrect === true) {
    // Correct answer: resume from where it was paused, but skip past the interaction time range
    console.log('Resuming video from:', selectionPauseTime.value)
    const resumeTime = selectionPauseTime.value > 0 ? selectionPauseTime.value : videoRef.value.currentTime

    // Find the interaction to get its end time
    const interaction = props.interactions.find(i => i._id === interactionId && i.type === 'Selection') as VideoInteraction | undefined
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
    // Incorrect answer: go back to just after the previous interaction's end time + 1 second
    console.log('Incorrect answer - finding previous interaction')

    // Sort all interactions by startTime to find the previous one
    const sortedInteractions = [...props.interactions].sort((a, b) => a.startTime - b.startTime)

    // Find the current selection interaction
    const currentInteraction = sortedInteractions.find(i => i._id === interactionId)
    const currentIndex = currentInteraction ? sortedInteractions.indexOf(currentInteraction) : -1

    // Find the previous interaction (before the current one)
    let previousInteraction = null
    if (currentIndex > 0) {
      previousInteraction = sortedInteractions[currentIndex - 1]
    }

    // Remove the interaction from answered list so it can show again
    answeredQuizIds.value.delete(interactionId)

    if (previousInteraction) {
      // Jump to previous interaction's end time + 1 second
      const jumpTime = previousInteraction.endTime + 1
      console.log('Jumping to previous interaction end time + 1s:', jumpTime, 'Previous interaction:', previousInteraction._id)
      videoRef.value.currentTime = jumpTime
    } else {
      // If no previous interaction, restart from beginning
      console.log('No previous interaction found - restarting from beginning')
      videoRef.value.currentTime = 0
    }

    videoRef.value.play().catch(e => {
      console.error('Failed to resume video:', e)
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
    ? props.interactions.find(i => i._id === quizId && i.type === 'Quiz') as VideoInteraction | undefined
    : props.interactions.find(i => i.type === 'Quiz') as VideoInteraction | undefined

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

// Expose methods and properties for parent component
defineExpose({
  triggerQuiz,
  videoRef,
  getDuration: () => videoState.duration.value,
  getCurrentTime: () => videoState.currentTime.value,
  videoState
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

<template>
  <ClientOnly>
    <div ref="containerRef" class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref="videoRef"
        class="w-full h-full object-contain"
        preload="auto"
        aria-label="Interactive educational video with quizzes"
        aria-describedby="video-description"
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
        crossorigin="use-credentials"
      >
        <source :src="videoSrc" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div id="video-description" class="sr-only">
        Interactive video player with embedded quizzes. Quizzes will appear at specific timestamps during playback.
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
        role="toolbar"
        aria-label="Video player controls"
        @mouseenter="showControls = true"
        @mouseleave="startControlsTimer"
      >
        <div class="flex items-center gap-3">
          <!-- Play/Pause Button -->
          <button
            class="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
            :aria-label="videoState.isPlaying.value ? 'Pause video' : 'Play video'"
            :aria-pressed="videoState.isPlaying.value"
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
          <!-- <span class="text-white text-sm font-mono min-w-[45px]" aria-label="Current time">
            {{ formatTime(videoState.currentTime.value) }}
          </span> -->
          
          <!-- Progress Bar -->
          <div class="flex-1 min-w-0" role="progressbar" :aria-valuenow="videoState.currentTime.value" :aria-valuemin="0" :aria-valuemax="videoState.duration.value" :aria-label="`Video progress: ${Math.round((videoState.currentTime.value / videoState.duration.value) * 100)}%`">
            <VideoTimeline
              :current-time="videoState.currentTime.value || 0"
              :duration="videoState.duration.value || 0"
              :markers="[...(videoState.timelineMarkers.value || [])]"
              @seek="handleSeek"
            />
          </div>
          
          <!-- <span class="text-white text-sm font-mono min-w-[45px] text-right" aria-label="Total duration">
            {{ formatTime(videoState.duration.value) }}
          </span>
           -->
          <!-- Fullscreen Button -->
          <button
            class="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
            :aria-label="isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'"
            :aria-pressed="isFullscreen"
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
