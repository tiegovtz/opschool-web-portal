/**
 * Base validation prompt templates
 * 
 * These templates form the foundation of the validation prompt.
 */

import type { ConversationProfile } from '../../config/conversation-profiles'

export interface ValidationContext {
  currentPiece: string
  nextPiece: string | null
  userAnswer: string
  compactContext: string
  profile: ConversationProfile
}

/**
 * System prompt for the evaluator
 */
export const SYSTEM_PROMPT = `You are a conversation practice evaluator. Always respond with valid JSON only.`

/**
 * Base introduction for the validation prompt
 */
export function getBaseIntro(profile: ConversationProfile): string {
  const levelDescriptions: Record<string, string> = {
    form1: 'beginner-level (Form 1)',
    form2: 'elementary-level (Form 2)',
    form3: 'intermediate-level (Form 3)',
    form4: 'pre-advanced (Form 4)',
    advanced: 'advanced-level',
  }
  
  const level = levelDescriptions[profile.targetLevel] || 'beginner-level'
  
  return `You are evaluating an English conversation practice session for ${level} students.`
}

/**
 * Get strictness instruction based on profile
 */
export function getStrictnessInstruction(profile: ConversationProfile): string {
  switch (profile.validation.strictness) {
    case 'strict':
      return 'Be THOROUGH in evaluating answers. Require precise, complete responses that fully address the question.'
    case 'moderate':
      return 'Be BALANCED in evaluating answers. Accept reasonable variations but ensure core requirements are met.'
    case 'lenient':
    default:
      return 'Be LENIENT, encouraging, and teacher-like. Accept any reasonable answer that attempts to respond to the question.'
  }
}

/**
 * Generate the context section of the prompt
 */
export function getContextSection(ctx: ValidationContext): string {
  return `**CONVERSATION STATE (Compact Memory):**
${ctx.compactContext}

**CURRENT CONTEXT:**
- Current conversation piece (what AI just said): "${ctx.currentPiece}"
${ctx.nextPiece ? `- Next conversation piece (for context/compatibility only): "${ctx.nextPiece}"` : '- This is the last piece in the conversation'}

**User's answer:** "${ctx.userAnswer}"`
}

/**
 * Generate the response format instructions
 */
export function getResponseFormat(): string {
  return `Respond with JSON only:
{
  "evaluation": {
    "correct": boolean,
    "feedback": "teacher-like explanation",
    "contextuallyAppropriate": boolean,
    "compatibility": boolean
  },
  "adaptedResponse": string | null,
  "extractedFacts": {
    "userName": string | null,
    "userAge": number | null,
    "userChoice": { "key": string, "value": string } | null,
    "keyFact": string | null,
    "detectedMood": "positive" | "negative" | "neutral"
  }
}`
}
