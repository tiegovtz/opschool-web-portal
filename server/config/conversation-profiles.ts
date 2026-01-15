/**
 * Conversation Profile Configuration System
 * 
 * Profiles allow customizing validation rules, adaptation behavior, and voice settings
 * for different types of conversations (e.g., Form 1 introduction, health scenarios, etc.)
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// Types
// ============================================================================

export interface ConversationProfile {
  id: string
  name: string
  description?: string
  targetLevel: 'form1' | 'form2' | 'form3' | 'form4' | 'advanced'
  
  validation: {
    /** How strict to be with answer correctness */
    strictness: 'lenient' | 'moderate' | 'strict'
    /** Require proper question-answer dialogue structure */
    requireDialogueStructure: boolean
    /** Allow humorous/playful answers that still respond to the question */
    allowHumor: boolean
    /** Track and use contextual memory (user choices, facts) */
    contextualMemoryEnabled: boolean
    /** Require reasons for "why" questions */
    requireReasonForWhy: boolean
  }
  
  adaptation: {
    /** Respond empathetically to negative emotions */
    emotionalResponses: boolean
    /** Compare AI answers to user answers (e.g., ages, favorites) */
    comparativeResponses: boolean
    /** Greet users by name when they introduce themselves */
    nameAcknowledgment: boolean
    /** Acknowledge user choices and adapt future responses */
    acknowledgeUserChoices: boolean
  }
  
  voice: {
    /** Default voice gender */
    defaultGender: 'male' | 'female'
    /** Auto-detect voice from conversation content */
    autoDetect: boolean
    /** TTS playback speed (0.5 - 1.5) */
    speed: number
  }
  
  /** Optional custom prompt sections to override defaults */
  customPrompts?: {
    evaluationRules?: string
    feedbackStyle?: string
    adaptationInstructions?: string
  }
}

// ============================================================================
// Default Profiles
// ============================================================================

export const DEFAULT_PROFILE: ConversationProfile = {
  id: 'default',
  name: 'Default Profile',
  description: 'Balanced settings suitable for most conversations',
  targetLevel: 'form1',
  
  validation: {
    strictness: 'lenient',
    requireDialogueStructure: true,
    allowHumor: true,
    contextualMemoryEnabled: true,
    requireReasonForWhy: false, // Prompt for reason, don't mark wrong
  },
  
  adaptation: {
    emotionalResponses: true,
    comparativeResponses: true,
    nameAcknowledgment: true,
    acknowledgeUserChoices: true,
  },
  
  voice: {
    defaultGender: 'female',
    autoDetect: true,
    speed: 0.75,
  },
}

export const STRICT_PROFILE: ConversationProfile = {
  id: 'strict',
  name: 'Strict Academic',
  description: 'Stricter validation for advanced students',
  targetLevel: 'form4',
  
  validation: {
    strictness: 'strict',
    requireDialogueStructure: true,
    allowHumor: false,
    contextualMemoryEnabled: true,
    requireReasonForWhy: true,
  },
  
  adaptation: {
    emotionalResponses: true,
    comparativeResponses: false,
    nameAcknowledgment: true,
    acknowledgeUserChoices: true,
  },
  
  voice: {
    defaultGender: 'female',
    autoDetect: true,
    speed: 0.85,
  },
}

export const LENIENT_PROFILE: ConversationProfile = {
  id: 'lenient',
  name: 'Beginner Friendly',
  description: 'Very lenient for absolute beginners',
  targetLevel: 'form1',
  
  validation: {
    strictness: 'lenient',
    requireDialogueStructure: false, // Don't require asking questions back
    allowHumor: true,
    contextualMemoryEnabled: true,
    requireReasonForWhy: false,
  },
  
  adaptation: {
    emotionalResponses: true,
    comparativeResponses: true,
    nameAcknowledgment: true,
    acknowledgeUserChoices: true,
  },
  
  voice: {
    defaultGender: 'female',
    autoDetect: true,
    speed: 0.7, // Slower for beginners
  },
}

// Built-in profiles map
const BUILT_IN_PROFILES: Map<string, ConversationProfile> = new Map([
  ['default', DEFAULT_PROFILE],
  ['strict', STRICT_PROFILE],
  ['lenient', LENIENT_PROFILE],
])

// ============================================================================
// Profile Loader
// ============================================================================

/**
 * Load a conversation profile by ID.
 * 
 * First checks built-in profiles, then looks for JSON file in profiles directory.
 */
