'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getVideos, type Video } from '@/lib/api/videos'

export default function VideoInteractionsListPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      setIsLoading(true)
      const data = await getVideos(1000)
      setVideos(data)
    } catch (error) {
      console.error('Error loading videos:', error)
      alert('Failed to load videos. Please check your API configuration.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const title = (video.title || video.name || '').toLowerCase()
    const subject = typeof video.subject === 'string' 
      ? video.subject.toLowerCase() 
      : (video.subject?.name || '').toLowerCase()
    const level = typeof video.educationLevel === 'string'
      ? video.educationLevel.toLowerCase()
      : (video.educationLevel?.name || '').toLowerCase()
    
    return title.includes(query) || subject.includes(query) || level.includes(query)
  })

  const handleVideoClick = (video: Video) => {
    const videoId = video._id || video.id
    if (videoId) {
      router.push(`/video-interactions/${videoId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Interactions Management</h1>
          <p className="text-gray-600">Select a video to manage its interactions</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search videos by title, subject, or level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Videos List */}
        {filteredVideos.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">
              {searchQuery ? 'No videos found matching your search.' : 'No videos available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => {
              const videoId = video._id || video.id
              const title = video.title || video.name || 'Untitled Video'
              const subject = typeof video.subject === 'string' 
                ? video.subject 
                : video.subject?.name || 'Unknown Subject'
              const level = typeof video.educationLevel === 'string'
                ? video.educationLevel
                : video.educationLevel?.name || 'Unknown Level'

              return (
                <div
                  key={videoId}
                  onClick={() => handleVideoClick(video)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {title}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Subject:</span> {subject}</p>
                    <p><span className="font-medium">Level:</span> {level}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-primary text-sm font-medium">Manage Interactions →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


