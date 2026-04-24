/**
 * Conversation Practice Store
 * 
 * Pinia store for managing conversation state with compact memory.
 * This replaces the local ref-based state management in index.vue.
 */

import { defineStore } from 'pinia'
import type { ConversationState, ConversationHistoryItem, ConversationProfile } from '~/types/conversation.interface'
import { createDefaultConversationState, createDefaultProfile } from '~/types/conversation.interface'

// ============================================================================
// Types
// ============================================================================

interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

interface ConversationStoreState {
  // Session info
  sessionId: string
  inputMode: 'speech' | 'text'
  
  // Conversation content
  pieces: string[]
  currentIndex: number
  conversationInput: string // Raw input from textarea
  
  // Compact memory state (sent to backend)
  memoryState: ConversationState
  
  // Profile configuration
  profile: ConversationProfile
  
  // History (kept for display purposes)
  history: ConversationHistoryItem[]
  
  // Audio
  audioCache: Record<number, string>
  voiceType: 'male' | 'female'
  playbackSpeed: number
  currentAudioUrl: string | null
  
  // UI State
  isStarted: boolean
  isPlaying: boolean
  isRecording: boolean
  isProcessing: boolean
  isGeneratingTTS: boolean
  statusMessage: StatusMessage | null
  userAnswer: string
  textAnswer: string
  completeMessage: string
}

