import { useState, useMemo, useCallback } from 'react'
import type { Interaction } from '@/types/interactive-video.interface'

export interface TimelineMarker {
  id: string
  time: number
  percentage: number
}

export const useInteractiveVideo = (interactions: Interaction[]) => {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeInteractions, setActiveInteractions] = useState<Interaction[]>([])

  const updateTime = useCallback((time: number) => {
    setCurrentTime(time)

    // Find active interactions based on current time
    const active = interactions.filter(
      (interaction) =>
        time >= interaction.startTime && time <= interaction.endTime
    )
    setActiveInteractions(active)
  }, [interactions])

  const seekTo = useCallback((time: number, videoElement?: HTMLVideoElement) => {
    if (videoElement) {
      videoElement.currentTime = time
      updateTime(time)
    }
  }, [updateTime])

  const togglePlay = useCallback((videoElement?: HTMLVideoElement) => {
    if (!videoElement) return

    if (videoElement.paused) {
      videoElement.play()
      setIsPlaying(true)
    } else {
      videoElement.pause()
      setIsPlaying(false)
    }
  }, [])

  const timelineMarkers = useMemo<TimelineMarker[]>(() => {
    if (!duration) return []

    return interactions.map((interaction) => ({
      id: interaction.id,
      time: interaction.startTime,
      percentage: (interaction.startTime / duration) * 100,
    }))
  }, [interactions, duration])

  const progressPercentage = useMemo(() => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])

  return {
    currentTime,
    duration,
    isPlaying,
    activeInteractions,
    progressPercentage,
    timelineMarkers,
    updateTime,
    seekTo,
    togglePlay,
    setDuration,
    setIsPlaying,
  }
}


