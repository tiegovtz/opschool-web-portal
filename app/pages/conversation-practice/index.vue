<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-2 text-center">
          Conversation Practice
        </h1>
        <p class="text-gray-600 text-center mb-8">
          Practice conversations with AI using speech-to-text and text-to-speech
        </p>

      <div class="bg-white rounded-lg shadow-lg p-6 space-y-6">
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

        <!-- Conversation Input (Temporary - will be replaced with API) -->
        <div v-if="!conversationStarted">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Conversation Context (Temporary - will come from API)
          </label>
          <textarea
            v-model="conversationInput"
            placeholder="Enter conversation pieces separated by newlines. Example:&#10;What's your name?&#10;Nice to meet you, I am Grace.&#10;How are you?&#10;I am also well."
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
            rows="6"
          ></textarea>
          <div class="mt-4 flex gap-4 justify-center">
            <button
              @click="inputMode = 'speech'; startConversation()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
          <!-- Current Conversation Piece -->
          <div class="bg-gray-50 rounded-md p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">
              Current: {{ currentIndex + 1 }} / {{ conversationPieces.length }}
            </h3>
            <p class="text-lg text-gray-800">{{ currentConversationPiece }}</p>
          </div>

          <!-- Next Question Preview (context) -->
          <div v-if="nextConversationPiece && !isProcessing" class="bg-blue-50 border border-blue-200 rounded-md p-3">
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
          <div v-if="!isGeneratingTTS && inputMode === 'speech'" class="flex flex-col items-center space-y-4">
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
          <div v-if="inputMode === 'text'" class="flex flex-col items-center space-y-4 w-full">
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
              @click="saveConversation"
              :disabled="conversationHistory.length === 0"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Save Conversation
            </button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import LoadingIndicator from '@/components/loading/loadingIndicator.vue'

// Page metadata
definePageMeta({
  layout: 'home-layout',
})

// State
const voiceType = ref('female')
const playbackSpeed = ref(1.0) // Default playback speed (1.0 = normal, generation uses 0.85)
const conversationInput = ref('')
const conversationStarted = ref(false)
const conversationPieces = ref([])
const currentIndex = ref(0)
const isPlaying = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const isGeneratingTTS = ref(false)
const userAnswer = ref('')
const textAnswer = ref('') // Text input for typing answers
const inputMode = ref('speech') // 'speech' or 'text'
const statusMessage = ref(null)
const conversationHistory = ref([])
const audioRef = ref(null)
const currentAudioUrl = ref(null)
// Cache audio URLs per piece to avoid regeneration
const audioUrlCache = ref({})

// Speech Recognition
let recognition = null

// Computed
const currentConversationPiece = computed(() => {
  if (conversationPieces.value.length === 0) return ''
  return conversationPieces.value[currentIndex.value] || ''
})

const nextConversationPiece = computed(() => {
  if (conversationPieces.value.length === 0 || currentIndex.value >= conversationPieces.value.length - 1) return null
  return conversationPieces.value[currentIndex.value + 1] || null
})

// Initialize Speech Recognition
onMounted(() => {
  if (typeof window !== 'undefined') {
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
      showStatus('error', 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
    }
  }
})

