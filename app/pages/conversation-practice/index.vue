<template>
  <div
    :class="isEmbedded
      ? 'relative w-full h-full p-4'
      : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'"
    @click.self="!isEmbedded && handleOverlayClick"
  >
    <div
      class="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-practice-title"
      @click.stop
    >
      <button
        v-if="!isEmbedded"
        type="button"
        class="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 hover:text-gray-900"
        aria-label="Close conversation practice"
        @click="closeModal"
      >
        <span class="text-xl leading-none">&times;</span>
      </button>
      <div class="max-w-4xl mx-auto">
        <h1
          id="conversation-practice-title"
          class="text-4xl font-bold text-gray-800 mb-2 text-center"
        >
          Conversation Practice
        </h1>
        <!-- <p class="text-gray-600 text-center mb-8">
          Practice conversations with AI using speech-to-text and text-to-speech
        </p> -->

      <div class="bg-white rounded-lg p-6 space-y-6">
        <!-- Voice Settings -->
        <div class="flex flex-col gap-4 mb-4">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">Voice Type:</label>
            <select
              v-model="voiceType"
              class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              :disabled="isPlaying || isRecording || isGeneratingTTS"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700 min-w-[120px]">Playback Speed:</label>
            <input
              v-model.number="playbackSpeed"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              class="flex-1 accent-indigo-600"
              :disabled="!currentAudioUrl || isGeneratingTTS"
              @input="updatePlaybackSpeed"
            />
            <span class="text-sm text-gray-600 min-w-[50px]">{{ playbackSpeed.toFixed(2) }}x</span>
          </div>
        </div>

        <!-- Conversation Preview -->
        <div v-if="!conversationStarted">
          <div class="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p class="font-medium text-gray-800">Conversation preview</p>
            <p v-if="previewLoading" class="text-gray-500">Loading preview...</p>
            <p v-else-if="previewError" class="text-red-600">{{ previewError }}</p>
            <ul v-else-if="previewPieces.length" class="mt-2 list-disc pl-5 space-y-1">
              <li v-for="(piece, idx) in previewPieces.slice(0, 5)" :key="idx">
                {{ piece }}
              </li>
            </ul>
            <p v-else class="text-gray-500">Preview not available.</p>
          </div>
          <div class="mt-4 flex gap-4 justify-center">
            <button
              @click="startVoiceConversation"
              :class="[
                'px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-colors',
                isSpeechSupported ? 'hover:bg-blue-700' : 'opacity-70 cursor-not-allowed'
              ]"
            >
              Start Interactive Conversation (Voice)
            </button>
            <button
              @click="inputMode = 'text'; startConversation()"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Conversation by Text
            </button>
          </div>
        </div>

        <!-- Conversation Display -->
        <div v-if="conversationStarted" class="space-y-4">
          <!-- Compact State Debug (only in dev) -->
          <div v-if="showDebugState" class="bg-gray-100 rounded-md p-3 text-xs font-mono">
            <details>
              <summary class="cursor-pointer text-gray-600">Conversation State (Debug)</summary>
              <pre class="mt-2 whitespace-pre-wrap">{{ JSON.stringify(conversationState, null, 2) }}</pre>
            </details>
          </div>

          <!-- Current Conversation Piece -->
          <div class="bg-gray-50 rounded-md p-4">
            <p class="text-lg text-gray-800">{{ currentConversationPiece }}</p>
          </div>

          <!-- Next Question Preview (context) -->
          <div v-if="nextConversationPiece && !isProcessing && !isConversationComplete" class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 class="text-xs font-medium text-blue-700 mb-1">Context of next question:</h4>
            <p class="text-sm text-blue-800">{{ nextConversationPiece }}</p>
          </div>

          <!-- Status Messages -->
          <div v-if="statusMessage" :class="[
            'rounded-md p-4 border-2',
            statusMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          ]">
            <p class="text-gray-900 font-semibold">{{ statusMessage.text }}</p>
          </div>

          <!-- User Answer Display -->
          <div v-if="userAnswer" class="bg-blue-50 rounded-md p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Your Answer:</h3>
            <p class="text-gray-800">{{ userAnswer }}</p>
          </div>

          <!-- TTS Loading Indicator -->
          <div v-if="isGeneratingTTS" class="flex flex-col items-center justify-center py-8">
            <LoadingIndicator :is-loading="true" />
            <p class="mt-4 text-gray-600">Generating audio...</p>
          </div>

          <!-- Recording Controls (Speech Mode) -->
          <div v-if="!isConversationComplete && !isGeneratingTTS && inputMode === 'speech'" class="flex flex-col items-center space-y-4">
            <div v-if="!isRecording && !isProcessing" class="flex gap-4">
              <button
                v-if="!isPlaying"
                @click="playCurrentPiece"
                class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Play Audio
              </button>
              <button
                v-if="isPlaying"
                @click="stopAudioAndStartRecording"
                class="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Skip & Answer
              </button>
            </div>
            <button
              v-if="isRecording"
              @click="stopRecording"
              class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span class="w-3 h-3 bg-white rounded-full animate-pulse"></span>
              Stop Recording
            </button>
            <!-- Try Again Button (Speech Mode) -->
            <button
              v-if="statusMessage && statusMessage.type === 'error' && !isRecording && !isProcessing"
              @click="startRecording"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Text Input Controls (Text Mode) -->
          <div v-if="!isConversationComplete && inputMode === 'text'" class="flex flex-col items-center space-y-4 w-full">
            <div v-if="!isProcessing" class="w-full max-w-2xl space-y-3">
              <textarea
                v-model="textAnswer"
                placeholder="Type your answer here..."
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                rows="4"
                @keydown.enter.exact.prevent="submitTextAnswer"
                @keydown.ctrl.enter.exact="submitTextAnswer"
              ></textarea>
              <div class="flex gap-4 justify-center">
                <button
                  @click="submitTextAnswer"
                  :disabled="!textAnswer.trim()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            </div>
            <!-- Try Again Button (Text Mode) -->
            <button
              v-if="statusMessage && statusMessage.type === 'error' && !isProcessing"
              @click="textAnswer = ''; statusMessage = null"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Conversation History -->
          <div v-if="conversationHistory.length > 0" class="mt-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Conversation History:</h3>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="(item, idx) in conversationHistory"
                :key="idx"
                class="bg-gray-50 rounded-md p-3 text-sm"
              >
                <p class="font-semibold text-gray-700">AI: {{ item.ai }}</p>
                <p v-if="item.user" class="text-gray-600 mt-1">You: {{ item.user }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-4">
            <button
              @click="resetConversation"
              class="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Restart Conversation
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio
      ref="audioRef"
      @ended="onAudioEnded"
      @error="onAudioError"
      @timeupdate="onAudioTimeUpdate"
      class="hidden"
      :volume="1.0"
    ></audio>

    <div class="toast-container" role="status" aria-live="polite" aria-atomic="true">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[toast.type, { flicker: toast.flicker }]"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import LoadingIndicator from '@/components/loading/loadingIndicator.vue'

// Page metadata
definePageMeta({
  layout: false,
})

const router = useRouter()
const route = useRoute()
const originalBodyOverflow = ref('')
const allowOverlayClose = ref(false)
const returnTo = ref('')

const closeModal = () => {
  if (
    typeof window !== 'undefined' &&
    window.parent &&
    window.parent !== window &&
    typeof window.parent.closeConversationPractice === 'function'
  ) {
    window.parent.closeConversationPractice()
    return
  }
  if (returnTo.value) {
    window.location.href = returnTo.value
    return
  }
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}

const handleOverlayClick = () => {
  if (!allowOverlayClose.value) return
  closeModal()
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// ============================================================================
// Compact Conversation State (NEW - replaces full history tracking)
// ============================================================================
const createDefaultState = () => ({
  aiName: null,
  aiGender: 'female',
  aiRole: null,
  userName: null,
  userMood: 'neutral',
  userChoices: {},
  keyFacts: [],
  scenarioRoles: {
    aiRole: null,
    userRole: null,
    aiNeed: null,
  },
  branchStack: [],
  scriptProgress: {
    totalScriptPieces: 0,
    coveredIndices: [],
    skippedIndices: [],
    currentScriptIndex: 0,
    currentActualIndex: 0,
  },
  inBranch: false,
  branchDepth: 0,
  questionIndex: 0,
  totalQuestions: 0,
  lastCorrectAnswer: null,
})

// Compact state that gets sent to backend instead of full history
const conversationState = ref(createDefaultState())

// Debug mode - show state in UI (toggle with URL param ?debug=1)
const showDebugState = ref(false)

// ============================================================================
// UI State
// ============================================================================
const voiceType = ref('female')
const playbackSpeed = ref(1.0)
const conversationMeta = ref({ chapterId: '', name: '' })
const conversationStarted = ref(false)
const conversationCompleteMessage = ref('')
const conversationPieces = ref([])
const previewPieces = ref([])
const previewLoading = ref(false)
const previewError = ref('')
const currentIndex = ref(0)
const isPlaying = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const isGeneratingTTS = ref(false)
const userAnswer = ref('')
const textAnswer = ref('')
const inputMode = ref('speech')
const statusMessage = ref(null)
const conversationHistory = ref([]) // Still kept for display purposes
const audioRef = ref(null)
const currentAudioUrl = ref(null)
const audioUrlCache = ref({})
const toasts = ref([])
const isSpeechSupported = ref(true)

// Speech Recognition
let recognition = null

// ============================================================================
// Computed Properties
// ============================================================================
const currentConversationPiece = computed(() => {
  if (conversationCompleteMessage.value) return conversationCompleteMessage.value
  if (conversationPieces.value.length === 0) return ''
  return conversationPieces.value[currentIndex.value] || ''
})

const nextConversationPiece = computed(() => {
  if (conversationCompleteMessage.value) return null
  if (conversationPieces.value.length === 0 || currentIndex.value >= conversationPieces.value.length - 1) return null
  return conversationPieces.value[currentIndex.value + 1] || null
})

const isConversationComplete = computed(() => !!conversationCompleteMessage.value)

// ============================================================================
// Lifecycle Hooks
// ============================================================================
const isEmbedded = computed(() => String(route.query.embed || '') === '1')

onMounted(() => {
  if (typeof document !== 'undefined') {
    if (!isEmbedded.value) {
      originalBodyOverflow.value = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    returnTo.value = String(route.query.returnTo || '').trim() || document.referrer || ''
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
    if (!isEmbedded.value) {
      // Avoid immediately closing the modal on the opening click.
      setTimeout(() => {
        allowOverlayClose.value = true
      }, 0)
    }
  }
  const initialChapterId = String(route.query.chapterId || '').trim()
  const mode = String(route.query.mode || '').trim().toLowerCase()
  if (mode === 'text' || mode === 'speech') {
    inputMode.value = mode
  }
  if (initialChapterId) {
    conversationMeta.value = {
      ...conversationMeta.value,
      chapterId: initialChapterId,
    }
  }
  if (initialChapterId) {
    fetchPreviewPieces()
  } else {
    previewError.value = 'Chapter ID not configured.'
  }
  // Check for debug mode
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    showDebugState.value = urlParams.get('debug') === '1'
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        userAnswer.value = transcript
        validateAnswer(transcript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        isRecording.value = false
        isProcessing.value = false
        showStatus('error', `Speech recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        isRecording.value = false
      }
    } else {
      isSpeechSupported.value = false
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = originalBodyOverflow.value
  }
  if (recognition) {
    recognition.stop()
  }
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value = null
  }
  if (currentAudioUrl.value) {
    URL.revokeObjectURL(currentAudioUrl.value)
  }
})

// ============================================================================
// Methods
// ============================================================================
const detectSpeakerGenderFromAllPieces = async () => {
  try {
    const allPiecesText = conversationPieces.value.join(' ')
    const voiceDetection = await $fetch('/api/conversation/detect-voice', {
      method: 'POST',
      body: {
        text: allPiecesText,
        conversationHistory: '',
        currentVoiceType: voiceType.value,
      },
    })

    if (voiceDetection.success && voiceDetection.voiceType) {
      voiceType.value = voiceDetection.voiceType
      // Update state with detected gender
      conversationState.value.aiGender = voiceDetection.voiceType
      console.log(`Speaker gender detected: ${voiceDetection.voiceType}`)
    }
  } catch (error) {
    console.warn('Failed to pre-detect speaker gender:', error)
  }
}

const loadConversationPieces = async () => {
  try {
    const chapterId = String(route.query.chapterId || '').trim()
    const identifier = String(route.query.identifier || '').trim()
    const query = {}
    if (chapterId) query.chapterId = chapterId
    if (identifier) query.identifier = identifier
    const response = await $fetch('/api/conversation/engage', { query })
    const pieces = Array.isArray(response?.pieces) ? response.pieces : []
    conversationMeta.value = {
      chapterId: response?.chapterId || '',
      name: response?.name || '',
    }
    return pieces
  } catch (error) {
    console.error('Failed to load conversation:', error)
    showStatus('error', 'Failed to load conversation from backend')
    return []
  }
}

const fetchPreviewPieces = async () => {
  previewLoading.value = true
  previewError.value = ''
  try {
    const pieces = await loadConversationPieces()
    previewPieces.value = pieces
    if (!pieces.length) {
      previewError.value = 'No preview available.'
    }
  } catch (error) {
    previewError.value = 'Failed to load preview.'
  } finally {
    previewLoading.value = false
  }
}

const startConversation = async () => {
  const pieces = previewPieces.value.length
    ? previewPieces.value
    : await loadConversationPieces()
  if (!pieces.length) {
    showStatus('error', 'No conversation pieces found')
    return
  }

  // Initialize conversation
  conversationPieces.value = pieces
  conversationStarted.value = true
  currentIndex.value = 0
  conversationHistory.value = []
  userAnswer.value = ''
  textAnswer.value = ''
  statusMessage.value = null
  conversationCompleteMessage.value = ''
  audioUrlCache.value = {}

  // Initialize compact state
  conversationState.value = {
    ...createDefaultState(),
    aiGender: voiceType.value,
    totalQuestions: pieces.length,
    questionIndex: 0,
    scriptProgress: {
      totalScriptPieces: pieces.length,
      coveredIndices: [],
      skippedIndices: [],
      currentScriptIndex: 0,
      currentActualIndex: 0,
    },
  }

  // Pre-analyze conversation for speaker identity
  detectSpeakerGenderFromAllPieces()

  // Start with first piece
  nextTick(() => {
    if (inputMode.value === 'text') {
      textAnswer.value = ''
      statusMessage.value = null
    } else {
      playCurrentPiece()
    }
  })
}

const startVoiceConversation = () => {
  if (!isSpeechSupported.value) {
    showToast('Voice Conversation is not available in this browser. Try Chrome, Edge, or Safari.', 'error')
    return
  }
  inputMode.value = 'speech'
  startConversation()
}

const playCurrentPiece = async () => {
  if (isPlaying.value || isGeneratingTTS.value || !currentConversationPiece.value) return
  
  if (inputMode.value === 'text') return

  const cachedAudioUrl = audioUrlCache.value[currentIndex.value]
  if (cachedAudioUrl) {
    if (audioRef.value) {
      if (currentAudioUrl.value && currentAudioUrl.value !== cachedAudioUrl && currentAudioUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrl.value)
      }
      currentAudioUrl.value = cachedAudioUrl
      audioRef.value.src = cachedAudioUrl
      audioRef.value.playbackRate = playbackSpeed.value
      isPlaying.value = true
      audioRef.value.play().catch(err => {
        console.error('Error playing audio:', err)
        isPlaying.value = false
        showStatus('error', 'Failed to play audio')
      })
    }
    return
  }

  try {
    isGeneratingTTS.value = true
    statusMessage.value = null

    // Voice detection
    try {
      const voiceDetection = await $fetch('/api/conversation/detect-voice', {
        method: 'POST',
        body: {
          text: currentConversationPiece.value,
          conversationHistory: conversationHistory.value,
          currentVoiceType: voiceType.value,
        },
      })

      if (voiceDetection.success && voiceDetection.shouldUpdate && voiceDetection.voiceType) {
        voiceType.value = voiceDetection.voiceType
        conversationState.value.aiGender = voiceDetection.voiceType
      }
    } catch (detectionError) {
      console.warn('Voice detection failed:', detectionError)
    }

    // Generate TTS
    const response = await $fetch('/api/conversation/tts', {
      method: 'POST',
      body: {
        text: currentConversationPiece.value,
        voiceType: voiceType.value,
        inline: true,
      },
    })

    if (response.success && (response.audioBase64 || response.audioUrl)) {
      let resolvedUrl = response.audioUrl
      if (response.audioBase64) {
        const binary = atob(response.audioBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: response.contentType || 'audio/wav' })
        resolvedUrl = URL.createObjectURL(blob)
      }

      audioUrlCache.value[currentIndex.value] = resolvedUrl
      isGeneratingTTS.value = false
      isPlaying.value = true

      if (audioRef.value) {
        if (currentAudioUrl.value && currentAudioUrl.value !== resolvedUrl && currentAudioUrl.value.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrl.value)
        }
        currentAudioUrl.value = resolvedUrl
        audioRef.value.src = resolvedUrl
        audioRef.value.playbackRate = playbackSpeed.value
        audioRef.value.play().catch(err => {
          console.error('Error playing audio:', err)
          isPlaying.value = false
          showStatus('error', 'Failed to play audio')
        })
      }
    } else {
      isGeneratingTTS.value = false
      showStatus('error', response.error || 'Failed to generate audio')
    }
  } catch (error) {
    console.error('Error generating TTS:', error)
    isGeneratingTTS.value = false
    showStatus('error', 'Failed to generate audio')
  }
}

const stopAudioAndStartRecording = () => {
  if (audioRef.value && isPlaying.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    isPlaying.value = false
  }
  startRecording()
}

const onAudioEnded = () => {
  isPlaying.value = false
  if (conversationStarted.value && currentIndex.value < conversationPieces.value.length) {
    setTimeout(() => {
      if (inputMode.value === 'speech') {
        startRecording()
      } else {
        textAnswer.value = ''
        statusMessage.value = null
      }
    }, 500)
  }
}

const onAudioError = () => {
  console.error('Audio element error:', audioRef.value?.error)
  isPlaying.value = false
  showStatus('error', `Error playing audio: ${audioRef.value?.error?.message || 'Unknown error'}`)
}

const onAudioTimeUpdate = () => {
  // Audio progress tracking if needed
}

const startRecording = () => {
  if (!recognition) {
    showStatus('error', 'Speech recognition is not available')
    return
  }

  if (isPlaying.value) {
    showStatus('error', 'Please wait for audio to finish')
    return
  }

  try {
    isRecording.value = true
    userAnswer.value = ''
    statusMessage.value = null
    recognition.start()
  } catch (error) {
    console.error('Error starting recording:', error)
    isRecording.value = false
    showStatus('error', 'Failed to start recording')
  }
}

const stopRecording = () => {
  if (recognition && isRecording.value) {
    recognition.stop()
  }
}

const submitTextAnswer = () => {
  if (!textAnswer.value.trim()) return
  const answer = textAnswer.value.trim()
  textAnswer.value = ''
  statusMessage.value = null
  validateAnswer(answer)
}

const validateAnswer = async (answer) => {
  if (!answer.trim()) return

  isProcessing.value = true
  statusMessage.value = null

  try {
    // Send compact state instead of full history
    const response = await $fetch('/api/conversation/validate', {
      method: 'POST',
      body: {
        conversationContext: conversationPieces.value,
        currentPiece: currentConversationPiece.value,
        currentIndex: currentIndex.value,
        userAnswer: answer,
        // NEW: Send compact state instead of full history
        conversationState: conversationState.value,
        // Keep for backward compatibility during transition
        conversationHistory: conversationHistory.value,
      },
    })

    if (response.success) {
      // Update compact state from backend's enriched state
      if (response.enrichedState) {
        conversationState.value = {
          ...conversationState.value,
          ...response.enrichedState,
        }
        console.log('State updated:', conversationState.value)
      }

      if (response.isCorrect) {
        let nextPiece = currentIndex.value < conversationPieces.value.length - 1
          ? conversationPieces.value[currentIndex.value + 1]
          : null

        if (response.insertFollowUp && response.followUp) {
          conversationPieces.value.splice(currentIndex.value + 1, 0, response.followUp)
          nextPiece = conversationPieces.value[currentIndex.value + 1]
          // Update total questions in state
          conversationState.value.totalQuestions = conversationPieces.value.length
        } else if (response.adaptedResponse && nextPiece) {
          conversationPieces.value[currentIndex.value + 1] = response.adaptedResponse
        }

        // Add to history (still kept for display)
        conversationHistory.value.push({
          ai: currentConversationPiece.value,
          user: answer,
        })

        const previousIndex = currentIndex.value
        currentIndex.value++
        
        // Update state progress
        conversationState.value.questionIndex = currentIndex.value
        conversationState.value.lastCorrectAnswer = answer

        const previousAudioUrl = audioUrlCache.value[previousIndex]
        if (previousAudioUrl && previousAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previousAudioUrl)
        }
        delete audioUrlCache.value[previousIndex]

        if (currentIndex.value >= conversationPieces.value.length) {
          conversationCompleteMessage.value = response.adaptedResponse || response.feedback || 'Thank you for practicing!'
          statusMessage.value = null
          userAnswer.value = ''
          Object.values(audioUrlCache.value).forEach((url) => {
            if (typeof url === 'string' && url.startsWith('blob:')) {
              URL.revokeObjectURL(url)
            }
          })
          audioUrlCache.value = {}
        } else {
          showStatus('success', response.feedback || 'Correct!')
          userAnswer.value = ''
          
          if (inputMode.value === 'text') {
            textAnswer.value = ''
          } else {
            setTimeout(() => {
              playCurrentPiece()
            }, 2000)
          }
        }
      } else {
        showStatus('error', response.feedback || 'This is wrong. Try again.')
        userAnswer.value = ''
      }
    } else {
      showStatus('error', response.error || 'Failed to validate answer')
    }
  } catch (error) {
    console.error('Error validating answer:', error)
    showStatus('error', 'Failed to validate answer')
  } finally {
    isProcessing.value = false
  }
}

const resetConversation = () => {
  conversationStarted.value = false
  conversationPieces.value = []
  currentIndex.value = 0
  conversationHistory.value = []
  userAnswer.value = ''
  textAnswer.value = ''
  statusMessage.value = null
  conversationCompleteMessage.value = ''
  isPlaying.value = false
  isRecording.value = false
  isProcessing.value = false
  Object.values(audioUrlCache.value).forEach((url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
  audioUrlCache.value = {}
  
  // Reset compact state
  conversationState.value = createDefaultState()

  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  if (currentAudioUrl.value) {
    URL.revokeObjectURL(currentAudioUrl.value)
    currentAudioUrl.value = null
  }
}

const updatePlaybackSpeed = () => {
  if (audioRef.value && currentAudioUrl.value) {
    audioRef.value.playbackRate = playbackSpeed.value
  }
}

const showStatus = (type, text) => {
  statusMessage.value = { type, text }
}

const showToast = (message, type = 'info') => {
  const existingIndex = toasts.value.findIndex((t) => t.message === message && t.type === type)
  const shouldFlicker = existingIndex !== -1
  if (shouldFlicker) {
    toasts.value.splice(existingIndex, 1)
  }
  const pushToast = () => {
    const toast = { id: `${Date.now()}-${Math.random()}`, message, type, flicker: shouldFlicker }
    toasts.value.push(toast)
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== toast.id)
    }, 4000)
  }
  if (shouldFlicker) {
    nextTick(pushToast)
  } else {
    pushToast()
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 60;
}

.toast {
  padding: 12px 16px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 0.9rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  max-width: 320px;
}

.toast.info {
  background: #1f2937;
}

.toast.error {
  background: #b91c1c;
}

.toast.flicker {
  animation: toast-flicker 0.26s ease;
}

@media (max-width: 640px) {
  .toast-container {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
  .toast {
    max-width: none;
  }
}

@keyframes toast-flicker {
  0% { opacity: 0; transform: translateY(6px) scale(0.98); }
  45% { opacity: 1; transform: translateY(0) scale(1); }
  70% { opacity: 0.4; transform: translateY(1px) scale(0.995); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
