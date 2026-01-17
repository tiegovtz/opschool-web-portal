'use client'

import { useState, useEffect } from 'react'
import type { QuizInteraction } from '@/types/interactive-video.interface'

interface Props {
  quiz: QuizInteraction
  isOpen: boolean
  isFullscreen?: boolean
  onSubmit: (answer: string, isCorrect: boolean) => void
  onContinue: (isCorrect: boolean) => void
  onClose: () => void
}

export default function QuizModal({ quiz, isOpen, isFullscreen = false, onSubmit, onContinue, onClose }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedAnswer(null)
      setShowFeedback(false)
      setFeedbackMessage('')
      setIsCorrect(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelectAnswer = (answerId: string) => {
    setSelectedAnswer(answerId)
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return
    
    // Check if answer is correct
    const correct = selectedAnswer === quiz.correctAnswer
    setIsCorrect(correct)
    
    // Set feedback message
    setFeedbackMessage(correct 
      ? (quiz.feedback?.correct || 'Correct!')
      : (quiz.feedback?.incorrect || 'Incorrect. Try again!'))
    
    // Show feedback
    setShowFeedback(true)
    
    // Emit submit event with correctness
    onSubmit(selectedAnswer, correct)
  }

  const handleContinueClick = () => {
    // Store correctness before resetting
    const wasCorrect = isCorrect
    
    // Reset UI state
    setShowFeedback(false)
    setSelectedAnswer(null)
    setFeedbackMessage('')
    setIsCorrect(false)
    
    // Emit continue event with correctness
    onContinue(wasCorrect)
    
    // Close the modal
    handleClose()
  }

  const handleClose = () => {
    setSelectedAnswer(null)
    setShowFeedback(false)
    setFeedbackMessage('')
    setIsCorrect(false)
    onClose()
  }

  if (!isOpen) return null

  const containerClass = isFullscreen 
    ? 'fixed z-[9999] w-screen h-screen top-0 left-0 flex items-center justify-center'
    : 'absolute z-50 top-0 left-0 right-0 bottom-88px'

  const panelClass = isFullscreen
    ? 'w-full md:w-[500px] lg:w-[600px] xl:w-[650px]'
    : 'w-full md:w-[500px] lg:w-[600px] xl:w-[650px]'

  return (
    <div className={`flex flex-col md:flex-row items-stretch ${containerClass}`}>
      {/* Fullscreen: Constrain to video aspect ratio container (16:9) */}
      {isFullscreen && (
        <div
          className="flex flex-col md:flex-row items-stretch"
          style={{
            width: 'min(calc(100vh * 16 / 9), 100vw)',
            height: 'min(calc(100vw * 9 / 16), calc(100vh - 80px))',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          {/* Left side - Video area (hidden on mobile, visible on desktop) */}
          <div className="hidden md:flex flex-1 relative pointer-events-none bg-transparent" />
        </div>
      )}

      {/* Quiz panel */}
      <div
        className={`bg-[#0a7ac8]/95 backdrop-blur-md ${panelClass} flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-question"
        style={{ boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)' }}
      >
        {/* Question Header */}
        <div className="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
          <h2 id="quiz-question" className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
            {quiz.question}
          </h2>
        </div>

        {/* Feedback Message (shown after submission) */}
        {showFeedback ? (
          <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center" role="status" aria-live="polite">
                {feedbackMessage}
              </p>
            </div>
          </div>
        ) : (
          /* Options (hidden after submission) */
          <div className="flex-1 px-4 sm:px-6 md:px-8 space-y-2 sm:space-y-3 overflow-y-auto pb-3 sm:pb-4" role="radiogroup" aria-labelledby="quiz-question">
            {quiz.options.map((option, index) => (
              <button
                key={option.id}
                className={`w-full text-left bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50 ${
                  selectedAnswer === option.id
                    ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a7ac8]/50 shadow-lg bg-white'
                    : ''
                }`}
                aria-label={`Option ${String.fromCharCode(65 + index)}: ${option.label.replace(/^[A-Z]\)\s*/, '')}`}
                aria-pressed={selectedAnswer === option.id}
                role="radio"
                tabIndex={0}
                onClick={() => handleSelectAnswer(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectAnswer(option.id)
                  }
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  {/* Letter indicator (A, B, C, D) */}
                  <span className="flex-shrink-0 text-base sm:text-lg md:text-xl font-semibold text-black">
                    {String.fromCharCode(65 + index)}:
                  </span>
                  
                  {/* Option text */}
                  <span className="text-base sm:text-lg md:text-xl text-black flex-1 font-normal leading-tight sm:leading-normal">
                    {option.label}
                  </span>
                  
                  {/* Radio button */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === option.id
                          ? 'border-gray-700 bg-gray-700'
                          : 'border-gray-400 bg-white'
                      }`}
                    >
                      {selectedAnswer === option.id && (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer with Submit/Continue button */}
        <div className="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
          {!showFeedback ? (
            <button
              disabled={!selectedAnswer}
              className={`w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50 ${
                selectedAnswer
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              }`}
              aria-label="Submit your answer"
              onClick={handleSubmit}
            >
              Submit
            </button>
          ) : (
            <button
              className="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#0a7ac8]/50"
              aria-label="Continue watching video"
              onClick={handleContinueClick}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