// ============================================================================
// Store Definition
// ============================================================================

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    // Session
    sessionId: '',
    inputMode: 'speech',
    
    // Content
    pieces: [],
    currentIndex: 0,
    conversationInput: '',
    
    // Compact state
    memoryState: createDefaultConversationState(),
    
    // Profile
    profile: createDefaultProfile(),
    
    // History
    history: [],
    
    // Audio
    audioCache: {},
    voiceType: 'female',
    playbackSpeed: 1.0,
    currentAudioUrl: null,
    
    // UI
    isStarted: false,
    isPlaying: false,
    isRecording: false,
    isProcessing: false,
    isGeneratingTTS: false,
    statusMessage: null,
    userAnswer: '',
    textAnswer: '',
    completeMessage: '',
  }),
  
  getters: {
    /**
     * Get the current conversation piece
     */
    currentPiece(): string {
      if (this.completeMessage) return this.completeMessage
      if (this.pieces.length === 0) return ''
      return this.pieces[this.currentIndex] || ''
    },
    
    /**
     * Get the next conversation piece (for preview)
     */
    nextPiece(): string | null {
      if (this.completeMessage) return null
      if (this.pieces.length === 0 || this.currentIndex >= this.pieces.length - 1) return null
      return this.pieces[this.currentIndex + 1] || null
    },
    
    /**
     * Check if conversation is complete
     */
    isComplete(): boolean {
      return !!this.completeMessage
    },
    
    /**
     * Get total number of questions
     */
    totalQuestions(): number {
      return this.pieces.length
    },
    
    /**
     * Get progress percentage
     */
    progressPercent(): number {
      if (this.pieces.length === 0) return 0
      return Math.round((this.currentIndex / this.pieces.length) * 100)
    },
    
    /**
     * Check if user has introduced themselves
     */
    hasUserName(): boolean {
      return !!this.memoryState.userName
    },
    
    /**
     * Get user's name for display
     */
    displayUserName(): string {
      return this.memoryState.userName || 'Student'
    },
  },
  
  actions: {
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
      this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
    },
    
    /**
     * Initialize conversation from input text
     */
    initializeConversation(input: string, mode: 'speech' | 'text') {
      // Parse input into pieces
      const pieces = input
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (pieces.length === 0) {
        this.showStatus('error', 'Please enter at least one conversation piece')
        return false
      }
      
      // Generate session ID
      this.generateSessionId()
      
      // Set pieces
      this.pieces = pieces
      this.conversationInput = input
      this.inputMode = mode
      
      // Reset state
      this.currentIndex = 0
      this.history = []
      this.userAnswer = ''
      this.textAnswer = ''
      this.statusMessage = null
      this.completeMessage = ''
      this.audioCache = {}
      
      // Initialize compact state
      this.memoryState = {
        ...createDefaultConversationState(),
        aiGender: this.voiceType,
        totalQuestions: pieces.length,
        questionIndex: 0,
      }
      
      // Mark as started
      this.isStarted = true
      
      return true
    },
    
    /**
     * Update state from backend response
     */
    updateFromBackend(enrichedState: Partial<ConversationState>) {
      this.memoryState = {
        ...this.memoryState,
        ...enrichedState,
      }
    },
    
    /**
     * Move to next question
     */
    moveToNextQuestion() {
      this.currentIndex++
      this.memoryState.questionIndex = this.currentIndex
    },
    
    /**
     * Add item to history
     */
    addToHistory(ai: string, user: string) {
      this.history.push({ ai, user })
    },
    
    /**
     * Insert follow-up question
     */
    insertFollowUp(followUp: string) {
      this.pieces.splice(this.currentIndex + 1, 0, followUp)
      this.memoryState.totalQuestions = this.pieces.length
    },
    
    /**
     * Update next piece with adapted response
     */
    updateNextPiece(adaptedResponse: string) {
      if (this.currentIndex < this.pieces.length - 1) {
        this.pieces[this.currentIndex + 1] = adaptedResponse
      }
    },
    
    /**
     * Mark conversation as complete
     */
    markComplete(message: string) {
      this.completeMessage = message
    },
    
    /**
     * Record correct answer
     */
    recordCorrectAnswer(answer: string) {
      this.memoryState.lastCorrectAnswer = answer
    },
    
    /**
     * Cache audio URL for a piece
     */
    cacheAudio(index: number, url: string) {
      this.audioCache[index] = url
    },
    
    /**
     * Get cached audio URL
     */
    getCachedAudio(index: number): string | null {
      return this.audioCache[index] || null
    },
    
    /**
     * Show status message
     */
    showStatus(type: 'success' | 'error', text: string) {
      this.statusMessage = { type, text }
    },
    
    /**
     * Clear status message
     */
    clearStatus() {
      this.statusMessage = null
    },
    
    /**
     * Set voice type
     */
    setVoiceType(type: 'male' | 'female') {
      this.voiceType = type
      this.memoryState.aiGender = type
    },
    
    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed: number) {
      this.playbackSpeed = speed
    },
    
    /**
     * Set profile
     */
    setProfile(profile: ConversationProfile) {
      this.profile = profile
      this.voiceType = profile.voice.defaultGender
      this.playbackSpeed = profile.voice.speed
    },
    
    /**
     * Set UI state flags
     */
    setPlaying(value: boolean) {
      this.isPlaying = value
    },
    
    setRecording(value: boolean) {
      this.isRecording = value
    },
    
    setProcessing(value: boolean) {
      this.isProcessing = value
    },
    
    setGeneratingTTS(value: boolean) {
      this.isGeneratingTTS = value
    },
    
    setUserAnswer(answer: string) {
      this.userAnswer = answer
    },
    
    setTextAnswer(answer: string) {
      this.textAnswer = answer
    },
    
    setCurrentAudioUrl(url: string | null) {
      this.currentAudioUrl = url
    },
    
    /**
     * Reset conversation to initial state
     */
    reset() {
      this.sessionId = ''
      this.inputMode = 'speech'
      this.pieces = []
      this.currentIndex = 0
      this.conversationInput = ''
      this.memoryState = createDefaultConversationState()
      this.profile = createDefaultProfile()
      this.history = []
      this.audioCache = {}
      this.voiceType = 'female'
      this.playbackSpeed = 1.0
      this.currentAudioUrl = null
      this.isStarted = false
      this.isPlaying = false
      this.isRecording = false
      this.isProcessing = false
      this.isGeneratingTTS = false
      this.statusMessage = null
      this.userAnswer = ''
      this.textAnswer = ''
      this.completeMessage = ''
    },
    
    /**
     * Export conversation data for saving
     */
    exportConversation() {
      return {
        sessionId: this.sessionId,
        date: new Date().toISOString(),
        profile: this.profile.id,
        pieces: this.pieces,
        history: this.history,
        state: this.memoryState,
        totalPieces: this.pieces.length,
        completedPieces: this.history.length,
      }
    },
  },
})
