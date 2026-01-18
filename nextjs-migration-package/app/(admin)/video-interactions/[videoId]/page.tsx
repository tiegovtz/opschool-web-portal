'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVideoInteractions } from '@/lib/hooks/useVideoInteractions'
import InteractionsList from '@/components/admin/InteractionsList'
import InteractionForm from '@/components/admin/InteractionForm'
import type { Interaction } from '@/types/interactive-video.interface'

export default function VideoInteractionsPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.videoId as string
  
  const { interactions, isLoading, refresh } = useVideoInteractions(videoId)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null)
  const [selectedTime, setSelectedTime] = useState<number>(0)

  const handleAdd = useCallback(() => {
    setEditingInteraction(null)
    setSelectedTime(0)
    setIsFormOpen(true)
  }, [])

  const handleEdit = useCallback((interaction: Interaction) => {
    setEditingInteraction(interaction)
    setSelectedTime(interaction.startTime)
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (interactionId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/interactions/${interactionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete interaction')
      }

      await refresh()
    } catch (error) {
      console.error('Error deleting interaction:', error)
      alert('Failed to delete interaction. Please try again.')
    }
  }, [videoId, refresh])

  const handleSave = useCallback(async (interactionData: Partial<Interaction>) => {
    try {
      const url = editingInteraction
        ? `/api/videos/${videoId}/interactions/${editingInteraction.id}`
        : `/api/videos/${videoId}/interactions`
      
      const method = editingInteraction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interactionData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save interaction')
      }

      await refresh()
      setIsFormOpen(false)
      setEditingInteraction(null)
    } catch (error: any) {
      console.error('Error saving interaction:', error)
      alert(error.message || 'Failed to save interaction. Please try again.')
    }
  }, [videoId, editingInteraction, refresh])

  const handleCancel = useCallback(() => {
    setIsFormOpen(false)
    setEditingInteraction(null)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading interactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary hover:text-primary-dark transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Interactions</h1>
              <p className="mt-2 text-gray-600">Video ID: {videoId}</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Interaction
            </button>
          </div>
        </div>

        {/* Interactions List */}
        <InteractionsList
          interactions={interactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Interaction Form Modal */}
        <InteractionForm
          isOpen={isFormOpen}
          interaction={editingInteraction}
          currentTime={selectedTime}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}


