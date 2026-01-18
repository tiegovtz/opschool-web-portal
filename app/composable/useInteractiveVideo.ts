import { ref, computed, readonly } from 'vue'
import type { Interaction } from '~/types/interactive-video.interface'

export const useInteractiveVideo = (interactions: Interaction[]) => {
  const currentTime = ref(0)
  const duration = ref(0)
  const isPlaying = ref(false)
  const activeInteractions = ref<Interaction[]>([])

  const updateTime = (time: number) => {
    currentTime.value = time

    // Find active interactions based on current time
    activeInteractions.value = interactions.filter(
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

    return interactions.map((interaction) => ({
      id: interaction.id,
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



