<template>
  <ClientOnly>
    <NuxtLayout name="home-layout">
      <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-primary">Interactive Learning</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Interactive Video Player
            </h1>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
              Engage with interactive hotspots and quizzes as you learn
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 p-12">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p class="text-gray-600">Loading video from topic...</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-red-200 p-12">
            <div class="text-center">
              <div class="inline-block w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <p class="text-red-600 font-semibold mb-2">Error loading video</p>
              <p class="text-gray-600 text-sm mb-4">{{ error }}</p>
              
              <!-- Show login link if authentication error -->
              <div v-if="error.includes('Authentication') || error.includes('login')" class="mb-4">
                <NuxtLink 
                  to="/auth"
                  class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  Go to Login Page
                </NuxtLink>
              </div>
              
              <!-- Retry button for other errors -->
              <button 
                v-else
                @click="fetchVideoFromTopic"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Retry
              </button>
            </div>
          </div>

          <!-- Video Container -->
          <div v-else class="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200">
            <div v-if="!videoSrc || videoSrc === '/videos/TestVideo.mp4'" class="p-12 text-center">
              <p class="text-gray-600 mb-4">No video source available</p>
              <p class="text-sm text-gray-500">Video source: {{ videoSrc }}</p>
            </div>
            <InteractiveVideo
              v-else
              ref="videoPlayerRef"
              :video-src="videoSrc"
              :interactions="interactions"
              @hotspot-click="handleHotspotClick"
              @quiz-submit="handleQuizSubmit"
              @selection-submit="handleSelectionSubmit"
            />
          </div>

          <!-- Interaction Summary Card -->
          <div v-if="hotspotClicks.length > 0 || quizResults.length > 0" 
               class="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">Your Progress</h2>
            </div>
          
          <div v-if="hotspotClicks.length > 0" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Hotspot Clicks</h3>
            <ul class="space-y-2">
              <li
                v-for="(click, index) in hotspotClicks"
                :key="`hotspot-${index}`"
                class="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span class="font-medium">{{ click.interaction.title || 'Hotspot' }}</span>
                <span class="text-gray-600 ml-2">
                  at {{ formatTime(click.timestamp) }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="quizResults.length > 0">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Quiz Results</h3>
            <ul class="space-y-2">
              <li
                v-for="(result, index) in quizResults"
                :key="`quiz-${index}`"
                :class="[
                  'p-3 rounded-lg border',
                  result.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200',
                ]"
              >
                <div class="font-medium">
                  {{ result.interaction.question }}
                </div>
                <div class="text-sm mt-1">
                  Your answer: {{ result.selectedAnswer }}
                  <span
                    :class="result.isCorrect ? 'text-green-700' : 'text-red-700'"
                    class="ml-2 font-semibold"
                  >
                    ({{ result.isCorrect ? 'Correct' : 'Incorrect' }})
                  </span>
                </div>
                <span class="text-xs text-gray-500 block mt-1">
                  at {{ formatTime(result.timestamp) }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </NuxtLayout>
    <template #fallback>
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <p class="text-gray-600">Loading interactive video player...</p>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import InteractiveVideo from '~/components/interactive/InteractiveVideo.vue'
import type { HotspotInteraction, QuizInteraction, SelectionInteraction } from '~/types/interactive-video.interface'
import { isTokenExpiringSoon, refreshToken } from '~/utilities/jwToken'

// Ensure this page is client-side only and requires authentication
definePageMeta({
  ssr: false,
  middleware: 'auth'
})

// Define meta info about page
useHead({
  title: "Interactive Video Player - TIE",
  meta: [
    {
      name: 'description',
      content: 'Interactive video player with hotspots and quizzes for enhanced learning experience.'
    },
  ]
})

// Video source - fetch from the interactive topic route
const route = useRoute()
const videoSrc = ref<string>('/videos/TestVideo.mp4')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Extract video ID or topic URL from query parameters
const videoId = computed(() => route.query.videoId as string | undefined)
const videoUrl = computed(() => route.query.video as string | undefined)
const topicUrl = computed(() => {
  // If URL is provided in query params, use it
  if (route.query.url) {
    return route.query.url as string
  }
  // Otherwise, try to extract from current route or use default
  return 'http://localhost:3000/interactive/Form%201/Biology/Introduction%20to%20Biology%20/680e2ba64750cdf4e8ed331b'
})

// Function to extract video URL from chapter content
const extractVideoUrl = (content: string): string | null => {
  if (!content) return null
  
  // Regular expression to match <video> tags with a <source> inside
  const regex = /<video\b[^>]*>\s*<source\s+src="([^"]+)"[^>]*>\s*<\/video>/gi
  const match = regex.exec(content)
  
  if (match && match[1]) {
    // Convert the video ID to the API endpoint format
    const videoId = match[1]
    return `/api/video/${videoId}`
  }
  
  return null
}

