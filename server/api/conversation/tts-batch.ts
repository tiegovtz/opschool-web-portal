type TtsInlineResponse = {
  success?: boolean
  audioBase64?: string
  contentType?: string
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }

  const body = await readBody(event)
  const chunks = Array.isArray(body?.chunks) ? body.chunks : []
  const voiceType = String(body?.voiceType || 'female')

  if (!chunks.length) {
    return { success: true, chunks: [] }
  }

  const results = await Promise.all(
    chunks.map(async (chunk: any) => {
      const id = String(chunk?.id || '').trim()
      const text = String(chunk?.text || '').trim()
      const chunkVoiceType = String(chunk?.voiceType || voiceType || 'female') === 'male' ? 'male' : 'female'
      if (!id || !text) {
        return { id, success: false }
      }
      try {
        const response = await $fetch<TtsInlineResponse>('/api/conversation/tts', {
          method: 'POST',
          body: {
            text,
            voiceType: chunkVoiceType,
            inline: true,
          },
        })
        return {
          id,
          success: Boolean(response.success && response.audioBase64),
          audioBase64: response.audioBase64,
          contentType: response.contentType || 'audio/wav',
        }
      } catch {
        return { id, success: false }
      }
    })
  )

  return {
    success: true,
    chunks: results,
  }
})
