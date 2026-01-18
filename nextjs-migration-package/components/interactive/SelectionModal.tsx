'use client'

import { useState, useEffect, useMemo } from 'react'
import type { SelectionInteraction } from '@/types/interactive-video.interface'

interface Props {
  interaction: SelectionInteraction
  isOpen: boolean
  isFullscreen?: boolean
  onSubmit: (answers: Record<string, string>) => void
  onContinue: (isCorrect: boolean) => void
  onClose: () => void
}

export default function SelectionModal({ interaction, isOpen, isFullscreen = false, onSubmit, onContinue, onClose }: Props) {
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({})
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedLabels({})
      setSelectedItemId(null)
      setShowFeedback(false)
      setFeedbackMessage('')
      setIsCorrect(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.item-container') && !target.closest('.selection-menu')) {
        setSelectedItemId(null)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const availableLabels = useMemo(() => {
    const usedLabels = Object.values(selectedLabels)
    return interaction.labels.filter(label => !usedLabels.includes(label))
  }, [selectedLabels, interaction.labels])

  const isComplete = useMemo(() => {
    return interaction.items.every(item => selectedLabels[item.id])
  }, [interaction.items, selectedLabels])

  const handleItemClick = (itemId: string) => {
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    } else {
      setSelectedItemId(itemId)
    }
  }

  const handleLabelSelect = (label: string) => {
    if (!selectedItemId) return
    
    // Remove label from previous item if it exists
    const newLabels = { ...selectedLabels }
    Object.keys(newLabels).forEach(key => {
      if (newLabels[key] === label) {
        delete newLabels[key]
      }
    })
    
    // Assign label to selected item
    newLabels[selectedItemId] = label
    setSelectedLabels(newLabels)
    
    // Clear selection and close menu
    setSelectedItemId(null)
  }

  const handleSubmit = () => {
    if (!isComplete) return
    
    // Check if all answers are correct
    const allCorrect = interaction.items.every(item => {
      return selectedLabels[item.id] === item.correctLabel
    })
    
    setIsCorrect(allCorrect)
    
    // Set feedback message
    setFeedbackMessage(allCorrect
      ? (interaction.feedback?.correct || 'Correct! All labels are matched correctly.')
      : (interaction.feedback?.incorrect || 'Some labels are incorrect. Try again!'))
    
    // Show feedback
    setShowFeedback(true)
    
    // Emit submit event with answers
    onSubmit({ ...selectedLabels })
  }

  const handleContinueClick = () => {
    const wasCorrect = isCorrect
    
    // Reset UI state
    setShowFeedback(false)
    setSelectedLabels({})
    setFeedbackMessage('')
    setIsCorrect(false)
    
    // Emit continue event
    onContinue(wasCorrect)
    
    // Close the modal
    handleClose()
  }

  const handleClose = () => {
    setSelectedLabels({})
    setShowFeedback(false)
    setFeedbackMessage('')
    setIsCorrect(false)
    setSelectedItemId(null)
    onClose()
  }

  if (!isOpen) return null

  const containerClass = isFullscreen 
    ? 'fixed z-[9999] w-screen h-screen top-0 left-0 flex items-center justify-center'
    : 'absolute z-50 top-0 left-0 right-0 bottom-88px'

  const panelClass = isFullscreen
    ? 'w-full md:w-[600px] lg:w-[700px] xl:w-[750px]'
    : 'w-full md:w-[600px] lg:w-[700px] xl:w-[750px]'

  return (
    <div className={`flex flex-col md:flex-row items-stretch ${containerClass}`}>
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
          <div className="hidden md:flex flex-1 relative pointer-events-none bg-transparent" />
        </div>
      )}

      {/* Selection panel */}
      <div
        className={`bg-[#0a7ac8]/95 backdrop-blur-md ${panelClass} flex flex-col shadow-2xl relative md:border-l border-white/10 overflow-hidden`}
        role="dialog"
        aria-modal="true"
        style={{ boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)' }}
      >
        {/* Task Header */}
        <div className="p-4 sm:p-6 md:p-8 pb-4 sm:pb-6">
          <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
            {interaction.task}
          </h2>
        </div>

        {/* Feedback Message */}
        {showFeedback ? (
          <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 w-full">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 font-normal leading-relaxed text-center">
                {feedbackMessage}
              </p>
            </div>
          </div>
        ) : (
          /* Selection Content */
          <div className="flex-1 px-4 sm:px-6 md:px-8 overflow-y-auto pb-3 sm:pb-4">
            {/* Images Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              {interaction.items.map((item) => (
                <div key={item.id} className="relative item-container">
                  <div
                    className={`relative w-full aspect-square bg-white/10 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      selectedItemId === item.id 
                        ? 'border-white/90 bg-white/30 shadow-lg ring-4 ring-white/50' 
                        : selectedLabels[item.id] 
                          ? 'border-white/60 bg-white/20 border-solid' 
                          : 'border-white/30 border-dashed hover:border-white/50'
                    }`}
                    onClick={() => handleItemClick(item.id)}
                    role="button"
                    aria-label={`Select label for ${item.imageAlt || item.id}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleItemClick(item.id)
                      }
                    }}
                  >
                    {/* Image */}
                    <div className="absolute inset-0 p-2 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-white/50 text-sm text-center p-4">
                          {item.imageAlt}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Label */}
                    {selectedLabels[item.id] && (
                      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded px-3 py-2 text-center">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                          {selectedLabels[item.id]}
                        </span>
                      </div>
                    )}

                    {/* Selection Menu Dropdown */}
                    {selectedItemId === item.id && (
                      <div
                        className="selection-menu absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                        aria-label="Label selection menu"
                      >
                        <div className="p-2 max-h-48 overflow-y-auto">
                          <p className="text-gray-700 text-xs sm:text-sm font-medium px-2 py-1 mb-1">
                            Select a label:
                          </p>
                          {availableLabels.length > 0 ? (
                            availableLabels.map((label, index) => (
                              <button
                                key={index}
                                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer min-h-[44px] hover:bg-[#0a7ac8] hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0a7ac8] focus:ring-offset-2 text-base sm:text-lg font-semibold text-gray-900 border border-transparent hover:border-white/30"
                                onClick={() => handleLabelSelect(label)}
                                aria-label={`Select ${label}`}
                                role="menuitem"
                              >
                                {label}
                              </button>
                            ))
                          ) : (
                            <button
                              className="w-full text-left px-4 py-3 rounded-lg text-gray-500 text-sm cursor-not-allowed min-h-[44px]"
                              disabled
                              aria-disabled="true"
                            >
                              No labels available
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-4">
              <p className="text-white text-sm sm:text-base font-medium">
                Click on each image to select a label
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 pb-4 sm:pb-6 md:pb-8">
          {!showFeedback ? (
            <button
              disabled={!isComplete}
              className={`w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border ${
                isComplete
                  ? 'bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95'
                  : 'bg-white/70 text-gray-900/50 cursor-not-allowed border-white/20'
              }`}
              onClick={handleSubmit}
            >
              Submit
            </button>
          ) : (
            <button
              className="w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200 backdrop-blur-sm border bg-white/95 text-gray-900 hover:bg-white border-white/30 shadow-lg active:scale-95"
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


