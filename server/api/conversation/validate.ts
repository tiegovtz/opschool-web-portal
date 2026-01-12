import apiDocs from "~/utilities/apiDocs"

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

    // TODO: Replace with actual API endpoint when backend is ready
    // const auth_token = getCookie(event, "signInAccessToken")
    // const response = await fetch(`${apiDocs.conversation.validate}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${auth_token}`,
    //   },
    //   body: JSON.stringify({
    //     conversationContext,
    //     currentPiece,
    //     currentIndex,
    //     userAnswer,
    //     conversationHistory,
    //   }),
    // })
    // const result = await response.json()
    // return result

    // Temporary: Use OpenAI to validate answer contextually
    const config = useRuntimeConfig()
    const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''

    if (!openaiApiKey) {
      throw createError({
        statusCode: 500,
        message: 'OpenAI API key not configured'
      })
    }

    // Build context for validation
    const previousContext = conversationHistory
      .map((item: any) => `AI: ${item.ai}\nUser: ${item.user || '(no response)'}`)
      .join('\n\n')

    const nextPiece = currentIndex < conversationContext.length - 1
      ? conversationContext[currentIndex + 1]
      : null

    // Create validation prompt that considers:
    // 1. The current conversation piece
    // 2. The next piece (to understand context, but DON'T require user to ask it)
    // 3. Previous conversation history
    // 4. Whether the user's answer is contextually appropriate
    // 5. Always provide contextual adaptation based on user's emotions/answers
    const validationPrompt = `You are evaluating an English conversation practice session for beginner-level students. Be LENIENT, encouraging, and teacher-like.

Context:
- Current conversation piece (what AI just said): "${currentPiece}"
${nextPiece ? `- Next conversation piece (what AI will say next - for context/compatibility only, NOT what the user should say now): "${nextPiece}"` : '- This is the last piece in the conversation'}
${previousContext ? `- Previous conversation (for context):\n${previousContext}` : '- This is the beginning of the conversation'}

User's answer: "${userAnswer}"

IMPORTANT:
- Evaluate the user's answer as a response to the CURRENT piece.
- Use the NEXT piece ONLY to check compatibility/consistency (i.e., reject only if the answer clearly contradicts what the next piece assumes).
- Do NOT require the student to “guess” the next line. Only ensure the conversation can still logically continue.

EVALUATION RULES (general textbook dialogue practice):
1) CONTEXTUALLY APPROPRIATE: The answer should make logical sense as a reply to the current piece.
2) COMPATIBILITY CHECK (using next piece): Use the next piece ONLY to catch DIRECT contradictions that would make the next piece illogical.
   - Only mark WRONG for contradictions of REQUIRED FACTS (yes/no facts, identity, time, place) that the next piece depends on.
   - Do NOT mark WRONG for emotional tone, opinions, or normal details unless they negate a required fact.
   - Examples (WRONG):
     - Current: "Are you a student here?" Next: "Which class are you in?" User: "No" → WRONG.
     - Current: "Is today your first day at school?" Next: "How was your first day?" User: "No" → WRONG.
   - Examples (CORRECT):
     - Current: "How was your first day at secondary school?" Next: "What is your favourite subject and why?" User: "It was bad, I didn't make any new friends." → CORRECT (no contradiction).
     - Current: "How are you?" Next: "What is your favourite subject and why?" User: "Not good today." → CORRECT.
     - Current: "Are you a Form 1 student?" Next: "How was your first day at secondary school?" User: any clear YES (e.g., "Yes", "Yes I am", "Yes I'm Form One", "Yeah I'm a Form 1 student") → CORRECT (supports next piece; do NOT flag as contradiction).
     - Current: "Are you a Form 1 student?" Next: "How was your first day at secondary school?" User: "No" → WRONG (direct contradiction).
     - Generic pattern: If the next piece assumes a fact F, then any affirmative/compatible answer to F is CORRECT; only explicit negation of F is WRONG.
3) DIALOGUE STRUCTURE (CRITICAL for school conversation practice):
   - If the NEXT piece contains the AI ANSWERING a question (like "I am Michael" = answering about name, "I am 20 years old" = answering about age, "My favorite is science" = answering about favorite subject), then the user MUST have asked that question in their response.
   - The user can be as creative/funny as they want in HOW they ask, but they MUST ask the appropriate question.
   - Examples (WRONG - missing required question):
     - Current: "hi what's your name?" Next: "Okay! I am Michael. How old are you?" User: "I'm an alien called Clark Kent" → WRONG (user answered but didn't ask "what's your name?" back).
     - Current: "I am John, nice to meet you" Next: "I am 20 years old. What is your favorite subject?" User: "Nice to meet you too!" → WRONG (user didn't ask "how old are you?").
   - Examples (CORRECT - proper dialogue structure):
     - Current: "hi what's your name?" Next: "Okay! I am Michael. How old are you?" User: "I'm an alien called Clark Kent, what's your name?" → CORRECT (asked the question, even with humor).
     - Current: "hi what's your name?" Next: "Okay! I am Michael. How old are you?" User: "My name is Sarah! What about you?" → CORRECT (asked for name).
     - Current: "I am John, nice to meet you" Next: "I am 20 years old. What is your favorite subject?" User: "Nice to meet you too! How old are you?" → CORRECT.
   - Detection patterns for AI answering:
     - "I am [name]" / "My name is [name]" → User should have asked about name
     - "I am [number] years old" / "I'm [age]" → User should have asked about age
     - "My favorite is [thing]" / "I like [thing]" → User should have asked about favorites/preferences
     - "I live with [people]" → User should have asked about living situation
   - If next piece does NOT contain AI answering (just asking another question or general statement), this rule doesn't apply.
4) HUMOR IS OK (when it still answers): Allow light humor/playfulness IF the answer still meaningfully responds to the current piece and stays compatible with the next piece.
   - If the humor makes the answer nonsensical/unrelated or breaks the lesson reality, mark it WRONG.
   - Examples:
     - "How are you?" → "I'm fine—my stomach is smiling today!" → CORRECT.
     - "Are you a student?" → "Yes, I'm a student (not an alien 😄)." → CORRECT.
     - "Are you a student?" → "I'm an alien" → WRONG (breaks reality/lesson).
5) IF "WHY" IS ASKED: A reason must be provided.
   - Accept any simple/reasonable reason (e.g., "because I like it", "because it's delicious", "because it's easy").
   - Reject reasons that are nonsensical or unrelated to the topic.
   - Example: "What food do you like and why?" → "Ugali because of gravity" → WRONG.
6) Be lenient about grammar/spelling. Short answers are OK if they match the question.

TEACHER-LIKE FEEDBACK:
- If correct: praise briefly and explain what was good.
- If correct AND the student used appropriate humor: respond warmly and you may be lightly funny too (but still keep it beginner-friendly).
- If wrong due to missing required question (dialogue structure): explain that in proper dialogue, when someone will answer your question, you need to ask it first.
  Examples:
  - "This is wrong. In a proper conversation, you need to ask 'What's your name?' so the other person can introduce themselves. You can be creative in how you ask, but you must ask!"
  - "This is wrong. You answered the question, but you also need to ask 'How old are you?' back so the other person can answer."
  - "This is wrong. Look at the next piece - the AI is going to answer a question. Make sure you ask that question in your response!"
- If wrong due to compatibility with the next piece (DIRECT contradiction only): mention the next piece text and guide the student to rethink.
  Use one of these patterns (do NOT provide the exact answer):
  - "This is wrong. Based on the context of the next question '[NEXT PIECE]', what do you think your answer should be here?"
  - "This is wrong because it contradicts the next question '[NEXT PIECE]'. Please answer in a way that keeps the conversation logical."
- If wrong due to missing reason for "why": say they need to add a reason.
- If wrong due to nonsense/unrelated: say it doesn't match the question/topic.

MINOR ADAPTATION (required when nextPiece exists AND the answer is correct):
- If nextPiece exists AND the user's answer is correct: return an adaptedResponse that integrates the next piece naturally with the user's answer.
- Do NOT output multiple options. Choose ONE best adaptation yourself.
- Do not change the next piece's core meaning or ask a different question.
- **The adaptation should be CONVERSATIONAL and COMPARATIVE** - relate the AI's answer to the user's answer!

**CRITICAL - COMPARATIVE & RELATIONAL ADAPTATION (make it feel like a real conversation):**
- If the next piece contains the AI's answer to the same type of question the user just answered, COMPARE and RELATE them naturally:
  * **Age comparison:**
    - User: "I am 18" + Next: "I am 15 years old. What is your favorite subject?" → "Oh, you're 18! That's a bit older than me - I'm 15 years old. What is your favorite subject?"
    - User: "I'm 14" + Next: "I am 15 years old. What is your favorite subject?" → "Oh, you're 14! We're almost the same age - I'm 15 years old. What is your favorite subject?"
    - User: "I am 15" + Next: "I am 15 years old. What is your favorite subject?" → "Oh, you're 15 too! We're the same age! What is your favorite subject?"
  * **Name introduction:**
    - User: "I am Gabriel" + Next: "Okay! I am Michael. How old are you?" → "Nice to meet you, Gabriel! I am Michael. How old are you?"
    - User: "My name is Sarah!" + Next: "I am Grace. Are you a Form 1 student?" → "Lovely to meet you, Sarah! I am Grace. Are you a Form 1 student?"
  * **Favorite things:**
    - User: "I like math" + Next: "My favorite is science. Do you like sports?" → "Oh, math is great! My favorite is science. Do you like sports?"
    - User: "I love ugali" + Next: "I like rice and beans. Who do you live with?" → "Nice! Ugali is delicious. I like rice and beans. Who do you live with?"
  * **Yes/No answers with context:**
    - User: "Yes, I am a Form 1 student" + Next: "I am also Form 1! How was your first day?" → "Great! I am also Form 1! How was your first day?"
  * **Emotional/experiential:**
    - User: "My first day was amazing!" + Next: "Mine was good too. What is your favorite subject?" → "That's wonderful! Mine was good too. What is your favorite subject?"
    - User: "My first day was scary" + Next: "Mine was a bit nervous too. What is your favorite subject?" → "I understand, mine was a bit nervous too. What is your favorite subject?"

- **General tone adaptation (when no direct comparison is possible):**
  - Negative answer → empathetic (e.g., "Oh, sorry to hear that.")
  - Positive answer → encouraging (e.g., "That's great!")
  - Simple factual → friendly (e.g., "Nice!" / "Okay!")
  - Playful humor → respond playfully (e.g., "Haha, that's interesting!")

- **Key principle:** Make the AI sound like it's LISTENING and RESPONDING to the user's specific answer, not just reading a script.
- You have leeway to add 1-2 extra sentences to create natural flow and comparison.
- If nextPiece is null OR the answer is incorrect: adaptedResponse must be null.
`

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
        temperature: 0.5, // Increased for more creative/playful adaptations
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

    // Normalize shape from model (it may return either flat fields or under `evaluation`)
    const evalBlock = (result as any).evaluation || {}

    const uaLower = String(userAnswer || '').toLowerCase()
    const compatRaw = evalBlock.compatibility
    // Start with model compatibility; default to true if not provided
    let compatibilityFlag = typeof compatRaw === 'boolean' ? compatRaw : true
    // If model said incompatible but the answer is contextually appropriate and not an explicit negation, soften to true
    if (compatibilityFlag === false && evalBlock.contextuallyAppropriate === true && !/\b(no|not|n't)\b/.test(uaLower)) {
      compatibilityFlag = true
    }

    const modelIsCorrectRaw =
      typeof result.isCorrect === 'boolean'
        ? result.isCorrect
        : typeof evalBlock.correct === 'boolean'
          ? evalBlock.correct
          : typeof evalBlock.result === 'string'
            ? ['correct', 'right', 'true'].includes(evalBlock.result.toLowerCase())
            : false

    const explicitNegation = /\b(no|not|n't)\b/.test(uaLower)

    const derivedIsCorrect =
      modelIsCorrectRaw ||
      (evalBlock.contextuallyAppropriate === true && compatibilityFlag === true) ||
      (!explicitNegation && compatibilityFlag === true)

    const modelFeedback =
      result.feedback ||
      evalBlock.feedback ||
      (derivedIsCorrect ? 'Correct!' : 'This is wrong. Try again.')

    const modelAdapted =
      typeof result.adaptedResponse === 'string'
        ? result.adaptedResponse
        : typeof evalBlock.adaptedResponse === 'string'
          ? evalBlock.adaptedResponse
          : null

    const logDecision = (extra: Record<string, unknown> = {}) => {
      console.info('[conversation-validate] decision', {
        currentPiece,
        nextPiece,
        userAnswer,
        result,
        modelIsCorrectRaw,
        derivedIsCorrect,
        compatibilityFlag,
        modelFeedback,
        modelAdapted,
        raw: resultContent,
        ...extra,
      })
    }

    const normalize = (s: any) => (typeof s === 'string' ? s.trim() : '')
    let adapted = normalize(result.adaptedResponse)

    if (nextPiece) {
      const next = String(nextPiece).trim()

      const playfulRe = /(haha|lol|lmao|rofl|\ud83d\ude02|\ud83d\ude04|\ud83e\udd23)/
      const negativeRe = /(bad|sad|not good|unhappy|bored|tired|upset|angry|lonely|terrible|awful|worst|\bdidn't\b|\bdid not\b|no friends|nothing|hate|passed away|died|loss|lost my (mom|dad|mother|father|parent|parents|friend|sister|brother)|divorce|divorced|no money|didn't have enough money|couldn't afford|financial trouble|financial problem|didn't have school fees|school fees)/i
      const positiveRe = /(good|fine|great|happy|excellent|amazing|wonderful|awesome|nice|fantastic|love)/i
      const affirmativeRe = /(yes|yeah|yep|sure|ok|okay|alright)/i

      // Fallback ONLY if the model did not provide a usable adaptedResponse.
      // Keep this minimal; the model should normally choose the best transition itself.
      if (!adapted || adapted === next) {
        let prefix = 'Okay!'
        if (playfulRe.test(uaLower)) prefix = 'Haha, nice one!'
        else if (negativeRe.test(uaLower)) prefix = 'Oh, sorry to hear that.'
        else if (positiveRe.test(uaLower)) prefix = "That's great!"
        else if (affirmativeRe.test(uaLower)) prefix = "That's nice!"

        adapted = `${prefix} ${next}`
      }
    }

    // If there's an adapted response, we can use it to modify the next piece
    // For now, we'll just return the validation result
    // Build final adapted response with empathy fallback when needed
    let finalAdapted: string | null = null
    if (nextPiece && derivedIsCorrect) {
      const next = String(nextPiece).trim()
      // Reuse regexes for tone detection
      const negTone = /(bad|sad|not good|unhappy|bored|tired|upset|angry|lonely|terrible|awful|worst|\bdidn't\b|\bdid not\b|no friends|nothing|hate|passed away|died|loss|lost my (mom|dad|mother|father|parent|parents|friend|sister|brother))/i
      const posTone = /(good|fine|great|happy|excellent|amazing|wonderful|awesome|nice|fantastic|love)/i
      const affTone = /(yes|yeah|yep|sure|ok|okay|alright)/i

      // Start from modelAdapted if provided, else from fallback adapted
      finalAdapted = modelAdapted || adapted || next
      
      // If the adapted response is just the bare next question (no acknowledgment),
      // add an appropriate prefix based on the user's tone
      if (finalAdapted) {
        const lowerAdapted = finalAdapted.toLowerCase()
        const lowerNext = next.toLowerCase()
        const isBareNext = lowerAdapted === lowerNext || finalAdapted === next
      
        if (isBareNext) {
          const uaLower = userAnswer.toLowerCase()
          const hasPlayful = /haha|lol|lmao|rofl|😂|😄|🤣/i.test(userAnswer)
          const hasNeg = negTone.test(uaLower)
          const hasPos = posTone.test(uaLower)
          const hasAff = affTone.test(uaLower)
          
          let prefix = "Okay!"
          if (hasPlayful) {
            prefix = "Haha, that's interesting!"
          } else if (hasNeg) {
            prefix = "I'm sorry to hear that."
          } else if (hasPos) {
            prefix = "That's great!"
          } else if (hasAff) {
            prefix = "That's nice!"
          }
          
          finalAdapted = `${prefix} ${next}`
        }
      }
    }

    // Special handling for the last question - always accept the answer and provide graceful closing
    const isLastQuestion = !nextPiece
    let finalFeedback = modelFeedback
    
    if (isLastQuestion) {
      // For the last question, any answer is acceptable
      // Provide a graceful closing statement based on the user's response
      const hasNegative = /\b(no|not|nope|nah|don't|sorry)\b/i.test(userAnswer)
      
      if (hasNegative) {
        finalFeedback = "I understand. That's okay! It was nice talking with you. Thank you for practicing with me."
      } else {
        finalFeedback = "Thank you very much! It was wonderful talking with you. I'm glad we could practice together!"
      }
      
      // Override derivedIsCorrect to always be true for last question
      logDecision({ finalNextPiece: null, isLastQuestion: true })

      return {
        success: true,
        isCorrect: true,
        feedback: finalFeedback,
        adaptedResponse: null, // No next question
      }
    }

    const reasonTriggerRe = /\bwhy\b/i
    const reasonWordRe = /\b(because|since|as|due to|thanks to|because of|for)\b/i
    const currentText = String(currentPiece)
    const needsReason = reasonTriggerRe.test(currentText)
    const hasReason = reasonWordRe.test(userAnswer)

    if (needsReason && derivedIsCorrect && !hasReason) {
      const reasonFeedback = `That was a good answer! Could you also explain why? The question was "${currentText.trim()}".`
      logDecision({
        reasonMissing: true,
        reasonRequired: true,
        question: currentText,
      })

      return {
        success: true,
        isCorrect: false,
        feedback: reasonFeedback,
        adaptedResponse: null,
      }
    }

    const adaptedResponse =
      nextPiece && derivedIsCorrect
        ? (finalAdapted ? finalAdapted : null)
        : null

    // Ensure feedback is positive/encouraging when we consider the answer correct,
    // even if the model feedback text sounded negative. Do NOT include the next
    // question in the feedback; empathy only.
    const isModelNegative =
      typeof modelFeedback === 'string' &&
      /wrong|contradict|doesn['']?t match|inconsistent|illogical/i.test(modelFeedback)

    // Only show empathetic feedback if answer contains clear hardship/loss
    const hasSeriousHardship =
      typeof userAnswer === 'string' &&
      /(passed away|died|loss|lost my (mom|dad|mother|father|parent|parents|friend|sister|brother)|divorce|didn't have enough money|couldn't afford|financial trouble|no money)/i.test(
        userAnswer
      )

    finalFeedback =
      derivedIsCorrect && isModelNegative && hasSeriousHardship
        ? "Thanks for sharing. I'm sorry to hear that."
        : derivedIsCorrect && isModelNegative
          ? "Great job answering the question!"
          : modelFeedback

    const finalNextPiece =
      nextPiece && derivedIsCorrect
        ? (adaptedResponse ? adaptedResponse : nextPiece)
        : nextPiece

    logDecision({
      finalNextPiece,
      adaptedResponse,
    })

    return {
      success: true,
      isCorrect: derivedIsCorrect,
      feedback: finalFeedback,
      adaptedResponse,
    }
  } catch (error) {
    console.error('Answer validation error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to validate answer',
    })
  }
})
