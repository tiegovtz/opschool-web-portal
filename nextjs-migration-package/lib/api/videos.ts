// API client for fetching video list
// Update this URL to match your video API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apitie.ekima.africa/v1'

export interface Video {
  _id?: string
  id?: string
  title?: string
  name?: string
  subject?: { name: string } | string
  educationLevel?: { name: string } | string
  videoType?: string
  isDeleted?: boolean
}

export async function getVideos(limit: number = 1000): Promise<Video[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/videos?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch videos')
    }

    const data = await response.json()
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data.filter((v: Video) => !v.isDeleted)
    } else if (data && Array.isArray(data.data)) {
      return data.data.filter((v: Video) => !v.isDeleted)
    } else if (data && data.videos && Array.isArray(data.videos)) {
      return data.videos.filter((v: Video) => !v.isDeleted)
    }
    
    return []
  } catch (error) {
    console.error('Error fetching videos:', error)
    throw error
  }
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  try {
    const videos = await getVideos(1000)
    return videos.find((v: Video) => (v._id || v.id) === videoId) || null
  } catch (error) {
    console.error('Error fetching video by ID:', error)
    return null
  }
}


