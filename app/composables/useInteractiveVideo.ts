import { ref, computed, readonly, unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { VideoInteraction } from '~/types/interactive-video.interface'

export const useInteractiveVideo = (
  interactions: Ref<VideoInteraction[]> | ComputedRef<VideoInteraction[]>
) => {
  const currentTime = ref(0)
  const duration = ref(0)
  const isPlaying = ref(false)
  const activeInteractions = ref<VideoInteraction[]>([])
  const interactionsRef = computed(() => unref(interactions))

  const updateTime = (time: number) => {
    currentTime.value = time

    // Find active interactions based on current time
    activeInteractions.value = interactionsRef.value.filter(
      (interaction) =>
        time >= interaction.startTime && time <= interaction.endTime
    )
  }

  const seekTo = (time: number, videoElement?: HTMLVideoElement) => {
    if (videoElement) {
      videoElement.currentTime = time
      updateTime(time)
    }
  }

  const togglePlay = (videoElement?: HTMLVideoElement) => {
    if (!videoElement) return

    if (videoElement.paused) {
      videoElement.play()
      isPlaying.value = true
    } else {
      videoElement.pause()
      isPlaying.value = false
    }
  }

  const getTimelineMarkers = computed(() => {
    if (!duration.value) return []

    return interactionsRef.value.map((interaction, index) => ({
      id: interaction._id || `${index}`,
      time: interaction.startTime,
      percentage: (interaction.startTime / duration.value) * 100,
    }))
  })

  const progressPercentage = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  return {
    currentTime: readonly(currentTime),
    duration: readonly(duration),
    isPlaying: isPlaying, // Not readonly so we can update it
    activeInteractions: readonly(activeInteractions),
    progressPercentage: readonly(progressPercentage),
    timelineMarkers: readonly(getTimelineMarkers),
    updateTime,
    seekTo,
    togglePlay,
    setDuration: (dur: number) => {
      duration.value = dur
    },
    setIsPlaying: (playing: boolean) => {
      isPlaying.value = playing
    },
  }
}


