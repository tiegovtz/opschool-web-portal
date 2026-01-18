'use client'

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useInteractiveVideo } from '@/lib/hooks/useInteractiveVideo'
import VideoTimeline from './VideoTimeline'
import QuizModal from './QuizModal'
import SelectionModal from './SelectionModal'
import type { Interaction, QuizInteraction, SelectionInteraction } from '@/types/interactive-video.interface'

interface Props {
  videoSrc: string
  interactions: Interaction[]
  onQuizSubmit?: (interaction: QuizInteraction, answer: string) => void
  onSelectionSubmit?: (interaction: SelectionInteraction, answers: Record<string, string>) => void
}

export interface InteractiveVideoRef {
  triggerQuiz: (quizId?: string) => void
  getDuration: () => number
  getCurrentTime: () => number
  videoRef: React.RefObject<HTMLVideoElement> | null
}

const InteractiveVideo = forwardRef<InteractiveVideoRef, Props>(
  ({ videoSrc, interactions, onQuizSubmit, onSelectionSubmit }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const videoState = useInteractiveVideo(interactions)
    const [activeQuiz, setActiveQuiz] = useState<QuizInteraction | null>(null)
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
    const [activeSelection, setActiveSelection] = useState<SelectionInteraction | null>(null)
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const answeredIdsRef = useRef<Set<string>>(new Set())
    const quizPauseTimeRef = useRef<number>(0)
    const selectionPauseTimeRef = useRef<number>(0)

    const formatTime = useCallback((seconds: number): string => {
      if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [])

    const startControlsTimer = useCallback(() => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
      if (!isQuizModalOpen && !isSelectionModalOpen) {
        controlsTimerRef.current = setTimeout(() => {
          if (!videoRef.current?.paused) {
            setShowControls(false)
          }
        }, 3000)
      }
    }, [isQuizModalOpen, isSelectionModalOpen])

    const resetControlsTimer = useCallback(() => {
      setShowControls(true)
      startControlsTimer()
    }, [startControlsTimer])

    const handleTimeUpdate = useCallback(() => {
      if (!videoRef.current) return
      const currentTime = videoRef.current.currentTime
      videoState.updateTime(currentTime)

      const INTERACTION_THRESHOLD = 0.5

      // Check for quiz interactions
      const quizInteraction = interactions.find(
        (interaction) => 
          interaction.type === 'quiz' && 
          !answeredIdsRef.current.has(interaction.id) &&
          Math.abs(currentTime - interaction.startTime) <= INTERACTION_THRESHOLD
      ) as QuizInteraction | undefined

      if (quizInteraction && !isQuizModalOpen && activeQuiz?.id !== quizInteraction.id) {
        setActiveQuiz(quizInteraction)
        setIsQuizModalOpen(true)
        if (videoRef.current) {
          quizPauseTimeRef.current = videoRef.current.currentTime
          if (!videoRef.current.paused) {
            videoRef.current.pause()
          }
        }
      }

      if (activeQuiz && !quizInteraction) {
        const timeDiff = Math.abs(currentTime - activeQuiz.startTime)
        if (timeDiff > INTERACTION_THRESHOLD) {
          setIsQuizModalOpen(false)
          setActiveQuiz(null)
        }
      }

      // Check for selection interactions
      const selectionInteraction = interactions.find(
        (interaction) => 
          interaction.type === 'selection' && 
          !answeredIdsRef.current.has(interaction.id) &&
          Math.abs(currentTime - interaction.startTime) <= INTERACTION_THRESHOLD
      ) as SelectionInteraction | undefined

      if (selectionInteraction && !isSelectionModalOpen && activeSelection?.id !== selectionInteraction.id) {
        setActiveSelection(selectionInteraction)
        setIsSelectionModalOpen(true)
        if (videoRef.current) {
          selectionPauseTimeRef.current = videoRef.current.currentTime
          if (!videoRef.current.paused) {
            videoRef.current.pause()
          }
        }
      }

      if (activeSelection && !selectionInteraction) {
        const timeDiff = Math.abs(currentTime - activeSelection.startTime)
        if (timeDiff > INTERACTION_THRESHOLD) {
          setIsSelectionModalOpen(false)
          setActiveSelection(null)
        }
      }
    }, [interactions, isQuizModalOpen, activeQuiz, isSelectionModalOpen, activeSelection, videoState])

    const handleLoadedMetadata = useCallback(() => {
      if (!videoRef.current) return
      videoState.setDuration(videoRef.current.duration)
      
      const initialQuiz = videoState.activeInteractions.find(
        (interaction) => interaction.type === 'quiz' && interaction.startTime === 0
      ) as QuizInteraction | undefined
      
      if (initialQuiz && !isQuizModalOpen) {
        setActiveQuiz(initialQuiz)
        setIsQuizModalOpen(true)
        if (videoRef.current) {
          videoRef.current.pause()
        }
      }
    }, [videoState, isQuizModalOpen])

    const handleVideoClick = useCallback(() => {
      if (!videoRef.current) return
      videoState.togglePlay(videoRef.current)
    }, [videoState])

    const handlePlay = useCallback(() => {
      videoState.setIsPlaying(true)
    }, [videoState])

    const handlePause = useCallback(() => {
      videoState.setIsPlaying(false)
      if (videoRef.current) {
        setTimeout(() => handleTimeUpdate(), 0)
      }
    }, [videoState, handleTimeUpdate])

    const handleSeek = useCallback((time: number) => {
      if (!videoRef.current) return
      videoState.seekTo(time, videoRef.current)
      setTimeout(() => handleTimeUpdate(), 0)
    }, [videoState, handleTimeUpdate])

    const handleQuizSubmit = useCallback((answer: string, isCorrect: boolean) => {
      if (!activeQuiz) return
      onQuizSubmit?.(activeQuiz, answer)
    }, [activeQuiz, onQuizSubmit])

    const handleQuizContinue = useCallback((isCorrect: boolean) => {
      if (!videoRef.current || !activeQuiz) return
      
      answeredIdsRef.current.add(activeQuiz.id)
      setIsQuizModalOpen(false)
      const quizId = activeQuiz.id
      setActiveQuiz(null)
      
      if (isCorrect === true) {
        const resumeTime = quizPauseTimeRef.current > 0 ? quizPauseTimeRef.current : videoRef.current.currentTime
        const quizInteraction = interactions.find(i => i.id === quizId && i.type === 'quiz') as QuizInteraction | undefined
        const quizEndTime = quizInteraction?.endTime || resumeTime
        const skipTime = Math.max(resumeTime, quizEndTime + 0.5)
        videoRef.current.currentTime = skipTime
        videoRef.current.play().catch(e => {
          console.error('Failed to resume video:', e)
          setTimeout(() => {
            videoRef.current?.play().catch(err => console.error('Retry failed:', err))
          }, 200)
        })
      } else if (isCorrect === false) {
        const sortedInteractions = [...interactions].sort((a, b) => a.startTime - b.startTime)
        const currentInteraction = sortedInteractions.find(i => i.id === quizId)
        const currentIndex = currentInteraction ? sortedInteractions.indexOf(currentInteraction) : -1
        let previousInteraction = null
        if (currentIndex > 0) {
          previousInteraction = sortedInteractions[currentIndex - 1]
        }
        answeredIdsRef.current.delete(quizId)
        
        if (previousInteraction) {
          const jumpTime = previousInteraction.endTime + 1
          videoRef.current.currentTime = jumpTime
        } else {
          videoRef.current.currentTime = 0
        }
        
        videoRef.current.play().catch(e => {
          console.error('Failed to resume video:', e)
          setTimeout(() => {
            videoRef.current?.play().catch(err => console.error('Retry failed:', err))
          }, 200)
        })
      }
      
      quizPauseTimeRef.current = 0
    }, [activeQuiz, interactions])

    const handleQuizClose = useCallback(() => {
      setIsQuizModalOpen(false)
      setActiveQuiz(null)
      quizPauseTimeRef.current = 0
    }, [])

    const handleSelectionSubmit = useCallback((answers: Record<string, string>) => {
      if (!activeSelection) return
      onSelectionSubmit?.(activeSelection, answers)
    }, [activeSelection, onSelectionSubmit])

    const handleSelectionContinue = useCallback((isCorrect: boolean) => {
      if (!videoRef.current || !activeSelection) return
      
      answeredIdsRef.current.add(activeSelection.id)
      setIsSelectionModalOpen(false)
      const interactionId = activeSelection.id
      setActiveSelection(null)
      
      if (isCorrect === true) {
        const resumeTime = selectionPauseTimeRef.current > 0 ? selectionPauseTimeRef.current : videoRef.current.currentTime
        const interaction = interactions.find(i => i.id === interactionId && i.type === 'selection') as SelectionInteraction | undefined
        const endTime = interaction?.endTime || resumeTime
        const skipTime = Math.max(resumeTime, endTime + 0.5)
        videoRef.current.currentTime = skipTime
        videoRef.current.play().catch(e => {
          console.error('Failed to resume video:', e)
          setTimeout(() => {
            videoRef.current?.play().catch(err => console.error('Retry failed:', err))
          }, 200)
        })
      } else if (isCorrect === false) {
        const sortedInteractions = [...interactions].sort((a, b) => a.startTime - b.startTime)
        const currentInteraction = sortedInteractions.find(i => i.id === interactionId)
        const currentIndex = currentInteraction ? sortedInteractions.indexOf(currentInteraction) : -1
        let previousInteraction = null
        if (currentIndex > 0) {
          previousInteraction = sortedInteractions[currentIndex - 1]
        }
        answeredIdsRef.current.delete(interactionId)
        
        if (previousInteraction) {
          const jumpTime = previousInteraction.endTime + 1
          videoRef.current.currentTime = jumpTime
        } else {
          videoRef.current.currentTime = 0
        }
        
        videoRef.current.play().catch(e => {
          console.error('Failed to resume video:', e)
          setTimeout(() => {
            videoRef.current?.play().catch(err => console.error('Retry failed:', err))
          }, 200)
        })
      }
      
      selectionPauseTimeRef.current = 0
    }, [activeSelection, interactions])

    const handleSelectionClose = useCallback(() => {
      setIsSelectionModalOpen(false)
      setActiveSelection(null)
      selectionPauseTimeRef.current = 0
    }, [])

    const triggerQuiz = useCallback((quizId?: string) => {
      const quizToShow = quizId 
        ? interactions.find(i => i.id === quizId && i.type === 'quiz') as QuizInteraction | undefined
        : interactions.find(i => i.type === 'quiz') as QuizInteraction | undefined
      
      if (quizToShow) {
        setActiveQuiz(quizToShow)
        setIsQuizModalOpen(true)
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause()
        }
      }
    }, [interactions])

    useImperativeHandle(ref, () => ({
      triggerQuiz,
      getDuration: () => videoState.duration,
      getCurrentTime: () => videoState.currentTime,
      videoRef
    }), [videoState.duration, videoState.currentTime, triggerQuiz])

    const toggleFullscreen = useCallback(async () => {
      if (!containerRef.current) return

      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (error) {
        console.error('Error toggling fullscreen:', error)
      }
    }, [])

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
      setIsFullscreen(!!document.fullscreenElement)
      startControlsTimer()

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
      }
    }, [startControlsTimer])

    // Watch for video source changes
    useEffect(() => {
      if (videoRef.current && videoSrc) {
        videoRef.current.load()
      }
    }, [videoSrc])

    // Watch for interactions changes
    useEffect(() => {
      if (videoRef.current && videoRef.current.paused) {
        handleTimeUpdate()
      }
    }, [interactions, handleTimeUpdate])

    return (
      <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          preload="auto"
          aria-label="Interactive educational video with quizzes"
          aria-describedby="video-description"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={handleVideoClick}
          onPlay={handlePlay}
          onPause={handlePause}
          onMouseEnter={resetControlsTimer}
          onMouseMove={resetControlsTimer}
          onMouseLeave={startControlsTimer}
          onContextMenu={(e) => e.preventDefault()}
          crossOrigin="use-credentials"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div id="video-description" className="sr-only">
          Interactive video player with embedded quizzes. Quizzes will appear at specific timestamps during playback.
        </div>

        {/* Play/Pause Button Overlay */}
        {!videoState.isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all duration-300 z-20 group"
            onClick={handleVideoClick}
            aria-label="Play video"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75" />
              <div className="relative w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Timeline Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            showControls || isQuizModalOpen || isSelectionModalOpen ? 'opacity-100' : 'opacity-0'
          }`}
          role="toolbar"
          aria-label="Video player controls"
          onMouseEnter={resetControlsTimer}
          onMouseLeave={startControlsTimer}
        >
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              className="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
              aria-label={videoState.isPlaying ? 'Pause video' : 'Play video'}
              aria-pressed={videoState.isPlaying}
              onClick={handleVideoClick}
            >
              {!videoState.isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              )}
            </button>
            
            {/* Time Display */}
            <span className="text-white text-sm font-mono min-w-[45px]" aria-label="Current time">
              {formatTime(videoState.currentTime)}
            </span>
            
            {/* Progress Bar */}
            <div 
              className="flex-1 min-w-0" 
              role="progressbar" 
              aria-valuenow={videoState.currentTime} 
              aria-valuemin={0} 
              aria-valuemax={videoState.duration} 
              aria-label={`Video progress: ${Math.round((videoState.currentTime / videoState.duration) * 100)}%`}
            >
              <VideoTimeline
                currentTime={videoState.currentTime || 0}
                duration={videoState.duration || 0}
                markers={videoState.timelineMarkers || []}
                onSeek={handleSeek}
              />
            </div>
            
            <span className="text-white text-sm font-mono min-w-[45px] text-right" aria-label="Total duration">
              {formatTime(videoState.duration)}
            </span>
            
            {/* Fullscreen Button */}
            <button
              className="flex-shrink-0 p-2.5 text-white hover:bg-white/25 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm bg-white/10"
              aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {!isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Quiz Modal */}
        {activeQuiz && isQuizModalOpen && (
          <QuizModal
            quiz={activeQuiz}
            isOpen={isQuizModalOpen}
            isFullscreen={isFullscreen}
            onSubmit={handleQuizSubmit}
            onContinue={handleQuizContinue}
            onClose={handleQuizClose}
          />
        )}
        
        {/* Selection Modal */}
        {activeSelection && isSelectionModalOpen && (
          <SelectionModal
            interaction={activeSelection}
            isOpen={isSelectionModalOpen}
            isFullscreen={isFullscreen}
            onSubmit={handleSelectionSubmit}
            onContinue={handleSelectionContinue}
            onClose={handleSelectionClose}
          />
        )}
      </div>
    )
  }
)

InteractiveVideo.displayName = 'InteractiveVideo'

export default InteractiveVideo


