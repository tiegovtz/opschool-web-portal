<template>
  <NuxtLayout name="home-layout">
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">10 Videos Accessible via API</h1>
          
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

          <!-- Videos List -->
          <div v-else-if="videos.length > 0" class="space-y-4">
            <div 
              v-for="(video, index) in videos.slice(0, 10)" 
              :key="video._id || video.id || index"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                      {{ index + 1 }}
                    </span>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ video.title || video.name || 'Untitled Video' }}
                    </h3>
                  </div>
                  
                  <div class="ml-11 space-y-1 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">ID:</span>
                      <code class="bg-gray-100 px-2 py-1 rounded text-xs">{{ video._id || video.id }}</code>
                    </div>
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
                    <div class="flex items-center gap-2">
                      <span class="font-medium">Access URL:</span>
                      <code class="bg-gray-100 px-2 py-1 rounded text-xs">/api/video/{{ video._id || video.id }}</code>
                    </div>
                  </div>
                </div>
                
                <div class="ml-4">
                  <NuxtLink
                    :to="`/interactive-video?videoId=${video._id || video.id}`"
                    class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                  >
                    Use in Player
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- No Videos -->
          <div v-else class="text-center py-12">
            <p class="text-gray-600">No videos found.</p>
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

const fetchVideos = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await $fetch(apiDocs.videos.getPublicVideo, {
      method: 'GET',
      params: {
        videoType: 'Conceptual',
        limit: 10
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

  } catch (err: any) {
    console.error('Error fetching videos:', err)
    error.value = err.message || 'Failed to load videos'
    videos.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchVideos()
})

useHead({
  title: 'Available Videos - TIE',
  meta: [
    {
      name: 'description',
      content: 'List of videos accessible via the API for interactive video player'
    }
  ]
})
</script>

