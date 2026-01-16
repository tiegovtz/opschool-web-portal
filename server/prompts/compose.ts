/**
 * Prompt Composer
 * 
 * Assembles validation prompts from templates based on conversation profile.
 */

import type { ConversationProfile } from '../config/conversation-profiles'
import { DEFAULT_PROFILE } from '../config/conversation-profiles'
import {
  getBaseIntro,
  getStrictnessInstruction,
  getContextSection,
  getResponseFormat,
  type ValidationContext,
} from './validation/base'
import {
  getEvaluationRules,
  getContextualMemoryRules,
  getDialogueStructureExamples,
} from './validation/rules'

// ============================================================================
// Types
// ============================================================================

interface CompactState {
  aiName: string | null
  aiGender: 'male' | 'female'
  aiRole: string | null
  userName: string | null
  userMood: 'positive' | 'negative' | 'neutral'
  userChoices: Record<string, string>
  keyFacts: string[]
  questionIndex: number
  totalQuestions: number
  lastCorrectAnswer: string | null
}

export interface PromptParams {
  currentPiece: string
  nextPiece: string | null
  userAnswer: string
  state: CompactState
  profile?: ConversationProfile
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Build compact context string from state
 */
function buildCompactContext(state: CompactState): string {
  const parts: string[] = []
  
  // AI Character
  if (state.aiName || state.aiRole) {
    const aiInfo = [state.aiName, state.aiGender, state.aiRole].filter(Boolean).join(', ')
    parts.push(`AI character: ${aiInfo}`)
  }
  
  // User info
  if (state.userName) {
    parts.push(`User's name: ${state.userName}`)
  }
  parts.push(`User's current mood: ${state.userMood}`)
  
  // Key facts
  if (state.keyFacts.length > 0) {
    parts.push(`Key facts about user: ${state.keyFacts.join('; ')}`)
  }
  
  // User choices
  const choices = Object.entries(state.userChoices)
  if (choices.length > 0) {
    const choiceStr = choices.map(([k, v]) => `${k}: ${v}`).join(', ')
    parts.push(`User's choices made: ${choiceStr}`)
  }
  
  // Progress
  parts.push(`Progress: Question ${state.questionIndex + 1} of ${state.totalQuestions}`)
  
  // Last answer
  if (state.lastCorrectAnswer) {
    parts.push(`User's last answer: "${state.lastCorrectAnswer}"`)
  }
  
  return parts.join('\n')
}

// ============================================================================
// Adaptation Templates
// ============================================================================

/**
 * Get adaptation instructions based on profile
 */
function getAdaptationInstructions(profile: ConversationProfile): string {
  const instructions: string[] = []
  
  instructions.push(`**ADAPTATION (when correct):**`)
  instructions.push(`- Return an adaptedResponse that integrates the next piece naturally.`)
  instructions.push(`- Make it CONVERSATIONAL - relate to the user's specific answer.`)
  
  if (profile.adaptation.emotionalResponses) {
    instructions.push(`- Negative emotions → empathetic response (e.g., "I'm sorry to hear that.")`)
    instructions.push(`- Positive emotions → encouraging response (e.g., "That's great!")`)
  }
  
  if (profile.adaptation.comparativeResponses) {
    instructions.push(`- Compare similar answers when relevant (e.g., ages: "Oh, you're 18! I'm 15.")`)
  }
  
  if (profile.adaptation.nameAcknowledgment) {
    instructions.push(`- If user introduced themselves, greet by name (e.g., "Nice to meet you, Gabriel!")`)
  }
  
  if (profile.adaptation.acknowledgeUserChoices) {
    instructions.push(`- If user made a choice, acknowledge and respect it in all future responses.`)
  }
  
  // Custom adaptation instructions from profile
  if (profile.customPrompts?.adaptationInstructions) {
    instructions.push('')
    instructions.push(profile.customPrompts.adaptationInstructions)
  }
  
  return instructions.join('\n')
}

/**
 * Get feedback style instructions based on profile
 */
function getFeedbackInstructions(profile: ConversationProfile): string {
  const instructions: string[] = []
  
  instructions.push(`**TEACHER-LIKE FEEDBACK:**`)
  instructions.push(`- If correct: praise briefly and explain what was good.`)
  
  if (profile.validation.requireDialogueStructure) {
    instructions.push(`- If wrong due to missing question: explain they need to ask the question first.`)
  }
  
  instructions.push(`- If wrong due to contradiction: guide them without giving the answer.`)
  
  if (!profile.validation.requireReasonForWhy) {
    instructions.push(`- If missing "why" reason: prompt for it, don't mark wrong.`)
  }
  
  // Custom feedback style from profile
  if (profile.customPrompts?.feedbackStyle) {
    instructions.push('')
    instructions.push(profile.customPrompts.feedbackStyle)
  }
  
  return instructions.join('\n')
}

// ============================================================================
// Main Composer
// ============================================================================

/**
 * Compose a complete validation prompt from templates
 */
export function composeValidationPrompt(params: PromptParams): string {
  const profile = params.profile || DEFAULT_PROFILE
  
  const ctx: ValidationContext = {
    currentPiece: params.currentPiece,
    nextPiece: params.nextPiece,
    userAnswer: params.userAnswer,
    compactContext: buildCompactContext(params.state),
    profile,
  }
  
  // Build prompt sections
  const sections: string[] = []
  
  // 1. Introduction
  sections.push(getBaseIntro(profile))
  sections.push(getStrictnessInstruction(profile))
  sections.push('')
  
  // 2. Context (compact state + current/next pieces)
  sections.push(getContextSection(ctx))
  sections.push('')
  
  // 3. Important instructions
  sections.push(`**IMPORTANT - USE THE COMPACT STATE:**
- The user's name is: ${params.state.userName || 'unknown'}
- The user's mood is: ${params.state.userMood}
- User has made these choices: ${JSON.stringify(params.state.userChoices)}
- Key facts about user: ${params.state.keyFacts.join(', ') || 'none yet'}
- If user previously chose something, ACKNOWLEDGE that choice and adapt accordingly`)
  sections.push('')
  
  // 4. Evaluation rules
  sections.push(`**EVALUATION RULES:**`)
  sections.push(getEvaluationRules(profile))
  sections.push('')
  
  // 5. Contextual memory rules (if enabled)
  const memoryRules = getContextualMemoryRules(profile)
  if (memoryRules) {
    sections.push(memoryRules)
    sections.push('')
  }
  
  // 6. Dialogue structure examples (if required)
  if (profile.validation.requireDialogueStructure) {
    sections.push(getDialogueStructureExamples())
    sections.push('')
  }
  
  // 7. Feedback instructions
  sections.push(getFeedbackInstructions(profile))
  sections.push('')
  
  // 8. Adaptation instructions
  sections.push(getAdaptationInstructions(profile))
  sections.push('')
  
  // 9. Response format
  sections.push(getResponseFormat())
  
  return sections.join('\n')
}

/**
 * Get the system prompt for OpenAI
 */
export function getSystemPrompt(): string {
  return `You are a conversation practice evaluator. Always respond with valid JSON only.`
}
