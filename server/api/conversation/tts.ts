import { generateTts, TTS_MAX_TEXT_CHARS } from '../../utils/piperTts'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed',
    })
  }

  const body = await readBody(event)
  const { text, voiceType = 'female', voiceId, inline } = body || {}

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Text is required',
    })
  }
  if (text.length > TTS_MAX_TEXT_CHARS) {
    throw createError({
      statusCode: 413,
      message: `Text is too long for speech (max ${TTS_MAX_TEXT_CHARS} characters)`,
    })
  }

  try {
    return await generateTts({
      text,
      voiceType: String(voiceType),
      voiceId: typeof voiceId === 'string' ? voiceId : undefined,
      inline: Boolean(inline),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('TTS generation error:', errorMessage)
    throw createError({
      statusCode: 500,
      message: 'Speech generation failed. Please try again.',
    })
  }
})