// Fetch video - either directly from video ID or from topic
const fetchVideo = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Get auth token
    const signInAccessToken = useCookie('signInAccessToken')
    const userToken = useCookie('signInUserToken')
    
    // Check if user is authenticated (middleware should handle this, but double-check)
    if (!signInAccessToken.value || !userToken.value) {
      // Redirect to auth page if not authenticated
      await navigateTo('/auth')
      return
    }
    
    // Ensure token is valid and refresh if needed
    if (isTokenExpiringSoon(signInAccessToken.value, 60)) {
      const newToken = await refreshToken()
      if (newToken?.access_token) {
        signInAccessToken.value = newToken.access_token
      } else {
        await navigateTo('/auth')
        return
      }
    }
    
    // If video ID is provided directly, use it
    if (videoId.value) {
      const videoPath = `/api/video/${videoId.value}`
      videoSrc.value = videoPath
      console.log('Video ID provided:', videoId.value)
      console.log('Video source set to:', videoPath)
      // Wait a bit for the video element to update
      await nextTick()
      isLoading.value = false
      // Force video reload
      await nextTick()
      return
    }
    
    // If video URL is provided directly, use it
    if (videoUrl.value) {
      videoSrc.value = videoUrl.value
      console.log('Video source set to:', videoSrc.value)
      // Wait a bit for the video element to update
      await nextTick()
      isLoading.value = false
      return
    }
    
    // Otherwise, fetch from topic (existing logic)
    await fetchVideoFromTopic()
  } catch (err: any) {
    console.error('Error fetching video:', err)
    error.value = err.message || 'Failed to load video'
    isLoading.value = false
  }
}

// Fetch video from the interactive topic
const fetchVideoFromTopic = async () => {
  try {
    
    // Parse the URL to extract topic ID
    // Handle both full URLs and relative paths
    let topicId: string
    if (topicUrl.value.startsWith('http://') || topicUrl.value.startsWith('https://')) {
      const url = new URL(topicUrl.value)
      const pathParts = url.pathname.split('/').filter(Boolean)
      topicId = pathParts[pathParts.length - 1] // Last part is the topic ID
    } else {
      // If it's already a relative path, extract the ID
      const pathParts = topicUrl.value.split('/').filter(Boolean)
      topicId = pathParts[pathParts.length - 1]
    }
    
    if (!topicId) {
      throw new Error('Could not extract topic ID from URL')
    }
    
    // Fetch chapters for this topic
    const { data: chaptersData, error: chaptersError } = await useFetch(`/api/topics/${topicId}`, {
      headers: {
        Authorization: `Bearer ${signInAccessToken.value}`
      }
    })
    
    if (chaptersError.value) {
      throw new Error(chaptersError.value.message || 'Failed to fetch chapters')
    }
    
    if (!chaptersData.value || !Array.isArray(chaptersData.value) || chaptersData.value.length === 0) {
      throw new Error('No chapters found for this topic')
    }
    
    // Get the first chapter
    const firstChapter = chaptersData.value[0]
    const chapterId = firstChapter._id
    
    if (!chapterId) {
      throw new Error('Chapter ID not found')
    }
    
    // Fetch chapter content
    const { data: chapterData, error: chapterError } = await useFetch(`/api/topics/chapters/${chapterId}`, {
      headers: {
        Authorization: `Bearer ${signInAccessToken.value}`
      }
    })
    
    if (chapterError.value) {
      throw new Error(chapterError.value.message || 'Failed to fetch chapter content')
    }
    
    if (!chapterData.value || !chapterData.value.content) {
      throw new Error('Chapter content not found')
    }
    
    // Extract video URL from chapter content
    const extractedVideoUrl = extractVideoUrl(chapterData.value.content)
    
    if (extractedVideoUrl) {
      videoSrc.value = extractedVideoUrl
    } else {
      throw new Error('No video found in chapter content')
    }
    
  } catch (err: any) {
    console.error('Error fetching video:', err)
    error.value = err.message || 'Failed to load video from topic'
  } finally {
    isLoading.value = false
  }
}

