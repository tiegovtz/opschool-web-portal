/**
 * Conversation Practice Types
 * 
 * These types define the compact state structure for conversation practice sessions.
 * The compact state replaces full conversation history to reduce API costs and improve context coherence.
 */

/**
 * Compact conversation state sent to backend for validation.
 * Instead of sending full conversation history, we track essential context.
 */
export interface ConversationState {
  // AI Character Identity
  aiName: string | null           // e.g., "Anna", "Michael"
  aiGender: 'male' | 'female'
  aiRole: string | null           // e.g., "Form 1 student", "pharmacist"
  
  // User Context
  userName: string | null         // Extracted when user introduces themselves
  userMood: 'positive' | 'negative' | 'neutral'
  
  // Conversation Memory
  userChoices: Record<string, string>  // e.g., { destination: "clinic", paymentMethod: "mobile money" }
  keyFacts: string[]              // Important facts: ["user is 18 years old", "user likes physics"]
  
  // Progress
  questionIndex: number
  totalQuestions: number
  lastCorrectAnswer: string | null
}

/**
 * Configuration profile for different conversation types.
 * Allows customizing validation strictness, adaptation rules, and voice settings.
 */
export interface ConversationProfile {
  id: string
  name: string
  description?: string
  targetLevel: 'form1' | 'form2' | 'form3' | 'form4' | 'advanced'
  
  validation: {
    strictness: 'lenient' | 'moderate' | 'strict'
    requireDialogueStructure: boolean
    allowHumor: boolean
    contextualMemoryEnabled: boolean
  }
  
  adaptation: {
    emotionalResponses: boolean
    comparativeResponses: boolean
    nameAcknowledgment: boolean
  }
  
  voice: {
    defaultGender: 'male' | 'female'
    autoDetect: boolean
    speed: number
  }
}

/**
 * Conversation history item for display purposes.
 */
export interface ConversationHistoryItem {
  ai: string
  user: string | null
}

/**
 * Response from the validate API with enriched state.
 */
export interface ValidationResponse {
  success: boolean
  isCorrect: boolean
  feedback: string
  adaptedResponse: string | null
  insertFollowUp?: boolean
  followUp?: string | null
  originalNext?: string | null
  
  // Enriched state returned by backend
  enrichedState?: Partial<ConversationState>
}

/**
 * Request body for the validate API.
 */
export interface ValidationRequest {
  conversationContext: string[]
  currentPiece: string
  currentIndex: number
  userAnswer: string
  conversationState: ConversationState
}

/**
 * Default conversation state factory.
 */
export function createDefaultConversationState(): ConversationState {
  return {
    aiName: null,
    aiGender: 'female',
    aiRole: null,
    userName: null,
    userMood: 'neutral',
    userChoices: {},
    keyFacts: [],
    questionIndex: 0,
    totalQuestions: 0,
    lastCorrectAnswer: null,
  }
}

/**
 * Default conversation profile for Form 1 students.
 */
export function createDefaultProfile(): ConversationProfile {
  return {
    id: 'default',
    name: 'Default Profile',
    description: 'Lenient profile suitable for Form 1 students',
    targetLevel: 'form1',
    validation: {
      strictness: 'lenient',
      requireDialogueStructure: true,
      allowHumor: true,
      contextualMemoryEnabled: true,
    },
    adaptation: {
      emotionalResponses: true,
      comparativeResponses: true,
      nameAcknowledgment: true,
    },
    voice: {
      defaultGender: 'female',
      autoDetect: true,
      speed: 0.75,
    },
  }
}