onUnmounted(() => {
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

// Methods
const detectSpeakerGenderFromAllPieces = async () => {
  // Analyze all conversation pieces together to detect the speaker's identity
  // This ensures consistent voice from the very first piece
  try {
    const allPiecesText = conversationPieces.value.join(' ')
    const voiceDetection = await $fetch('/api/conversation/detect-voice', {
      method: 'POST',
      body: {
        text: allPiecesText,
        conversationHistory: '', // Empty for initial detection
        currentVoiceType: voiceType.value,
      },
    })

    if (voiceDetection.success && voiceDetection.voiceType) {
      voiceType.value = voiceDetection.voiceType
      console.log(`Speaker gender detected from full conversation: ${voiceDetection.voiceType} (${voiceDetection.reason || 'auto-detected'})`)
    }
  } catch (error) {
    console.warn('Failed to pre-detect speaker gender:', error)
    // Continue with default voice if detection fails
  }
}

const startConversation = () => {
  if (!conversationInput.value.trim()) {
    showStatus('error', 'Please enter conversation context')
    return
  }

  // Parse conversation pieces (split by newline)
  const pieces = conversationInput.value
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)

  if (pieces.length === 0) {
    showStatus('error', 'Please enter at least one conversation piece')
    return
  }

  conversationPieces.value = pieces
  conversationStarted.value = true
  currentIndex.value = 0
  conversationHistory.value = []
  userAnswer.value = ''
  textAnswer.value = ''
  statusMessage.value = null

  // Pre-analyze all conversation pieces to detect speaker's gender
  // This ensures consistent voice from the first piece
  detectSpeakerGenderFromAllPieces()

  // Start with first piece
  nextTick(() => {
    if (inputMode.value === 'text') {
      // Text mode: just show the text, no audio
      textAnswer.value = ''
      statusMessage.value = null
    } else {
      // Speech mode: play audio
      playCurrentPiece()
    }
  })
}

const playCurrentPiece = async () => {
  if (isPlaying.value || isGeneratingTTS.value || !currentConversationPiece.value) return
  
  // Skip audio generation in text mode
  if (inputMode.value === 'text') {
    return
  }

  // Check if audio is already cached for this piece
  const cachedAudioUrl = audioUrlCache.value[currentIndex.value]
  if (cachedAudioUrl) {
    // Use cached audio - no need to regenerate
    if (audioRef.value) {
      // Clean up previous audio URL if it was a blob
      if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:')) {
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
    // Clear status message when starting new piece
    statusMessage.value = null

    // Detect voice type from conversation text (include history for context)
    // Only update if a new character identity is established, otherwise keep current voice
    try {
      const voiceDetection = await $fetch('/api/conversation/detect-voice', {
        method: 'POST',
        body: {
          text: currentConversationPiece.value,
          conversationHistory: conversationHistory.value,
          currentVoiceType: voiceType.value, // Pass current voice to maintain consistency
        },
      })

      if (voiceDetection.success) {
        // Only update voice type if shouldUpdate is true (new identity established or first piece)
        if (voiceDetection.shouldUpdate && voiceDetection.voiceType) {
          voiceType.value = voiceDetection.voiceType
          if (voiceDetection.isNewIdentity) {
            console.log(`Voice established: ${voiceDetection.voiceType} (${voiceDetection.reason || 'auto-detected'})`)
          } else {
            console.log(`Voice updated: ${voiceDetection.voiceType} (${voiceDetection.reason || 'auto-detected'})`)
          }
        } else {
          // Keep current voice type - maintain consistency
          console.log(`Keeping current voice: ${voiceType.value} (maintaining established identity: ${voiceDetection.reason || 'no change needed'})`)
        }
      }
    } catch (detectionError) {
      console.warn('Voice detection failed, using current voice type:', detectionError)
      // Continue with current voiceType if detection fails
    }

    // Generate TTS audio with detected/current voice type
    const response = await $fetch('/api/conversation/tts', {
      method: 'POST',
      body: {
        text: currentConversationPiece.value,
        voiceType: voiceType.value,
      },
    })

    if (response.success && response.audioUrl) {
      // Cache the audio URL for this piece
      audioUrlCache.value[currentIndex.value] = response.audioUrl
      
      // TTS generation complete, now play audio
      isGeneratingTTS.value = false
      isPlaying.value = true

      // Play audio from URL (same as before optimization)
      if (audioRef.value) {
        // Clean up previous audio URL if it was a blob
        if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrl.value)
        }

        // Use the URL directly
        currentAudioUrl.value = response.audioUrl
        audioRef.value.src = response.audioUrl
        audioRef.value.playbackRate = playbackSpeed.value // Set initial playback speed
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
  // Stop audio if playing
  if (audioRef.value && isPlaying.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    isPlaying.value = false
  }
  // Start recording immediately
  startRecording()
}

const onAudioEnded = () => {
  isPlaying.value = false
  // Automatically start input based on mode after audio ends
  if (conversationStarted.value && currentIndex.value < conversationPieces.value.length) {
    // Small delay before starting input
    setTimeout(() => {
      if (inputMode.value === 'speech') {
        startRecording()
      } else {
        // Text mode: just clear and focus on text input (user will type)
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
  // This confirms audio is actually playing
  if (audioRef.value && !audioRef.value.paused) {
    // Audio is playing (currentTime is updating)
  }
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
    // Clear status message when starting to answer (user has seen the feedback)
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
  // Clear status message when submitting answer (user has seen the feedback)
  statusMessage.value = null
  validateAnswer(answer)
}

const validateAnswer = async (answer) => {
  if (!answer.trim()) return

  isProcessing.value = true
  statusMessage.value = null

  try {
    const response = await $fetch('/api/conversation/validate', {
      method: 'POST',
      body: {
        conversationContext: conversationPieces.value,
        currentPiece: currentConversationPiece.value,
        currentIndex: currentIndex.value,
        userAnswer: answer,
        conversationHistory: conversationHistory.value,
      },
    })

        if (response.success) {
      if (response.isCorrect) {
        // Get the next piece (may be adapted based on user's answer)
        let nextPiece = currentIndex.value < conversationPieces.value.length - 1
          ? conversationPieces.value[currentIndex.value + 1]
          : null

        // ALWAYS use adapted response if provided (makes conversation contextually appropriate)
        if (response.adaptedResponse) {
          if (nextPiece) {
            // Update the conversation piece for next iteration with adapted response
            conversationPieces.value[currentIndex.value + 1] = response.adaptedResponse
            console.log('Adapted response:', response.adaptedResponse)
          }
        } else if (nextPiece) {
          // If no adapted response but next piece exists, log a warning
          console.warn('No adapted response provided, using original next piece')
        }

        // Add to history
        conversationHistory.value.push({
          ai: currentConversationPiece.value,
          user: answer,
        })

        // Move to next piece
        currentIndex.value++

        if (currentIndex.value >= conversationPieces.value.length) {
          // Conversation complete - show the graceful closing message from backend
          showStatus('success', response.feedback || 'Conversation complete! Great job!')
          userAnswer.value = ''
        } else {
          // Continue to next piece
          showStatus('success', response.feedback || 'Correct!')
          userAnswer.value = ''
          // Don't auto-clear status - let it persist until user sees it
          // User can proceed by answering the next question
          // Status will clear when they start answering or when next piece plays
          if (inputMode.value === 'text') {
            // Text mode: clear text input, keep feedback visible
            textAnswer.value = ''
            // Status stays visible - user can see why it was correct
          } else {
            // Speech mode: wait a bit for feedback, then play audio (but keep feedback visible)
            setTimeout(() => {
              playCurrentPiece()
              // Keep feedback visible - only clear when starting new answer
            }, 2000)
          }
        }
      } else {
        // Wrong answer
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
  conversationInput.value = ''
  isPlaying.value = false
  isRecording.value = false
  isProcessing.value = false
  audioUrlCache.value = {} // Clear audio cache

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


const saveConversation = () => {
  if (conversationHistory.value.length === 0) {
    showStatus('error', 'No conversation to save')
    return
  }

  // Prepare conversation data
  const conversationData = {
    date: new Date().toISOString(),
    conversationPieces: conversationPieces.value,
    conversationHistory: conversationHistory.value,
    totalPieces: conversationPieces.value.length,
    completedPieces: conversationHistory.value.length,
  }

  // Create JSON string
  const jsonString = JSON.stringify(conversationData, null, 2)

  // Create text format (more readable)
  const textString = `Conversation Practice Session
Date: ${new Date(conversationData.date).toLocaleString()}
Total Pieces: ${conversationData.totalPieces}
Completed Pieces: ${conversationData.completedPieces}

${'='.repeat(60)}

${conversationHistory.value.map((item, index) => {
  return `[${index + 1}]\nAI: ${item.ai}\nYou: ${item.user}\n`
}).join('\n' + '-'.repeat(60) + '\n\n')}

${'='.repeat(60)}
`

  // Create blob and download
  const blob = new Blob([textString], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `conversation-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showStatus('success', 'Conversation saved!')
}

const showStatus = (type, text) => {
  statusMessage.value = { type, text }
  // Don't auto-clear status messages
  // - Error messages stay until user clicks "Try Again"
  // - Success messages stay until next piece plays or user action
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