export function loadProfile(profileId: string): ConversationProfile {
  // Check built-in profiles first
  if (BUILT_IN_PROFILES.has(profileId)) {
    return BUILT_IN_PROFILES.get(profileId)!
  }
  
  // Try loading from JSON file
  const profilesDir = join(process.cwd(), 'server', 'config', 'profiles')
  const profilePath = join(profilesDir, `${profileId}.json`)
  
  if (existsSync(profilePath)) {
    try {
      const content = readFileSync(profilePath, 'utf-8')
      const profile = JSON.parse(content) as ConversationProfile
      
      // Validate and merge with defaults
      return mergeWithDefaults(profile)
    } catch (error) {
      console.warn(`Failed to load profile ${profileId}:`, error)
    }
  }
  
  // Fall back to default
  console.warn(`Profile ${profileId} not found, using default`)
  return DEFAULT_PROFILE
}

/**
 * Get all available profile IDs
 */
export function getAvailableProfiles(): string[] {
  const profiles = Array.from(BUILT_IN_PROFILES.keys())
  
  // TODO: Also scan profiles directory for JSON files
  
  return profiles
}

/**
 * Merge a partial profile with defaults to ensure all fields are present
 */
export function mergeWithDefaults(partial: Partial<ConversationProfile>): ConversationProfile {
  return {
    id: partial.id || 'custom',
    name: partial.name || 'Custom Profile',
    description: partial.description,
    targetLevel: partial.targetLevel || DEFAULT_PROFILE.targetLevel,
    
    validation: {
      ...DEFAULT_PROFILE.validation,
      ...partial.validation,
    },
    
    adaptation: {
      ...DEFAULT_PROFILE.adaptation,
      ...partial.adaptation,
    },
    
    voice: {
      ...DEFAULT_PROFILE.voice,
      ...partial.voice,
    },
    
    customPrompts: partial.customPrompts,
  }
}

/**
 * Get strictness level value for prompt generation
 */
export function getStrictnessDescription(profile: ConversationProfile): string {
  switch (profile.validation.strictness) {
    case 'strict':
      return 'Be STRICT and thorough in evaluating answers. Require precise, complete responses.'
    case 'moderate':
      return 'Be BALANCED in evaluating answers. Accept reasonable variations but ensure core requirements are met.'
    case 'lenient':
    default:
      return 'Be LENIENT and encouraging. Accept any reasonable answer that attempts to respond to the question.'
  }
}

/**
 * Generate validation rules section based on profile
 */
export function generateValidationRules(profile: ConversationProfile): string {
  const rules: string[] = []
  
  // Base strictness
  rules.push(`1) STRICTNESS: ${getStrictnessDescription(profile)}`)
  
  // Dialogue structure
  if (profile.validation.requireDialogueStructure) {
    rules.push(`2) DIALOGUE STRUCTURE: If the next piece contains the AI answering a question, the user MUST have asked that question in their response.`)
  } else {
    rules.push(`2) DIALOGUE STRUCTURE: Optional - don't require users to ask questions back.`)
  }
  
  // Humor
  if (profile.validation.allowHumor) {
    rules.push(`3) HUMOR: Allow light humor/playfulness IF the answer still meaningfully responds to the question.`)
  } else {
    rules.push(`3) HUMOR: Require serious, direct answers without jokes or playfulness.`)
  }
  
  // Why questions
  if (profile.validation.requireReasonForWhy) {
    rules.push(`4) WHY QUESTIONS: If "why" is asked, the user MUST provide a reason. Mark wrong if no reason given.`)
  } else {
    rules.push(`4) WHY QUESTIONS: If "why" is asked and no reason given, prompt for reason but don't mark wrong.`)
  }
  
  // Contextual memory
  if (profile.validation.contextualMemoryEnabled) {
    rules.push(`5) CONTEXTUAL MEMORY: Track user choices and facts. Acknowledge previous choices in responses.`)
  }
  
  return rules.join('\n')
}

/**
 * Generate adaptation instructions based on profile
 */
export function generateAdaptationInstructions(profile: ConversationProfile): string {
  const instructions: string[] = []
  
  if (profile.adaptation.emotionalResponses) {
    instructions.push(`- Respond empathetically to negative emotions (e.g., "I'm sorry to hear that.")`)
    instructions.push(`- Respond encouragingly to positive emotions (e.g., "That's great!")`)
  }
  
  if (profile.adaptation.comparativeResponses) {
    instructions.push(`- Compare AI answers to user answers when relevant (e.g., ages, favorites)`)
  }
  
  if (profile.adaptation.nameAcknowledgment) {
    instructions.push(`- Greet users by name when they introduce themselves`)
  }
  
  if (profile.adaptation.acknowledgeUserChoices) {
    instructions.push(`- Always acknowledge user choices and adapt future responses accordingly`)
    instructions.push(`- Never ignore or contradict a choice the user made`)
  }
  
  return instructions.join('\n')
}