// Fetch video on mount
onMounted(() => {
  fetchVideo()
})

// Interactions - can be loaded from API or passed as props
const interactions = ref([
  {
    id: 'quiz-1',
    type: 'quiz' as const,
    startTime: 57,
    endTime: 62,
    question: 'Before we start, think about this: Imagine a world without the interaction of matter and energy. What would be missing?',
    options: [
      { id: 'option-1', label: 'A) Sunlight' },
      { id: 'option-2', label: 'B) Movement' },
      { id: 'option-3', label: 'C) Electricity' },
      { id: 'option-4', label: 'D) All of the above' },
    ],
    correctAnswer: 'option-4',
    feedback: {
      correct: 'Correct! Without the interaction of matter and energy, the universe as we know it—light, heat, motion—would simply not exist.',
      incorrect: 'Think about how matter and energy interact to create the phenomena we observe. Try again!',
    },
  },
  {
    id: 'selection-1',
    type: 'selection' as const,
    startTime: 174,
    endTime: 179,
    task: 'Select the correct physics label for each natural phenomenon.',
    items: [
      {
        id: 'eclipse',
        imageUrl: '', // Will use placeholder for now
        imageAlt: 'Eclipse',
        correctLabel: 'Light Refraction',
      },
      {
        id: 'sunrise',
        imageUrl: '',
        imageAlt: 'Sunrise',
        correctLabel: 'Light Scattering',
      },
      {
        id: 'rainbow',
        imageUrl: '',
        imageAlt: 'Rainbow',
        correctLabel: 'Light Refraction',
      },
      {
        id: 'volcano',
        imageUrl: '',
        imageAlt: 'Volcano',
        correctLabel: 'Thermal Energy',
      },
    ],
    labels: ['Light Refraction', 'Light Scattering', 'Thermal Energy', 'Gravitational Force'],
    feedback: {
      correct: 'Excellent! You\'ve correctly matched the physics concepts to the natural phenomena.',
      incorrect: 'Some labels don\'t match. Think about the physics behind each phenomenon and try again!',
    },
  },
  {
    id: 'quiz-2',
    type: 'quiz' as const,
    startTime: 200,
    endTime: 205,
    question: 'True or False: Energy can be created or destroyed.',
    options: [
      { id: 'true-option', label: 'True' },
      { id: 'false-option', label: 'False' },
    ],
    correctAnswer: 'false-option',
    feedback: {
      correct: 'Correct! According to the law of conservation of energy, energy cannot be created or destroyed, only transformed from one form to another.',
      incorrect: 'Incorrect. Remember the law of conservation of energy - energy cannot be created or destroyed, only transformed.',
    },
  },
])

const hotspotClicks = ref<Array<{ interaction: HotspotInteraction; timestamp: number }>>([])
const quizResults = ref<
  Array<{
    interaction: QuizInteraction
    selectedAnswer: string
    isCorrect: boolean
    timestamp: number
  }>
>([])

const handleHotspotClick = (interaction: HotspotInteraction) => {
  hotspotClicks.value.push({
    interaction,
    timestamp: Date.now(),
  })
  console.log('Hotspot clicked:', interaction)
}

const handleQuizSubmit = (interaction: QuizInteraction, answer: string) => {
  const isCorrect = answer === interaction.correctAnswer
  quizResults.value.push({
    interaction,
    selectedAnswer: answer,
    isCorrect,
    timestamp: Date.now(),
  })
  console.log('Quiz submitted:', { interaction, answer, isCorrect })
}

const selectionResults = ref<
  Array<{
    interaction: SelectionInteraction
    answers: Record<string, string>
    isCorrect: boolean
    timestamp: number
  }>
>([])

const handleSelectionSubmit = (interaction: SelectionInteraction, answers: Record<string, string>) => {
  // Check if all answers are correct
  const allCorrect = interaction.items.every(item => {
    return answers[item.id] === item.correctLabel
  })
  
  selectionResults.value.push({
    interaction,
    answers,
    isCorrect: allCorrect,
    timestamp: Date.now(),
  })
  console.log('Selection submitted:', { interaction, answers, isCorrect: allCorrect })
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

const videoPlayerRef = ref<InstanceType<typeof InteractiveVideo> | null>(null)
</script>

