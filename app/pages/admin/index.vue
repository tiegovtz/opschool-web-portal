<template>
  <NuxtLayout name="home-layout">
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p class="text-gray-600 mt-2">Manage your content and system settings</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Video Interactions Manager -->
          <NuxtLink
            to="/admin/video-interactions"
            class="group bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary"
          >
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  Video Interactions
                </h3>
                <p class="text-sm text-gray-600 mt-1">Manage interactive quizzes and interactions for videos</p>
              </div>
            </div>
            <div class="flex items-center text-primary font-medium text-sm">
              <span>Manage Videos</span>
              <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </NuxtLink>

          <!-- Add more admin sections here as needed -->
          <!-- Example: User Management, Content Management, etc. -->
        </div>

        <!-- Quick Stats -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Videos</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalVideos }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Videos with Interactions</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ videosWithInteractions }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Interactions</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalInteractions }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
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

const totalVideos = ref(0)
const videosWithInteractions = ref(0)
const totalInteractions = ref(0)

const loadStats = async () => {
  try {
    // Load all videos
    const response = await $fetch(apiDocs.videos.getPublicVideo, {
      method: 'GET',
      params: {
        limit: 1000
      }
    })

    const videos = Array.isArray(response) 
      ? response 
      : (response as any)?.data || []

    totalVideos.value = videos.filter((v: any) => !v.isDeleted).length

    // Count videos with interactions
    let withInteractions = 0
    let totalInteractionsCount = 0

    for (const video of videos) {
      const videoId = video._id || video.id
      if (!videoId) continue

      try {
        const interactions = await $fetch(`/api/videos/${videoId}/interactions`)
        const count = Array.isArray(interactions) ? interactions.length : 0
        if (count > 0) {
          withInteractions++
          totalInteractionsCount += count
        }
      } catch (error) {
        // Video has no interactions
      }
    }

    videosWithInteractions.value = withInteractions
    totalInteractions.value = totalInteractionsCount
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

onMounted(() => {
  loadStats()
})

useHead({
  title: 'Admin Dashboard - TIE',
  meta: [
    {
      name: 'description',
      content: 'Admin dashboard for managing content and system settings'
    }
  ]
})
</script>




























