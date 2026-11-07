import { generateTts, TTS_MAX_TEXT_CHARS } from '../../utils/piperTts'

const MAX_BATCH_CHUNKS = 30

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }

  const body = await readBody(event)
  const chunks = Array.isArray(body?.chunks) ? body.chunks : []
  const voiceType = String(body?.voiceType || 'female')
  const voiceId = typeof body?.voiceId === 'string' ? body.voiceId : undefined

  if (!chunks.length) {
    return { success: true, chunks: [] }
  }
  if (chunks.length > MAX_BATCH_CHUNKS) {
    throw createError({ statusCode: 413, message: `Too many chunks (max ${MAX_BATCH_CHUNKS})` })
  }

  // Synthesis is serialized inside generateTts; call it directly instead of
  // re-entering the HTTP route (which would drop the caller's session cookie).
  const results = await Promise.all(
    chunks.map(async (chunk: any) => {
      const id = String(chunk?.id || '').trim()
      const text = String(chunk?.text || '').trim()
      const chunkVoiceType = String(chunk?.voiceType || voiceType || 'female') === 'male' ? 'male' : 'female'
      const chunkVoiceId = typeof chunk?.voiceId === 'string' ? chunk.voiceId : voiceId
      if (!id || !text || text.length > TTS_MAX_TEXT_CHARS) {
        return { id, success: false }
      }
      try {
        const response = await generateTts({
          text,
          voiceType: chunkVoiceType,
          voiceId: chunkVoiceId,
          inline: true,
        })
        return {
          id,
          success: Boolean(response.success && 'audioBase64' in response && response.audioBase64),
          audioBase64: 'audioBase64' in response ? response.audioBase64 : undefined,
          contentType: ('contentType' in response && response.contentType) || 'audio/wav',
        }
      } catch (error) {
        console.error('[tts-batch] chunk failed:', error instanceof Error ? error.message : String(error))
        return { id, success: false }
      }
    })
  )

  return {
    success: true,
    chunks: results,
  }
})
