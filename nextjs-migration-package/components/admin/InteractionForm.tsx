'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Interaction, QuizInteraction, SelectionInteraction } from '@/types/interactive-video.interface'

interface Props {
  isOpen: boolean
  interaction?: Interaction | null
  currentTime?: number
  onSave: (interaction: Partial<Interaction>) => void
  onCancel: () => void
}

interface FormData {
  type: string
  startTime: number
  question: string
  options: Array<{ id: string; label: string }>
  correctAnswer: string
  task: string
  items: Array<{ id: string; imageUrl: string; imageAlt: string; correctLabel: string }>
  labels: string[]
  feedback: {
    correct: string
    incorrect: string
  }
}

export default function InteractionForm({ isOpen, interaction, currentTime = 0, onSave, onCancel }: Props) {
  const editingInteraction = !!interaction

  const [formData, setFormData] = useState<FormData>({
    type: '',
    startTime: currentTime || 0,
    question: '',
    options: [
      { id: 'option-1', label: '' },
      { id: 'option-2', label: '' }
    ],
    correctAnswer: '',
    task: '',
    items: [],
    labels: [],
    feedback: {
      correct: '',
      incorrect: ''
    }
  })

  useEffect(() => {
    if (interaction) {
      setFormData({
        ...interaction,
        startTime: interaction.startTime,
        options: (interaction as QuizInteraction).options || formData.options,
        items: (interaction as SelectionInteraction).items || formData.items,
        labels: (interaction as SelectionInteraction).labels || formData.labels,
        feedback: (interaction as QuizInteraction | SelectionInteraction).feedback || formData.feedback
      } as FormData)
    } else {
      resetForm()
    }
  }, [interaction])

  useEffect(() => {
    if (!editingInteraction && currentTime > 0) {
      setFormData(prev => ({ ...prev, startTime: currentTime }))
    }
  }, [currentTime, editingInteraction])

  const resetForm = () => {
    setFormData({
      type: '',
      startTime: currentTime || 0,
      question: '',
      options: [
        { id: 'option-1', label: '' },
        { id: 'option-2', label: '' }
      ],
      correctAnswer: '',
      task: '',
      items: [],
      labels: [],
      feedback: {
        correct: '',
        incorrect: ''
      }
    })
  }

  const addOption = () => {
    const newId = `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, label: '' }]
    }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const removedOption = formData.options[index]
      setFormData(prev => {
        const newOptions = prev.options.filter((_, i) => i !== index)
        return {
          ...prev,
          options: newOptions,
          correctAnswer: prev.correctAnswer === removedOption?.id ? '' : prev.correctAnswer
        }
      })
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: '',
        imageAlt: '',
        correctLabel: ''
      }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const addLabel = () => {
    setFormData(prev => ({
      ...prev,
      labels: [...prev.labels, '']
    }))
  }

  const removeLabel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index)
    }))
  }

  const isValid = useMemo(() => {
    if (!formData.type || formData.startTime === null || formData.startTime === undefined) {
      return false
    }
    
    if (formData.startTime < 0) {
      return false
    }
    
    if (formData.type === 'quiz') {
      return formData.question && 
             formData.options.length >= 2 &&
             formData.options.every(opt => opt.label) &&
             formData.correctAnswer
    }
    
    if (formData.type === 'selection') {
      return formData.task &&
             formData.items.length > 0 &&
             formData.labels.length > 0 &&
             formData.items.every(item => item.correctLabel)
    }
    
    return false
  }, [formData])

  const handleSave = () => {
    if (!isValid) return
    
    const interactionTime = formData.startTime
    const interaction: Partial<Interaction> = {
      type: formData.type as 'quiz' | 'selection',
      startTime: interactionTime,
      endTime: interactionTime,
    }
    
    if (formData.type === 'quiz') {
      Object.assign(interaction, {
        question: formData.question,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        feedback: formData.feedback
      })
    } else if (formData.type === 'selection') {
      Object.assign(interaction, {
        task: formData.task,
        items: formData.items.map((item, index) => ({
          id: item.id || `item-${index}`,
          imageUrl: item.imageUrl,
          imageAlt: item.imageAlt,
          correctLabel: item.correctLabel
        })),
        labels: formData.labels.filter(l => l),
        feedback: formData.feedback
      })
    }
    
    if (editingInteraction && interaction) {
      interaction.id = interaction.id
    }
    
    onSave(interaction)
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingInteraction ? 'Edit Interaction' : 'Add New Interaction'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Interaction Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interaction Type *
            </label>
            <select
              value={formData.type}
              disabled={editingInteraction}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select type...</option>
              <option value="quiz">Quiz (Multiple Choice / True/False)</option>
              <option value="selection">Selection (Label Matching)</option>
            </select>
          </div>

          {/* Time Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time (seconds) - When video is paused at this time, the interaction will appear *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">This is the timestamp where the interaction will appear when the video is paused.</p>
          </div>

          {/* Quiz Form */}
          {formData.type === 'quiz' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                {formData.options.map((option, index) => (
                  <div key={index} className="mb-3 flex items-center gap-3">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...formData.options]
                        newOptions[index].label = e.target.value
                        setFormData(prev => ({ ...prev, options: newOptions }))
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    <input
                      type="radio"
                      value={option.id}
                      checked={formData.correctAnswer === option.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="text-sm text-gray-600">Correct</span>
                    {formData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  type="button"
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  + Add Option
                </button>
              </div>

              {/* Feedback */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Feedback
                  </label>
                  <input
                    type="text"
                    value={formData.feedback.correct}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      feedback: { ...prev.feedback, correct: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Great job!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incorrect Feedback
                  </label>
                  <input
                    type="text"
                    value={formData.feedback.incorrect}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      feedback: { ...prev.feedback, incorrect: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Try again!"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selection Form */}
          {formData.type === 'selection' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Description *
                </label>
                <textarea
                  value={formData.task}
                  onChange={(e) => setFormData(prev => ({ ...prev, task: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Select the correct label for each item..."
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items *
                </label>
                {formData.items.map((item, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input
                        type="text"
                        value={item.imageUrl}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].imageUrl = e.target.value
                          setFormData(prev => ({ ...prev, items: newItems }))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        placeholder="Image URL"
                      />
                      <input
                        type="text"
                        value={item.imageAlt}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].imageAlt = e.target.value
                          setFormData(prev => ({ ...prev, items: newItems }))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        placeholder="Image Alt Text"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Correct Label:</label>
                      <select
                        value={item.correctLabel}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].correctLabel = e.target.value
                          setFormData(prev => ({ ...prev, items: newItems }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        <option value="">Select label...</option>
                        {formData.labels.map((label, labelIndex) => (
                          <option key={labelIndex} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeItem(index)}
                        type="button"
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  type="button"
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  + Add Item
                </button>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Labels *
                </label>
                {formData.labels.map((label, index) => (
                  <div key={index} className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => {
                        const newLabels = [...formData.labels]
                        newLabels[index] = e.target.value
                        setFormData(prev => ({ ...prev, labels: newLabels }))
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={`Label ${index + 1}`}
                    />
                    <button
                      onClick={() => removeLabel(index)}
                      type="button"
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLabel}
                  type="button"
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  + Add Label
                </button>
              </div>

              {/* Feedback */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Feedback
                  </label>
                  <input
                    type="text"
                    value={formData.feedback.correct}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      feedback: { ...prev.feedback, correct: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incorrect Feedback
                  </label>
                  <input
                    type="text"
                    value={formData.feedback.incorrect}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      feedback: { ...prev.feedback, incorrect: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingInteraction ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}


