/**
 * Validation rules templates
 * 
 * These templates define the evaluation rules that can be customized per profile.
 */

import type { ConversationProfile } from '../../config/conversation-profiles'

/**
 * Get core evaluation rules based on profile
 */
export function getEvaluationRules(profile: ConversationProfile): string {
  const rules: string[] = []
  
  // Rule 1: Contextual appropriateness (always applies)
  rules.push(`1) CONTEXTUALLY APPROPRIATE: The answer should make logical sense as a reply to the current piece.`)
  
  // Rule 2: Compatibility check
  rules.push(`2) COMPATIBILITY CHECK (using next piece): Only mark WRONG for DIRECT contradictions of REQUIRED FACTS.
   - Do NOT mark WRONG for emotional tone, opinions, or normal details.
   - Examples (WRONG):
     - Current: "Are you a student here?" Next: "Which class are you in?" User: "No" → WRONG.
   - Examples (CORRECT):
     - Current: "How are you?" User: "Not good today." → CORRECT.`)
  
  // Rule 3: Dialogue structure (configurable)
  if (profile.validation.requireDialogueStructure) {
    rules.push(`3) DIALOGUE STRUCTURE (CRITICAL): If the NEXT piece contains the AI ANSWERING a question, the user MUST have asked that question.
   - Detection patterns:
     - "I am [name]" → User should have asked about name
     - "I am [age] years old" → User should have asked about age
     - "My favorite is [thing]" → User should have asked about favorites
   - The user can be creative/funny in HOW they ask, but they MUST ask the question.`)
  } else {
    rules.push(`3) DIALOGUE STRUCTURE: Optional - don't require users to ask questions back. Focus on whether they answered the current question.`)
  }
  
  // Rule 4: Humor (configurable)
  if (profile.validation.allowHumor) {
    rules.push(`4) HUMOR IS OK: Allow light humor/playfulness IF the answer still meaningfully responds to the current piece.
   - If the humor makes the answer nonsensical or breaks the lesson reality, mark it WRONG.
   - Example: "How are you?" → "I'm fine—my stomach is smiling today!" → CORRECT.
   - Example: "Are you a student?" → "I'm an alien" → WRONG (breaks reality).`)
  } else {
    rules.push(`4) SERIOUS ANSWERS REQUIRED: Require direct, serious answers. Do not accept jokes or playful responses.`)
  }
  
  // Rule 5: Why questions (configurable)
  if (profile.validation.requireReasonForWhy) {
    rules.push(`5) WHY QUESTIONS: If "why" is asked, a reason MUST be provided.
   - Mark WRONG if no reason is given.
   - Accept any reasonable reason.`)
  } else {
    rules.push(`5) WHY QUESTIONS: If "why" is asked and no reason given:
   - Treat as CORRECT but ask for the reason in adaptedResponse.
   - Example: "What food do you like?" → "Ugali" → CORRECT, then say "That's great! Why do you like ugali?"`)
  }
  
  // Rule 6: Grammar leniency (always lenient for conversation practice)
  rules.push(`6) GRAMMAR/SPELLING: Be lenient. Short answers are OK if they match the question.`)
  
  return rules.join('\n\n')
}

/**
 * Get contextual memory rules based on profile
 */
export function getContextualMemoryRules(profile: ConversationProfile): string {
  if (!profile.validation.contextualMemoryEnabled) {
    return ''
  }
  
  return `**CONTEXTUAL MEMORY & COHERENCE:**
- If the user's answer is a CHOICE or DECISION (e.g., "go to clinic" vs "go to pharmacy"), you MUST acknowledge it.
- You CAN politely disagree but MUST acknowledge what the user said.
- If the next piece contradicts the user's choice, ADAPT it to match what they said.
- NEVER pretend the user didn't make a choice - ALWAYS acknowledge previous choices if relevant.
- If the user reminds you of something they said earlier, acknowledge it and apologize for any confusion.`
}

/**
 * Get dialogue structure examples (used when dialogue structure is required)
 */
export function getDialogueStructureExamples(): string {
  return `Examples (WRONG - missing required question):
  - Current: "hi what's your name?" Next: "I am Michael. How old are you?" User: "I'm Sarah" → WRONG (didn't ask name back).
  - Current: "I am John" Next: "I am 20 years old." User: "Nice to meet you!" → WRONG (didn't ask age).

Examples (CORRECT - proper dialogue structure):
  - Current: "hi what's your name?" Next: "I am Michael. How old are you?" User: "I'm Sarah, what's your name?" → CORRECT.
  - Current: "I am John" Next: "I am 20 years old." User: "Nice to meet you! How old are you?" → CORRECT.`
}
