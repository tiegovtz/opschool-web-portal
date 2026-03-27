// @ts-nocheck
import apiDocs from "~/utilities/apiDocs"

// ============================================================================
// Types for Compact Conversation State
// ============================================================================
interface ConversationState {
  aiName: string | null
  aiGender: 'male' | 'female'
  aiRole: string | null
  userName: string | null
  userMood: 'positive' | 'negative' | 'neutral'
  userChoices: Record<string, string>
  keyFacts: string[]
  scenarioRoles: {
    aiRole: 'seeker' | 'helper' | null
    userRole: 'seeker' | 'helper' | null
    aiNeed: string | null
  }
  branchStack: Array<{
    branchId: string
    triggeredAt: number
    returnTo: number
    reason: 'clarification' | 'contradiction' | 'user-question'
  }>
  scriptProgress: {
    totalScriptPieces: number
    coveredIndices: number[]
    skippedIndices: Array<{
      index: number
      reason: string
      timestamp: number
    }>
    currentScriptIndex: number
    currentActualIndex: number
  }
  inBranch: boolean
  branchDepth: number
  questionIndex: number
  totalQuestions: number
  lastCorrectAnswer: string | null
}

// ============================================================================
// State Extraction Utilities
// ============================================================================

/**
 * Extract user's name from their answer
 */
function extractUserName(answer: string): string | null {
  const patterns = [
    /(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]+)(?:\s|,|\.|\!|$)/,  // Name at start of sentence
  ]
  
  for (const pattern of patterns) {
    const match = answer.match(pattern)
    if (match && match[1]) {
      const name = match[1]
      // Filter out common non-name words
      const commonWords = ['yes', 'no', 'okay', 'fine', 'good', 'bad', 'well', 'not', 'the', 'and']
      if (!commonWords.includes(name.toLowerCase())) {
        return name
      }
    }
  }
  return null
}

/**
 * Extract AI character name from conversation pieces
 */
function extractAIName(pieces: string[]): string | null {
  for (const piece of pieces) {
    const match = piece.match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+)/i)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

/**
 * Extract AI role from conversation pieces
 */
