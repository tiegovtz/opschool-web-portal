'use client'

import { useState, useMemo } from 'react'

export interface TimelineMarker {
  id: string
  time: number
  percentage: number
}

interface Props {
  currentTime: number
  duration: number
  markers: TimelineMarker[]
  disabled?: boolean
  onSeek: (time: number) => void
}

export default function VideoTimeline({ currentTime, duration, markers, disabled = false, onSeek }: Props) {
  const [hoverTime, setHoverTime] = useState<number | null>(null)

  const progressPercentage = useMemo(() => {
    if (!duration || duration === 0) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])

  const hoverPercentage = useMemo(() => {
    if (hoverTime === null || !duration) return 0
    return (hoverTime / duration) * 100
  }, [hoverTime, duration])

  const handleHover = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!event.currentTarget || !duration) return
    const timeline = event.currentTarget as HTMLElement
    const rect = timeline.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    setHoverTime(percentage * duration)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !event.currentTarget) return

    const timeline = event.currentTarget as HTMLElement
    const rect = timeline.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const seekTime = percentage * duration

    onSeek(Math.max(0, Math.min(seekTime, duration)))
  }

  return (
    <div className="w-full group">
      <div 
        className="relative h-1.5 bg-white/30 rounded-full cursor-pointer transition-all duration-200 group-hover:h-2" 
        onClick={handleSeek} 
        onMouseMove={handleHover} 
        onMouseLeave={() => setHoverTime(null)}
      >
        <div
          className="absolute h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-150 shadow-lg"
          style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
        />
        {/* Hover preview */}
        {hoverTime !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/60"
            style={{ left: `${hoverPercentage}%` }}
          />
        )}
        
        {/* Interaction markers */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primary shadow-lg transition-transform duration-200 hover:scale-125 cursor-pointer"
            style={{ left: `${marker.percentage}%` }}
            aria-label={`Interaction at ${formatTime(marker.time)}`}
            onClick={(e) => {
              e.stopPropagation()
              onSeek(marker.time)
            }}
          />
        ))}
        
        {/* Current time indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-primary shadow-lg transform -translate-x-1/2 transition-all duration-150 group-hover:scale-125"
          style={{ left: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
        />
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-white/90 font-mono">
        <span>{formatTime(currentTime)}</span>
        {hoverTime !== null ? (
          <span className="text-primary font-semibold">
            {formatTime(hoverTime)}
          </span>
        ) : (
          <span>{formatTime(duration)}</span>
        )}
      </div>
    </div>
  )
}


