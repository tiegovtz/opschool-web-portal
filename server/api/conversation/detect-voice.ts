export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { text, conversationHistory = [], currentVoiceType = 'female' } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Text is required'
      })
    }

    // TODO: Replace with actual API endpoint when backend is ready
    // const auth_token = getCookie(event, "signInAccessToken")
    // const response = await fetch(`${apiDocs.conversation.detectVoice}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${auth_token}`,
    //   },
    //   body: JSON.stringify({ text })
    // })
    // const result = await response.json()
    // return result

    // Temporary: Use OpenAI to detect gender from conversation text
    const config = useRuntimeConfig()
    const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''

    if (!openaiApiKey) {
      // If no API key, return neutral/default
      return {
        success: true,
        voiceType: 'female', // default
        confidence: 0.5,
      }
    }

    // Build conversation context from history
    const historyContext = conversationHistory
      .map((item: any) => `AI: ${item.ai}\nUser: ${item.user || '(no response)'}`)
      .join('\n\n')

    // Create prompt to detect gender from conversation text and history
    const detectionPrompt = `Analyze the following conversation text and determine the GENDER OF THE SPEAKER (the AI character saying this text) based on:
1. The speaker's own name/identity mentioned in the current text (e.g., "I am Grace" = female speaker, "I am Nick" = male speaker)
2. Pronouns the speaker uses for themselves (she/her = female, he/him = male)
3. Context from conversation history - if the AI's name/identity was established earlier, MAINTAIN THAT IDENTITY unless explicitly changed
4. If the text is speaking AS a character (e.g., "I am [name]" - use that name's gender)

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Current text: "${text}"
${currentVoiceType ? `Current established voice type: ${currentVoiceType}` : ''}

IMPORTANT RULES:
- Detect the gender of WHO IS SPEAKING THIS TEXT (the AI character), not who is being spoken about
- If the text says "I am [name]" or "My name is [name]", this establishes a NEW identity - use that name's gender and set "isNewIdentity": true
- If an identity was already established in previous conversation (e.g., AI said "I am Nick" earlier), MAINTAIN THAT VOICE for all subsequent pieces unless a new identity is established
- If current text has NO identity indicators (e.g., "How are you?", "Nice to meet you"), MAINTAIN the previously established voice type (${currentVoiceType}) and set "shouldUpdate": false
- Only change voice type if a NEW identity is explicitly established in the current text (set "shouldUpdate": true only when "isNewIdentity": true)
- Look for first-person identity statements ("I am [name]", "My name is [name]") to identify NEW character establishment

Examples:
- First piece: "I am Nick. I'm a student." → {"voiceType": "male", "isNewIdentity": true, "shouldUpdate": true} (NEW identity established: Nick)
- First piece: "My name is Anna! I'm a Form One student." → {"voiceType": "female", "isNewIdentity": true, "shouldUpdate": true} (NEW identity established: Anna)
- Multi-sentence text: "hi what's your name? Okay! i am michael how old are you? I am 15 years old" → {"voiceType": "male", "isNewIdentity": true, "shouldUpdate": true} (NEW identity established: Michael - detected from "i am michael")
- Previous: AI said "I am Nick", Current: "How are you?" → {"voiceType": "male", "isNewIdentity": false, "shouldUpdate": false} (MAINTAIN Nick's voice, no new identity)
- Previous: AI said "I am Nick", Current: "Nice to meet you, John." → {"voiceType": "male", "isNewIdentity": false, "shouldUpdate": false} (MAINTAIN Nick's voice, greeting doesn't change identity)
- Previous: AI said "I am Nick", Current: "I am Grace." → {"voiceType": "female", "isNewIdentity": true, "shouldUpdate": true} (NEW identity established, CHANGE to Grace)
- Text: "How are you?" (no identity, first piece) → {"voiceType": "${currentVoiceType}", "isNewIdentity": false, "shouldUpdate": false} (default to ${currentVoiceType})

Respond with JSON only:
{
  "voiceType": "male" or "female",
  "confidence": number between 0 and 1,
  "reason": "brief explanation",
  "isNewIdentity": boolean (true if current text establishes a new character identity like "I am [name]"),
  "shouldUpdate": boolean (true if should update voice type, false to maintain current)
}

If uncertain or no identity indicators, set "shouldUpdate": false to maintain current voice type.`

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
            content: 'You are a gender detection system for voice selection. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: detectionPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to detect voice type')
    }

    const data = await response.json()
    const resultContent = data.choices[0]?.message?.content

    if (!resultContent) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(resultContent)

    // Determine if we should update the voice type
    // Update if: (1) LLM explicitly says shouldUpdate is true, OR (2) new identity established AND this is first piece, OR (3) new identity established
    const isNewIdentity = result.isNewIdentity === true
    const detectedVoice = result.voiceType === 'male' ? 'male' : 'female'
    const isFirstPiece = !historyContext || conversationHistory.length === 0
    
    // Should update if: LLM says shouldUpdate is true, OR new identity is established
    const shouldUpdate = result.shouldUpdate === true || isNewIdentity || (isFirstPiece && detectedVoice !== currentVoiceType)

    return {
      success: true,
      voiceType: detectedVoice,
      confidence: result.confidence ?? 0.5,
      reason: result.reason || '',
      isNewIdentity: isNewIdentity,
      shouldUpdate: shouldUpdate,
    }
  } catch (error) {
    console.error('Voice detection error:', error)
    // Return default on error
    return {
      success: true,
      voiceType: 'female', // default fallback
      confidence: 0.5,
      error: error instanceof Error ? error.message : 'Failed to detect voice type',
    }
  }
})