function extractAIRole(pieces: string[]): string | null {
  for (const piece of pieces) {
    const rolePatterns = [
      /i(?:'m| am) a\s+(form\s*\d+\s*student|student|teacher|doctor|pharmacist|nurse)/i,
      /i(?:'m| am) (?:also\s+)?(form\s*\d+|in form\s*\d+)/i,
    ]
    for (const pattern of rolePatterns) {
      const match = piece.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
  }
  return null
}

/**
 * Detect user mood from their answer
 */
function detectMood(answer: string): 'positive' | 'negative' | 'neutral' {
  const lower = answer.toLowerCase()
  
  const negativePatterns = /(bad|sad|not good|unhappy|bored|tired|upset|angry|lonely|terrible|awful|worst|hate|scared|scary|nervous|difficult|hard|stressed|worried|sick|ill|pain|hurt|died|passed away|lost|divorce|no money|can't afford|financial)/i
  const positivePatterns = /(good|great|fine|happy|excellent|amazing|wonderful|awesome|nice|fantastic|love|excited|fun|enjoy|glad|pleased|beautiful|best)/i
  
  if (negativePatterns.test(lower)) return 'negative'
  if (positivePatterns.test(lower)) return 'positive'
  return 'neutral'
}

/**
 * Extract key facts from user's answer
 */
function extractKeyFacts(answer: string, currentPiece: string): string[] {
  const facts: string[] = []
  const lower = answer.toLowerCase()
  
  // Age extraction
  const ageMatch = answer.match(/(?:i am|i'm|am)\s*(\d+)(?:\s*years?\s*old)?/i)
  if (ageMatch) {
    facts.push(`user is ${ageMatch[1]} years old`)
  }
  
  // Subject/favorite extraction
  if (/favorite|favourite|like|love/i.test(currentPiece)) {
    const subjectMatch = answer.match(/(?:i like|i love|my (?:favorite|favourite) is|it's)\s+([a-z]+)/i)
    if (subjectMatch) {
      facts.push(`user likes ${subjectMatch[1]}`)
    }
  }
  
  // Form/class extraction
  const formMatch = answer.match(/(?:i am|i'm|am)\s+(?:in\s+)?(?:form\s*)?(\d+|one|two|three|four)/i)
  if (formMatch) {
    facts.push(`user is in Form ${formMatch[1]}`)
  }
  
  // Living situation
  if (/live with|who do you live/i.test(currentPiece)) {
    const livingMatch = answer.match(/(?:i live with|with)\s+(.+?)(?:\.|$)/i)
    if (livingMatch) {
      facts.push(`user lives with ${livingMatch[1]}`)
    }
  }
  
  return facts
}

/**
 * Extract user choices from choice questions
 */
function extractUserChoice(answer: string, currentPiece: string): { key: string; value: string } | null {
  const lower = answer.toLowerCase()
  const pieceLower = currentPiece.toLowerCase()
  
  // Detect choice questions (contains "or")
  if (!/\bor\b/i.test(pieceLower)) return null
  
  // Common choice patterns
  const choicePatterns: { pattern: RegExp; key: string }[] = [
    { pattern: /\b(pharmacy|chemist)\b/i, key: 'destination' },
    { pattern: /\b(clinic|hospital|doctor)\b/i, key: 'destination' },
    { pattern: /\b(mobile money|cash|card|mpesa|airtel money)\b/i, key: 'paymentMethod' },
    { pattern: /\b(study|work|school|job)\b/i, key: 'activity' },
    { pattern: /\b(yes|no)\b/i, key: 'decision' },
  ]
  
  for (const { pattern, key } of choicePatterns) {
    const match = lower.match(pattern)
    if (match) {
      return { key, value: match[1] }
    }
  }
  
  return null
}

/**
 * Detect if this is a "user is expert" scenario
 * In these cases, the user's answer is authoritative and should be accepted
 */
function isUserExpertScenario(currentPiece: string): { isExpert: boolean; type: string | null } {
  const pieceLower = currentPiece.toLowerCase()
  
  // AI asking for directions
  const directionsPatterns = [
    /where (?:is|can i find|do i find|can i get)/i,
    /how (?:do i|can i) (?:get|go|find|reach)/i,
    /which way (?:is|to|should)/i,
    /can you (?:tell me|show me|help me find)/i,
    /i(?:'m| am) (?:looking for|trying to find)/i,
  ]
  
  for (const pattern of directionsPatterns) {
    if (pattern.test(pieceLower)) {
      return { isExpert: true, type: 'directions' }
    }
  }
  
  // AI asking for help/advice
  const helpPatterns = [
    /can you help me/i,
    /what should i (?:do|say|buy|take)/i,
    /should i (?:go|buy|take|do)/i,
    /what do you (?:think|suggest|recommend)/i,
    /do you know (?:where|how|what|when)/i,
  ]
  
  for (const pattern of helpPatterns) {
    if (pattern.test(pieceLower)) {
      return { isExpert: true, type: 'advice' }
    }
  }
  
  // AI asking for information the user would know
  const infoPatterns = [
    /how long (?:will|does|would) it take/i,
    /what time (?:do|does|is)/i,
    /is there a .* near/i,
    /do they (?:accept|have|sell)/i,
  ]
  
  for (const pattern of infoPatterns) {
    if (pattern.test(pieceLower)) {
      return { isExpert: true, type: 'information' }
    }
  }
  
  return { isExpert: false, type: null }
}

/**
 * Detect scenario roles from conversation pieces
 * Determines if AI is seeking help (seeker) or providing help (helper)
 * Returns null for both roles if it's just a casual conversation
 */
function detectScenarioRoles(conversationPieces: string[]): {
  aiRole: 'seeker' | 'helper' | null
  userRole: 'seeker' | 'helper' | null
  aiNeed: string | null
} {
  // Only analyze first 2-3 pieces to determine scenario type
  const firstPieces = conversationPieces.slice(0, 3).join(' ').toLowerCase()
  
  // Patterns indicating AI is seeking help/information
  const aiSeekerPatterns = [
    { pattern: /(?:do you know where|can you (?:help|tell) me where|where can i (?:buy|find|get))\s+(?:a\s+)?([^?]+)/i, type: 'location' },
    { pattern: /(?:i need|i'm looking for|i want to (?:buy|find|get))\s+(?:a\s+)?([^.?]+)/i, type: 'item' },
    { pattern: /(?:can you help me|could you help me|i need help with)\s+([^?]+)/i, type: 'help' },
    { pattern: /(?:how do i|where do i|which way to)\s+([^?]+)/i, type: 'directions' },
  ]
  
  for (const { pattern, type } of aiSeekerPatterns) {
    const match = firstPieces.match(pattern)
    if (match) {
      const need = match[1]?.trim() || type
      return {
        aiRole: 'seeker',
        userRole: 'helper',
        aiNeed: need,
      }
    }
  }
  
  // Patterns indicating AI is providing help/teaching
  const aiHelperPatterns = [
    /let me (?:help|show|teach|explain)/i,
    /i can (?:help|show|teach|explain)/i,
    /i'm here to (?:help|teach|guide)/i,
    /today (?:i'll|we'll) (?:learn|study|practice)/i,
  ]
  
  for (const pattern of aiHelperPatterns) {
    if (pattern.test(firstPieces)) {
      return {
        aiRole: 'helper',
        userRole: 'seeker',
        aiNeed: null,
      }
    }
  }
  
  // No clear helper/seeker pattern - just casual conversation
  return {
    aiRole: null,
    userRole: null,
    aiNeed: null,
  }
}

/**
 * Detect if user's answer should trigger a conversation branch
 * Returns branch info if branching is needed
 */
function detectBranch(
  userAnswer: string,
  currentPiece: string,
  nextPiece: string | null,
  state: ConversationState
): {
  isBranch: boolean
  branchType: 'clarification' | 'contradiction' | 'user-question' | null
  branchPrompt: string | null
} {
  const answerLower = userAnswer.toLowerCase().trim()
  const currentLower = currentPiece.toLowerCase()
  
  // 1. Clarification questions (user asking for more details before answering)
  const clarificationPatterns = [
    /how\s+(often|frequent|many|much|long)/i,
    /when\s+(do|does|did|will|would)/i,
    /where\s+exactly/i,
    /what\s+(kind|type|do you mean)/i,
    /before\s+i\s+answer/i,
    /can\s+you\s+(tell|explain|clarify)/i,
  ]
  
  for (const pattern of clarificationPatterns) {
    if (pattern.test(userAnswer)) {
      return {
        isBranch: true,
        branchType: 'clarification',
        branchPrompt: `The user asked a clarifying question: "${userAnswer}". Generate a natural, conversational answer that provides the requested information, then smoothly returns to asking the original question again.`,
      }
    }
  }
  
  // 2. Contradiction branches (user says "no" when script expects "yes")
  const isNegativeAnswer = /^(no|nope|nah|not really|i don't think so|i'm not)\b/i.test(answerLower)
  const isPositiveQuestion = /are you|do you|did you|have you|will you/i.test(currentLower)
  
  if (isNegativeAnswer && isPositiveQuestion && nextPiece) {
    // Check if the next piece assumes a positive answer
    const assumesPositive = nextPiece.length > 0
    if (assumesPositive) {
      return {
        isBranch: true,
        branchType: 'contradiction',
        branchPrompt: `The user answered "no" to "${currentPiece}" but the script expected "yes". Generate a follow-up question to explore the user's actual situation (e.g., if asked "Are you Form 1?" and they said "no", ask "What form are you in?").`,
      }
    }
  }
  
  // 3. User questions about AI's situation (when AI is seeker, user asks for context)
  if (state.scenarioRoles.aiRole === 'seeker') {
    const userAskingAboutAI = [
      /(?:how|what|when|where|why)\s+(?:do you|are you|will you|is your)/i,
      /tell me (?:about|more)/i,
      /what(?:'s| is) your/i,
    ]
    
    for (const pattern of userAskingAboutAI) {
      if (pattern.test(userAnswer)) {
        return {
          isBranch: true,
          branchType: 'user-question',
          branchPrompt: `The user asked about the AI's situation: "${userAnswer}". Generate a response that answers their question from the AI's perspective (AI is seeking ${state.scenarioRoles.aiNeed}), then transition back to the conversation.`,
        }
      }
    }
  }
  
  return {
    isBranch: false,
    branchType: null,
    branchPrompt: null,
  }
}

/**
 * Detect if the next script piece should be skipped
 * Returns skip info with mandatory reasoning
 */
function detectSkip(
  nextScriptPiece: string | null,
  state: ConversationState,
  conversationContext: string[]
): {
  shouldSkip: boolean
  skipIndices: number[]
  reason: string
} {
  if (!nextScriptPiece) {
    return { shouldSkip: false, skipIndices: [], reason: '' }
  }
  
  // Safety check: Don't skip if already skipped too many
  const MAX_SKIPS = 3
  const currentSkipCount = state.scriptProgress.skippedIndices.length
  if (currentSkipCount >= MAX_SKIPS) {
    return { shouldSkip: false, skipIndices: [], reason: '' }
  }
  
  // Safety check: Don't skip more than 30% of script
  const skipPercentage = currentSkipCount / state.scriptProgress.totalScriptPieces
  if (skipPercentage > 0.3) {
    return { shouldSkip: false, skipIndices: [], reason: '' }
  }
  
  const nextLower = nextScriptPiece.toLowerCase()
  const currentIndex = state.scriptProgress.currentScriptIndex
  
  // Pattern 1: "First day at school" question when user is not Form 1
  if (/first\s+day/.test(nextLower) && /school|form|secondary/.test(nextLower)) {
    // Check if user is Form 1
    const isForm1 = state.keyFacts.some(fact => /form\s*1/i.test(fact))
    const isHigherForm = state.keyFacts.some(fact => /form\s*[2-4]/i.test(fact))
    
    if (isHigherForm && !isForm1) {
      return {
        shouldSkip: true,
        skipIndices: [currentIndex + 1, currentIndex + 2], // Skip Q&A pair
        reason: `User is in Form 2-4, not Form 1. 'First day at secondary school' question no longer relevant (already happened years ago).`,
      }
    }
  }
  
  // Pattern 2: Redundant questions about info already established
  if (/what\s+(?:is|'s)\s+your\s+name/i.test(nextLower) && state.userName) {
    return {
      shouldSkip: true,
      skipIndices: [currentIndex + 1],
      reason: `User already introduced themselves as "${state.userName}". Asking name again is redundant.`,
    }
  }
  
  if (/(?:are you|what)\s+form/i.test(nextLower)) {
    const userFormKnown = state.keyFacts.some(fact => /form\s*\d/i.test(fact))
    if (userFormKnown) {
      return {
        shouldSkip: true,
        skipIndices: [currentIndex + 1],
        reason: `User's form level already established: ${state.keyFacts.find(f => /form\s*\d/i.test(f))}`,
      }
    }
  }
  
  // Pattern 3: Context-specific skips based on scenario roles
  if (state.scenarioRoles.aiRole === 'seeker') {
    // If AI is seeking help, skip questions that flip the dynamic
    if (/what\s+(?:do you|are you)\s+(?:need|want|looking for)/i.test(nextLower)) {
      return {
        shouldSkip: true,
        skipIndices: [currentIndex + 1],
        reason: `AI is the seeker (needs ${state.scenarioRoles.aiNeed}), not the user. Question flips the role dynamic.`,
      }
    }
  }
  
  return { shouldSkip: false, skipIndices: [], reason: '' }
}

// ============================================================================
// Branch Stack Management
// ============================================================================

/**
 * Push a new branch onto the stack
 */
function pushBranch(
  state: ConversationState,
  branchType: 'clarification' | 'contradiction' | 'user-question',
  triggeredAt: number,
  returnTo: number
): void {
  const branchId = `branch-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  state.branchStack.push({
    branchId,
    triggeredAt,
    returnTo,
    reason: branchType,
  })
  
  state.inBranch = true
  state.branchDepth = state.branchStack.length
  
  console.log(`[conversation-branch] Pushed branch: ${branchId} (type: ${branchType}, depth: ${state.branchDepth})`)
}

/**
 * Pop the most recent branch from the stack
 */
function popBranch(state: ConversationState): number | null {
  const branch = state.branchStack.pop()
  
  if (!branch) {
    console.log('[conversation-branch] No branch to pop')
    return null
  }
  
  state.branchDepth = state.branchStack.length
  state.inBranch = state.branchStack.length > 0
  
  console.log(`[conversation-branch] Popped branch: ${branch.branchId}, returning to index ${branch.returnTo}`)
  
  return branch.returnTo
}

/**
 * Check if we should return from the current branch
 * Branch is resolved when user provides a satisfactory answer
 */
function shouldReturnFromBranch(
  state: ConversationState,
  userAnswer: string
): boolean {
  if (!state.inBranch || state.branchStack.length === 0) {
    return false
  }
  
  const currentBranch = state.branchStack[state.branchStack.length - 1]
  const answerLower = userAnswer.toLowerCase().trim()
  
  // Branch is resolved if:
  // 1. User provided a substantive answer (not another question)
  // 2. Answer is not too short (more than 2 words usually)
  const isQuestion = /\?$/.test(userAnswer) || /^(what|when|where|why|how|who)/i.test(userAnswer)
  const isSubstantive = userAnswer.split(/\s+/).length >= 2
  
  if (!isQuestion && isSubstantive) {
    console.log(`[conversation-branch] Branch ${currentBranch.branchId} resolved by user answer`)
    return true
  }
  
  return false
}

/**
 * Get the next script piece index, skipping any that should be skipped
 */
function getNextScriptPiece(
  state: ConversationState,
  conversationPieces: string[]
): { index: number; piece: string | null } {
  let nextIndex = state.scriptProgress.currentScriptIndex + 1
  
  // Skip over any indices that should be skipped
  while (nextIndex < conversationPieces.length) {
    const isSkipped = state.scriptProgress.skippedIndices.some(skip => skip.index === nextIndex)
    if (!isSkipped) {
      return {
        index: nextIndex,
        piece: conversationPieces[nextIndex] || null,
      }
    }
    nextIndex++
  }
  
  return { index: nextIndex, piece: null }
}

/**
 * Generate a branch response using OpenAI
 * This creates a contextual answer to the user's clarifying question
 */
async function generateBranchResponse(
  branchPrompt: string,
  userQuestion: string,
  currentPiece: string,
  nextPiece: string | null,
  state: ConversationState,
  openaiApiKey: string
): Promise<string> {
  const context = `
AI Character: ${state.aiName || 'Unknown'}
AI Gender: ${state.aiGender}
AI Role: ${state.aiRole || 'student'}
Scenario Role: ${state.scenarioRoles.aiRole || 'casual conversation'}
${state.scenarioRoles.aiNeed ? `AI's Need: ${state.scenarioRoles.aiNeed}` : ''}

Recent Context:
- Current conversation piece: "${currentPiece}"
- User asked: "${userQuestion}"

Key Facts:
${state.keyFacts.slice(-5).join('\n- ')}
`.trim()

  const prompt = `${branchPrompt}

CONTEXT:
${context}

CURRENT QUESTION: "${currentPiece}"
${nextPiece ? `NEXT QUESTION (if needed): "${nextPiece}"` : ''}
USER'S RESPONSE: "${userQuestion}"

DECISION POINT - EVALUATE RELEVANCE:
First, determine if "${currentPiece}" is still relevant given the user's response.

OPTION A - Return to Current Question (if still relevant):
- The user just needs clarification
- The question still makes sense to ask
- Example: User asks "what do you mean?" → Clarify and re-ask
- Format: "[Clarification]. [Current question rephrased]"

OPTION B - Skip to Next Question (if current is no longer relevant):
- The user's response makes the current question obsolete
- The context has changed making current question inappropriate
- Example: Current asks "first day at school?" but user says "I've been here 3 years" → Skip it
- Format: "[Acknowledge]. ${nextPiece || 'Let me ask something else'}"

INSTRUCTIONS:
1. Analyze if current question is still appropriate
2. Answer the user's question/concern naturally (1-2 sentences)
3. Stay in character (gender: ${state.aiGender}, role: ${state.aiRole || 'student'})
4. Either return to current question OR skip to next based on relevance
5. Do NOT use quotes around your response

Example A (Clarification - Return to Current):
Current: "Why do you like Tigo?"
User: "what do you mean?"
Response: "I'm asking why you think Tigo has the best internet. What's your reason for choosing Tigo?"

Example B (Context Changed - Skip to Next):
Current: "How was your first day at school?"
User: "I've been here for 3 years, not a first day student"
Response: "Oh, you've been here a while! In that case, what's your favorite subject?"

Generate the branch response:`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI conversation partner helping practice English. Be natural, friendly, and concise.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate branch response')
    }

    const data = await response.json()
    const branchResponse = data.choices[0]?.message?.content?.trim() || ''
    
    console.log(`[conversation-branch] Generated response: ${branchResponse}`)
    
    return branchResponse
  } catch (error) {
    console.error('[conversation-branch] Error generating response:', error)
    // Fallback response
    return `Let me think about that... Anyway, let's continue with our conversation.`
  }
}

/**
 * Check if conversation is complete based on script coverage
 * Instead of checking if we reached the last piece linearly,
 * we check if we've covered enough of the script (with branches and skips)
 */
function isConversationComplete(state: ConversationState): {
  isComplete: boolean
  progress: number
  covered: number
  skipped: number
  total: number
} {
  const covered = state.scriptProgress.coveredIndices.length
  const skipped = state.scriptProgress.skippedIndices.length
  const total = state.scriptProgress.totalScriptPieces
  const progress = (covered + skipped) / total
  
  const branchesResolved = state.branchStack.length === 0
  const minProgress = 0.85 // Must cover or skip 85% of script
  
  const isComplete = progress >= minProgress && branchesResolved
  
  return {
    isComplete,
    progress,
    covered,
    skipped,
    total,
  }
}

/**
 * Extract direction-related content from user's answer
 */
function extractDirections(answer: string): string | null {
  const lower = answer.toLowerCase()
  
  // Common direction patterns
  const patterns = [
    /(go |turn |take |walk |head )?(straight|left|right|north|south|east|west)/gi,
    /(at the |near the |past the |after the )?(\w+\s)?(lights?|corner|intersection|building|shop|store|street|road)/gi,
    /(\d+)\s*(minutes?|meters?|metres?|km|kilometers?|kilometres?|blocks?)/gi,
  ]
  
  const parts: string[] = []
  for (const pattern of patterns) {
    const matches = answer.match(pattern)
    if (matches) {
      parts.push(...matches)
    }
  }
  
  return parts.length > 0 ? parts.join(' ').trim() : null
}

/**
 * Build compact context string from state (replaces full history)
 */
function buildCompactContext(state: ConversationState): string {
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
// Main Handler
// ============================================================================
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const {
      conversationContext = [],
      currentPiece = '',
      currentIndex = 0,
      userAnswer = '',
      // NEW: Accept compact state instead of full history
      conversationState = null,
      // DEPRECATED: Keep for backward compatibility
      conversationHistory = [],
    } = body

    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'User answer is required'
      })
    }

    if (!currentPiece || conversationContext.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Conversation context and current piece are required'
      })
    }

    // Initialize or use provided state
    let state: ConversationState = conversationState || {
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
        totalScriptPieces: conversationContext.length,
        coveredIndices: [],
        skippedIndices: [],
        currentScriptIndex: currentIndex,
        currentActualIndex: currentIndex,
      },
      inBranch: false,
      branchDepth: 0,
      questionIndex: currentIndex,
      totalQuestions: conversationContext.length,
      lastCorrectAnswer: null,
    }

    // Ensure scenarioRoles exists (for backward compatibility with old state objects)
    if (!state.scenarioRoles) {
      state.scenarioRoles = {
        aiRole: null,
        userRole: null,
        aiNeed: null,
      }
    }
    
    // Ensure branchStack exists (for backward compatibility)
    if (!state.branchStack) {
      state.branchStack = []
    }
    
    // Ensure scriptProgress exists (for backward compatibility)
    if (!state.scriptProgress) {
      state.scriptProgress = {
        totalScriptPieces: conversationContext.length,
        coveredIndices: [],
        skippedIndices: [],
        currentScriptIndex: currentIndex,
        currentActualIndex: currentIndex,
      }
    }
    
    // Ensure branch state fields exist
    if (state.inBranch === undefined) {
      state.inBranch = false
    }
    if (state.branchDepth === undefined) {
      state.branchDepth = 0
    }
    
    // Extract AI info if not already set
    if (!state.aiName) {
      state.aiName = extractAIName(conversationContext)
    }
    if (!state.aiRole) {
      state.aiRole = extractAIRole(conversationContext)
    }

    // TODO: Replace with actual API endpoint when backend is ready
    const config = useRuntimeConfig()
    const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''

    if (!openaiApiKey) {
      throw createError({
        statusCode: 500,
        message: 'OpenAI API key not configured'
      })
    }

    // ========================================================================
    // BRANCHING LOGIC: Check if user's answer triggers a branch
    // ========================================================================
    
    // Get next piece (considering skips)
    let nextPiece = currentIndex < conversationContext.length - 1
      ? conversationContext[currentIndex + 1]
      : null
    
    // Check if we should branch
    const branchInfo = detectBranch(userAnswer, currentPiece, nextPiece, state)
    
    // Safety check: Limit branch depth
    const MAX_BRANCH_DEPTH = 2
    const MAX_TOTAL_BRANCHES = 5
    
    if (branchInfo.isBranch && state.branchDepth < MAX_BRANCH_DEPTH && state.branchStack.length < MAX_TOTAL_BRANCHES) {
      console.log(`[conversation-branch] Branch detected: ${branchInfo.branchType}`)
      
      // Generate branch response (AI will decide whether to return to question or skip)
      const branchResponse = await generateBranchResponse(
        branchInfo.branchPrompt!,
        userAnswer,
        currentPiece,
        nextPiece,
        state,
        openaiApiKey
      )
      
      // Check if AI decided to skip the current question
      // If branch response contains the next piece, AI decided to skip
      const aiSkippedCurrent = nextPiece && branchResponse.includes(nextPiece.substring(0, 30))
      
      if (aiSkippedCurrent) {
        console.log(`[conversation-skip] AI intelligently skipped current question: ${currentIndex}`)
        state.scriptProgress.skippedIndices.push({
          index: currentIndex,
          reason: `Question no longer relevant after user response: "${userAnswer}"`,
          timestamp: Date.now(),
        })
      } else {
        // Push branch to stack (will return to current question)
        pushBranch(state, branchInfo.branchType!, currentIndex, currentIndex + 1)
      }
      
      // Return branch response immediately
      return {
        success: true,
        isCorrect: true,
        feedback: 'Great question! Let me answer that.',
        adaptedResponse: branchResponse,
        enrichedState: state,
      }
    }
    
    // Check if we should return from current branch
    if (shouldReturnFromBranch(state, userAnswer)) {
      const returnToIndex = popBranch(state)
      if (returnToIndex !== null) {
        // Update state to return to main script
        state.scriptProgress.currentScriptIndex = returnToIndex - 1
        // Continue with normal validation
      }
    }
    
    // Check if next piece should be skipped
    const skipInfo = detectSkip(nextPiece, state, conversationContext)
    if (skipInfo.shouldSkip) {
      console.log(`[conversation-skip] Skipping indices: ${skipInfo.skipIndices.join(', ')} - ${skipInfo.reason}`)
      
      // Add to skipped indices
      for (const index of skipInfo.skipIndices) {
        state.scriptProgress.skippedIndices.push({
          index,
          reason: skipInfo.reason,
          timestamp: Date.now(),
        })
      }
      
      // Get the next non-skipped piece
      const nextAvailable = getNextScriptPiece(state, conversationContext)
      nextPiece = nextAvailable.piece
    }
    
    // Check if conversation is complete based on coverage
    const completionStatus = isConversationComplete(state)
    if (completionStatus.isComplete && !nextPiece) {
      console.log(`[conversation-complete] Covered: ${completionStatus.covered}/${completionStatus.total}, Skipped: ${completionStatus.skipped}`)
      
      // Generate closing statement
      const userName = state.userName ? `, ${state.userName}` : ''
      const closingStatement = `Thank you very much${userName}! We covered ${completionStatus.covered} topics together. It was wonderful practicing with you!`
      
      return {
        success: true,
        isCorrect: true,
        feedback: closingStatement,
        adaptedResponse: closingStatement,
        enrichedState: state,
      }
    }
    
    // ========================================================================
    // NORMAL VALIDATION FLOW (when not branching)
    // ========================================================================
    
    // Build compact context instead of full history
    const compactContext = buildCompactContext(state)

    // For backward compatibility, also support old format
    const previousContext = conversationHistory.length > 0
      ? conversationHistory.map((item: any) => `AI: ${item.ai}\nUser: ${item.user || '(no response)'}`).join('\n\n')
      : null

    // Detect if user is the "expert" in this scenario
    const expertScenario = isUserExpertScenario(currentPiece)
    const userDirections = expertScenario.isExpert ? extractDirections(userAnswer) : null

    // Build validation prompt with compact state
    const validationPrompt = `You are evaluating an English conversation practice session for beginner-level students. Be LENIENT, encouraging, and teacher-like.

**CONVERSATION STATE (Compact Memory):**
${compactContext}

**CURRENT CONTEXT:**
- Current conversation piece (what AI just said): "${currentPiece}"
${nextPiece ? `- Next conversation piece (scripted response - may need adaptation): "${nextPiece}"` : '- This is the last piece in the conversation'}
${expertScenario.isExpert ? `\n**IMPORTANT: USER IS THE EXPERT HERE** (type: ${expertScenario.type})` : ''}

**User's answer:** "${userAnswer}"

**IMPORTANT - USE THE COMPACT STATE:**
- The user's name is: ${state.userName || 'unknown'}
- The user's mood is: ${state.userMood}
- User has made these choices: ${JSON.stringify(state.userChoices)}
- Key facts about user: ${state.keyFacts.join(', ') || 'none yet'}
- If user previously chose something (e.g., "clinic" instead of "pharmacy"), ACKNOWLEDGE that choice and adapt accordingly
- If the next piece contradicts a user choice, ADAPT it to match what they said

**EVALUATION RULES:**
${expertScenario.isExpert ? `**CRITICAL - USER IS THE EXPERT:**
The AI is asking for help/directions/advice. The USER knows the answer, not the AI.
- ACCEPT any reasonable response from the user (they are the one giving information)
- If user says "turn right" instead of scripted "turn left" → ACCEPT IT (user knows where things are)
- If user gives different time estimates, prices, etc. → ACCEPT IT (user knows the local area)
- ADAPT the next piece to match what the user said, don't force the script
- Example: AI asks "Where is the pharmacy?" Script says "left", User says "right" → CORRECT, adapt to "right"
- Example: AI asks "How long to walk?" Script says "10 min", User says "5 min" → CORRECT, use "5 min"

` : ''}1) CONTEXTUALLY APPROPRIATE: The answer should make logical sense as a reply to the current piece.
2) COMPATIBILITY CHECK (using next piece): Only mark WRONG for DIRECT contradictions of REQUIRED FACTS.
   - Do NOT mark WRONG for emotional tone, opinions, or normal details.
   - Do NOT mark WRONG when user is the expert giving information
   - Examples (WRONG):
     - Current: "Are you a student here?" Next: "Which class are you in?" User: "No" → WRONG.
   - Examples (CORRECT):
     - Current: "How are you?" User: "Not good today." → CORRECT.
     - Current: "Are you a Form 1 student?" User: any YES → CORRECT.
     - Current: "Where is the pharmacy?" User: any directions → CORRECT (user knows).
3) DIALOGUE STRUCTURE: If the NEXT piece contains the AI ANSWERING a question, the user MUST have asked that question.
   - Detection patterns:
     - "I am [name]" → User should have asked about name
     - "I am [age] years old" → User should have asked about age
     - "My favorite is [thing]" → User should have asked about favorites
4) HUMOR IS OK when it still answers the question.
5) IF "WHY" IS ASKED: 
   - First check for reason keywords: "because", "since", "as", "due to", "thanks to", "for"
   - If no keywords, evaluate if answer contains reasoning/explanation
   - Examples WITH reasoning: "it's fun", "my dream job", "I enjoy it", "makes me happy", "I studied it"
   - Examples WITHOUT reasoning: just "physics", just "yes", just a name without explanation
   - Accept any answer that explains their reasoning, even without keywords
   - Return "hasReason": true/false in evaluation
6) Be lenient about grammar/spelling.

**CONTEXTUAL MEMORY & COHERENCE:**
- If user made a choice (e.g., "go to clinic"), ALWAYS acknowledge it
- You CAN politely disagree but MUST acknowledge what they said
- If next piece contradicts user's choice, ADAPT it to match
- NEVER pretend the user didn't make a choice

**ROLE COHERENCE:**
Scenario roles: AI is ${state.scenarioRoles.aiRole || 'casual'}, User is ${state.scenarioRoles.userRole || 'casual'}
${state.scenarioRoles.aiNeed ? `AI's need: ${state.scenarioRoles.aiNeed}` : ''}

CRITICAL - NEVER flip roles in adaptedResponse:
- If AI is 'seeker': AI is the one who NEEDS help. AI asks questions about THEIR need, user provides answers.
  * DO NOT ask user about their budget/preferences/needs when AI is the one seeking
  * Example WRONG: AI needs SIM card → "Do you have a budget?" (flips to user needing)
  * Example CORRECT: AI needs SIM card → "I need to buy a SIM card. Do you know where?"
- If AI is 'helper': AI provides information, user asks questions about their needs
- If both are null: Just casual conversation, no role restrictions

**TEACHER-LIKE FEEDBACK:**
- If correct: praise briefly and explain what was good
- If wrong due to dialogue structure: explain they need to ask the question first
- If wrong due to contradiction: guide them without giving the answer
- If wrong due to missing reason: ask for a reason

**COHERENCE CHECK (CRITICAL - before generating adaptedResponse):**
Before responding, you MUST verify your adaptedResponse does NOT:
1. Mention places/options the user DIDN'T suggest (e.g., if user said "pharmacy", don't mention "clinic")
2. Contradict user's choices stored in userChoices: ${JSON.stringify(state.userChoices)}
3. Claim the user said something they didn't say
4. Introduce alternatives that weren't part of the conversation

If the scripted next piece mentions something the user didn't choose, ADAPT it to match what the user said.
Example: Script says "clinic" but user chose "pharmacy" → Change to "pharmacy" in your response.

**ADAPTATION (when correct):**
- Return an adaptedResponse that integrates the next piece naturally
- Make it CONVERSATIONAL and COMPARATIVE - relate AI's answer to user's answer
- Acknowledge user's mood: negative → empathetic, positive → encouraging
- If user introduced themselves, greet them by name
- Compare similar answers (e.g., ages, favorites)
- ALWAYS respect user's established choices - never contradict them

Respond with JSON only:
{
  "evaluation": {
    "correct": boolean,
    "feedback": "teacher-like explanation",
    "contextuallyAppropriate": boolean,
    "compatibility": boolean,
    "hasReason": boolean | null  // Only set if question asks "why", otherwise null
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a conversation practice evaluator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: validationPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to validate answer')
    }

    const data = await response.json()
    const resultContent = data.choices[0]?.message?.content

    if (!resultContent) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(resultContent)

    // ========================================================================
    // State Enrichment: Update state based on model's extracted facts and our extraction
    // ========================================================================
    const enrichedState = { ...state }
    
    // Update from model's extraction
    const extractedFacts = result.extractedFacts || {}
    
    // Update user name
    if (extractedFacts.userName) {
      enrichedState.userName = extractedFacts.userName
    } else {
      const extractedName = extractUserName(userAnswer)
      if (extractedName) {
        enrichedState.userName = extractedName
      }
    }
    
    // Update mood
    if (extractedFacts.detectedMood) {
      enrichedState.userMood = extractedFacts.detectedMood
    } else {
      enrichedState.userMood = detectMood(userAnswer)
    }
    
    // Update user choices
    if (extractedFacts.userChoice) {
      enrichedState.userChoices[extractedFacts.userChoice.key] = extractedFacts.userChoice.value
    } else {
      const choice = extractUserChoice(userAnswer, currentPiece)
      if (choice) {
        enrichedState.userChoices[choice.key] = choice.value
      }
    }
    
    // Add key facts
    if (extractedFacts.keyFact) {
      if (!enrichedState.keyFacts.includes(extractedFacts.keyFact)) {
        enrichedState.keyFacts.push(extractedFacts.keyFact)
      }
    }
    const localFacts = extractKeyFacts(userAnswer, currentPiece)
    for (const fact of localFacts) {
      if (!enrichedState.keyFacts.includes(fact)) {
        enrichedState.keyFacts.push(fact)
      }
    }
    
    // Limit key facts to last 10 to keep state compact
    if (enrichedState.keyFacts.length > 10) {
      enrichedState.keyFacts = enrichedState.keyFacts.slice(-10)
    }
    
    // Initialize scenario roles on first question
    if (currentIndex === 0 && (!enrichedState.scenarioRoles || enrichedState.scenarioRoles.aiRole === null)) {
      const detectedRoles = detectScenarioRoles(conversationContext)
      enrichedState.scenarioRoles = detectedRoles
      console.log('[conversation-validate] Detected scenario roles:', detectedRoles)
    }

    // ========================================================================
    // Process Validation Result
    // ========================================================================
    const evalBlock = (result as any).evaluation || {}
    const uaLower = String(userAnswer || '').toLowerCase()
    
    let compatibilityFlag = typeof evalBlock.compatibility === 'boolean' ? evalBlock.compatibility : true
    if (compatibilityFlag === false && evalBlock.contextuallyAppropriate === true && !/\b(no|not|n't)\b/.test(uaLower)) {
      compatibilityFlag = true
    }

    const modelIsCorrectRaw =
      typeof result.isCorrect === 'boolean'
        ? result.isCorrect
        : typeof evalBlock.correct === 'boolean'
          ? evalBlock.correct
          : typeof evalBlock.correctness === 'string'
            ? ['correct', 'right', 'true'].includes(evalBlock.correctness.toLowerCase())
            : typeof evalBlock.result === 'string'
              ? ['correct', 'right', 'true'].includes(evalBlock.result.toLowerCase())
              : false

    // USER IS EXPERT OVERRIDE: If user is the expert, accept any reasonable answer
    // and store their answer as authoritative
    let userExpertOverride = false
    if (expertScenario.isExpert) {
      // Check if user gave a meaningful response (not empty, not just "yes/no/okay")
      const meaningfulResponse = userAnswer.trim().length > 3 && 
        !/^(yes|no|okay|ok|sure|fine|um|uh)$/i.test(userAnswer.trim())
      
      if (meaningfulResponse) {
        userExpertOverride = true
        
        // Store user's expert answer for future reference
        if (expertScenario.type === 'directions' && userDirections) {
          enrichedState.userChoices['userDirections'] = userDirections
          enrichedState.keyFacts.push(`user gave directions: ${userDirections}`)
        } else if (expertScenario.type === 'advice') {
          enrichedState.keyFacts.push(`user advised: ${userAnswer.substring(0, 50)}`)
        } else if (expertScenario.type === 'information') {
          enrichedState.keyFacts.push(`user said: ${userAnswer.substring(0, 50)}`)
        }
      }
    }

    const derivedIsCorrect =
      userExpertOverride ||  // User is expert - accept their answer
      modelIsCorrectRaw ||
      (evalBlock.contextuallyAppropriate === true && compatibilityFlag === true)

    const modelFeedback =
      result.feedback ||
      evalBlock.feedback ||
      (derivedIsCorrect ? 'Correct!' : 'This is wrong. Try again.')

    const extractAdapted = (val: any): string | null => {
      if (typeof val === 'string') return val
      if (val && typeof val === 'object' && typeof val.response === 'string') return val.response
      return null
    }

    const modelAdapted =
      extractAdapted(result.adaptedResponse) ??
      extractAdapted(evalBlock.adaptedResponse)

    // Build final adapted response with fallbacks
    let finalAdapted: string | null = null
    if (nextPiece && derivedIsCorrect) {
      const next = String(nextPiece).trim()
      const negTone = /(bad|sad|not good|unhappy|bored|tired|upset|angry|lonely|terrible|awful|worst)/i
      const posTone = /(good|fine|great|happy|excellent|amazing|wonderful|awesome|nice|fantastic|love)/i
      
      finalAdapted = modelAdapted || next
      
      // USER IS EXPERT: If user gave expert info, adapt the script to use their answer
      if (userExpertOverride && expertScenario.isExpert) {
        // The AI model should have already adapted, but let's make sure we acknowledge user's info
        if (!modelAdapted || modelAdapted.toLowerCase() === next.toLowerCase()) {
          let prefix = "Got it!"
          if (expertScenario.type === 'directions') {
            prefix = "Okay, I'll follow your directions!"
          } else if (expertScenario.type === 'advice') {
            prefix = "Thanks for the advice!"
          } else if (expertScenario.type === 'information') {
            prefix = "Thanks for letting me know!"
          }
          
          // Adapt next piece to acknowledge user's expert input
          finalAdapted = `${prefix} ${next}`
        }
      }
      // Add prefix if adapted response is bare
      else if (finalAdapted && finalAdapted.toLowerCase() === next.toLowerCase()) {
        let prefix = "Okay!"
        if (enrichedState.userMood === 'negative' || negTone.test(uaLower)) {
          prefix = "I'm sorry to hear that."
        } else if (enrichedState.userMood === 'positive' || posTone.test(uaLower)) {
          prefix = "That's great!"
        }
        
        // Add name greeting if we just learned their name
        if (enrichedState.userName && !state.userName) {
          prefix = `Nice to meet you, ${enrichedState.userName}!`
        }
        
        finalAdapted = `${prefix} ${next}`
      }
    }

    // Handle last question
    const isLastQuestion = !nextPiece
    let finalFeedback = modelFeedback
    
    if (isLastQuestion) {
      const hasNegative = /\b(no|not|nope|nah|don't|sorry)\b/i.test(userAnswer)
      
      let closingStatement = ''
      if (hasNegative) {
        closingStatement = "I understand. That's okay! It was nice talking with you. Thank you for practicing with me."
      } else {
        const userName = enrichedState.userName ? `, ${enrichedState.userName}` : ''
        closingStatement = `Thank you very much${userName}! It was wonderful talking with you. I'm glad we could practice together!`
      }
      
      finalFeedback = closingStatement
      
      // Update state for last answer
      enrichedState.lastCorrectAnswer = userAnswer
      enrichedState.questionIndex = currentIndex

      console.info('[conversation-validate] decision', {
        currentPiece,
        nextPiece,
        userAnswer,
        isLastQuestion: true,
        enrichedState,
      })

      return {
        success: true,
        isCorrect: true,
        feedback: finalFeedback,
        adaptedResponse: closingStatement,
        enrichedState, // Return updated state
      }
    }

    // Process follow-up for "why" questions - Two-tier system
    const asksWhy = (txt: string): boolean => /[^?]*\bwhy\b[^?]*\?/i.test(txt)
    const needsReason = asksWhy(currentPiece)
    
    // Tier 1: Fast keyword check (catches ~90% of cases)
    const reasonKeywords = /\b(because|since|as|due to|thanks to|because of|for)\b/i
    const hasTier1Reason = reasonKeywords.test(userAnswer)
    
    // Tier 2: AI evaluation (catches edge cases like "it's fun", "my dream")
    const hasTier2Reason = result.evaluation?.hasReason === true
    
    // Combined: Has reason if either tier detects it
    const hasReason = hasTier1Reason || hasTier2Reason
    
    console.log(`[conversation-why] needsReason: ${needsReason}, tier1: ${hasTier1Reason}, tier2: ${hasTier2Reason}, hasReason: ${hasReason}`)
    
    let finalIsCorrect = derivedIsCorrect
    let followUpInsert: string | null = null
    let finalAdaptedResponse = nextPiece && derivedIsCorrect ? finalAdapted : null

    // Feedback adjustments
    const isModelNegative = /wrong|contradict|doesn['']?t match/i.test(String(modelFeedback))
    const hasSeriousHardship = /(passed away|died|loss|divorce|financial trouble)/i.test(userAnswer)
    
    finalFeedback = derivedIsCorrect && isModelNegative && hasSeriousHardship
      ? "Thanks for sharing. I'm sorry to hear that."
      : derivedIsCorrect && isModelNegative
        ? "Great job answering the question!"
        : modelFeedback

    // Handle missing "why" reason
    const isDialogueStructureError = /proper conversation.*need to ask|didn't ask.*question/i.test(String(modelFeedback))
    const cantAnswer = /\b(wouldn't know|don't know|not sure|no idea|can't tell|not a doctor)\b/i.test(userAnswer)
    
    // Don't ask "why" again if current piece is already a "why" follow-up
    const isAlreadyWhyFollowUp = /^(could you tell me why|why do you)/i.test(currentPiece)
    
    if (needsReason && derivedIsCorrect && !hasReason && !isDialogueStructureError && !cantAnswer && !isAlreadyWhyFollowUp) {
      const whyMatch = currentPiece.match(/why\s+(?:do\s+you\s+)?(like|think|prefer|choose|want|enjoy)\s+([^?]+)/i)
      if (whyMatch) {
        followUpInsert = `Why do you ${whyMatch[1]} ${whyMatch[2].trim()}?`
      } else {
        followUpInsert = 'Could you tell me why?'
      }
      finalIsCorrect = true
    }

    // Update state for successful answer
    if (finalIsCorrect) {
      enrichedState.lastCorrectAnswer = userAnswer
      enrichedState.questionIndex = currentIndex
      
      // Track script progress: Mark current piece as covered
      if (!enrichedState.scriptProgress.coveredIndices.includes(currentIndex)) {
        enrichedState.scriptProgress.coveredIndices.push(currentIndex)
      }
      
      // Update current script index
      enrichedState.scriptProgress.currentScriptIndex = currentIndex
      enrichedState.scriptProgress.currentActualIndex = currentIndex
    }

    const logDecision = (extra: Record<string, unknown> = {}) => {
      console.info('[conversation-validate] decision', {
        currentPiece,
        nextPiece,
        userAnswer,
        modelIsCorrectRaw,
        derivedIsCorrect,
        userExpertOverride,
        expertScenario: expertScenario.isExpert ? expertScenario : null,
        finalIsCorrect,
        enrichedState,
        ...extra,
      })
    }

    logDecision({
      feedback: finalFeedback,
      adaptedResponse: finalAdaptedResponse,
      followUp: followUpInsert,
    })

    return {
      success: true,
      isCorrect: finalIsCorrect,
      feedback: finalFeedback,
      adaptedResponse: finalAdaptedResponse,
      insertFollowUp: !!followUpInsert,
      followUp: followUpInsert,
      originalNext: nextPiece,
      enrichedState, // Return updated state for frontend to track
    }
  } catch (error) {
    console.error('Answer validation error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to validate answer',
    })
  }
})
