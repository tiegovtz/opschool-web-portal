<template>
  <NuxtLayout name="home-layout">
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Video Interactions Manager</h1>
              <p class="text-gray-600 mt-2">Select a video to manage its interactions</p>
            </div>
          </div>
          
          <!-- Search/Filter -->
          <div class="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search videos by title, subject, level, or ID..."
              class="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <select
              v-model="videoTypeFilter"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Video Types</option>
              <option value="Conceptual">Conceptual</option>
              <option value="Practical">Practical</option>
              <option value="Interactive">Interactive</option>
            </select>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p class="text-gray-600">Loading videos...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="flex items-center gap-3 mb-2">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-800 font-semibold">Error loading videos</p>
            </div>
            <p class="text-red-600 text-sm">{{ error }}</p>
            <button 
              @click="fetchVideos"
              class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>

          <!-- Videos Grid -->
          <div v-else-if="filteredVideos.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              v-for="video in filteredVideos" 
              :key="video._id || video.id"
              class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    {{ video.title || video.name || 'Untitled Video' }}
                  </h3>
                  
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">Subject:</span>
                      <span>{{ video.subject?.name || video.subject || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">Level:</span>
                      <span>{{ video.educationLevel?.name || video.educationLevel || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">Type:</span>
                      <span>{{ video.videoType || 'N/A' }}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="font-medium">Interactions:</span>
                      <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                        {{ getInteractionCount(video._id || video.id) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex gap-2">
                <NuxtLink
                  :to="`/admin/video-interactions/${video._id || video.id}`"
                  class="flex-1 text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                >
                  Manage Interactions
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- No Videos -->
          <div v-else class="text-center py-12">
            <p class="text-gray-600">{{ searchQuery ? 'No videos match your search.' : 'No videos found.' }}</p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import apiDocs from '~/utilities/apiDocs'

definePageMeta({
  middleware: 'auth',
  ssr: false
})

const videos = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const videoTypeFilter = ref('')
const interactionCounts = ref<Record<string, number>>({})

const fetchVideos = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await $fetch(apiDocs.videos.getPublicVideo, {
      method: 'GET',
      params: {
        limit: 1000  // Get all videos, not just Conceptual
      }
    })

    // Handle different response formats
    if (Array.isArray(response)) {
      videos.value = response
    } else if (response && Array.isArray(response.data)) {
      videos.value = response.data
    } else if (response && response.videos && Array.isArray(response.videos)) {
      videos.value = response.videos
    } else {
      videos.value = []
    }

    // Filter out deleted videos
    videos.value = videos.value.filter((v: any) => !v.isDeleted)
    
    // Load interaction counts
    await loadInteractionCounts()

  } catch (err: any) {
    console.error('Error fetching videos:', err)
    error.value = err.message || 'Failed to load videos'
    videos.value = []
  } finally {
    isLoading.value = false
  }
}

const loadInteractionCounts = async () => {
  for (const video of videos.value) {
    const videoId = video._id || video.id
    if (!videoId) continue
    
    try {
      const interactions = await $fetch(`/api/videos/${videoId}/interactions`)
      interactionCounts.value[videoId] = Array.isArray(interactions) ? interactions.length : 0
    } catch (error) {
      interactionCounts.value[videoId] = 0
    }
  }
}

const getInteractionCount = (videoId: string): number => {
  return interactionCounts.value[videoId] || 0
}

const filteredVideos = computed(() => {
  let filtered = videos.value
  
  // Filter by video type
  if (videoTypeFilter.value) {
    filtered = filtered.filter((video: any) => 
      (video.videoType || '').toLowerCase() === videoTypeFilter.value.toLowerCase()
    )
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((video: any) => {
      const title = (video.title || video.name || '').toLowerCase()
      const subject = (video.subject?.name || video.subject || '').toLowerCase()
      const level = (video.educationLevel?.name || video.educationLevel || '').toLowerCase()
      const videoId = (video._id || video.id || '').toLowerCase()
      
      return title.includes(query) || 
             subject.includes(query) || 
             level.includes(query) ||
             videoId.includes(query)
    })
  }
  
  return filtered
})

onMounted(() => {
  fetchVideos()
})

useHead({
  title: 'Video Interactions Manager - TIE',
  meta: [
    {
      name: 'description',
      content: 'Manage interactive video interactions'
    }
  ]
})
</script>

