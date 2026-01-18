'use client'

import { useMemo } from 'react'
import type { Interaction } from '@/types/interactive-video.interface'

interface Props {
  interactions: Interaction[]
  onEdit: (interaction: Interaction) => void
  onDelete: (interactionId: string) => void
}

export default function InteractionsList({ interactions, onEdit, onDelete }: Props) {
  const sortedInteractions = useMemo(() => {
    return [...interactions].sort((a, b) => a.startTime - b.startTime)
  }, [interactions])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      quiz: 'Quiz',
      selection: 'Selection'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      quiz: 'bg-blue-100 text-blue-800',
      selection: 'bg-green-100 text-green-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = (interaction: Interaction) => {
    if (confirm(`Are you sure you want to delete this ${interaction.type} interaction?`)) {
      onDelete(interaction.id)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Interactions</h3>
        <p className="text-sm text-gray-600 mt-1">{interactions.length} interaction(s) configured</p>
      </div>

      {interactions.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p>No interactions yet. Click on the timeline to add one.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sortedInteractions.map((interaction) => (
            <div
              key={interaction.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(interaction.type)}`}>
                      {getTypeLabel(interaction.type)}
                    </span>
                    <span className="text-sm font-mono text-gray-600">
                      {formatTime(interaction.startTime)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    {interaction.type === 'quiz' ? (
                      <p className="font-medium">
                        {(interaction as any).question}
                      </p>
                    ) : interaction.type === 'selection' ? (
                      <p className="font-medium">
                        {(interaction as any).task}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEdit(interaction)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(interaction)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


