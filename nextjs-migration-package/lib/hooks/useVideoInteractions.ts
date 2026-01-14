import { useState, useEffect, useCallback } from 'react'
import type { Interaction } from '@/types/interactive-video.interface'

export const useVideoInteractions = (videoId: string | null | undefined) => {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInteractions = useCallback(async () => {
    if (!videoId) {
      setInteractions([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/videos/${videoId}/interactions`)
      if (!response.ok) {
        throw new Error('Failed to load interactions')
      }
      const data = await response.json()
      setInteractions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error loading interactions:', err)
      setError(err.message || 'Failed to load interactions')
      setInteractions([])
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  const refresh = useCallback(async () => {
    await loadInteractions()
  }, [loadInteractions])

  // Auto-load when videoId changes
  useEffect(() => {
    if (videoId) {
      loadInteractions()
    } else {
      setInteractions([])
    }
  }, [videoId, loadInteractions])

  return {
    interactions,
    isLoading,
    error,
    loadInteractions,
    refresh
  }
}


