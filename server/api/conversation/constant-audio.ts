const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) return String(value[0] || '').trim()
  return String(value || '').trim()
}

const matchesIdentifier = (value: unknown, identifier: string) => {
  if (!identifier) return true
  const candidate = String(value || '').trim()
  if (!candidate) return false
  return candidate === identifier || candidate.startsWith(`${identifier}-`)
}

const normalizeAudioUrl = (item: any): string => {
  const candidate =
    item?.audioFile ||
    item?.audioUrl ||
    item?.audioURL ||
    item?.audio_url ||
    item?.audio ||
    item?.url ||
    item?.filepath ||
    ''
  return String(candidate || '').trim()
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }

  const query = getQuery(event)
  const chapterId =
    normalizeQueryValue(query?.chapterId) ||
    process.env.CONVERSATION_CHAPTER_ID ||
    ''
  const identifier = normalizeQueryValue(query?.identifier)
  if (!chapterId) {
    throw createError({
      statusCode: 400,
      message: 'chapterId is required',
    })
  }

  const baseUrl = String(process.env.VITE_API_BASE_URL || '').trim()
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      message: 'VITE_API_BASE_URL is not configured',
    })
  }
  const base = baseUrl.replace(/\/$/, '')
  const urls = [
    `${base}/conversations/constant/${encodeURIComponent(chapterId)}`,
    `${base}/conversation/constant/${encodeURIComponent(chapterId)}`,
  ]

  const authToken = getCookie(event, 'signInAccessToken') || ''
  const headers: Record<string, string> = { Accept: '*/*' }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  let response: Response | null = null
  let lastStatus = 500
  for (const url of urls) {
    response = await fetch(url, { method: 'GET', headers })
    lastStatus = response.status
    if (response.ok) break
    if (response.status !== 404) break
  }

  if (!response || !response.ok) {
    throw createError({
      statusCode: lastStatus,
      message: `Failed to load constant conversation (${lastStatus})`,
    })
  }

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const items = Array.isArray(payload)
    ? payload
    : payload?.data || payload?.results || payload?.items || []

  const normalizedItems = Array.isArray(items)
    ? items
        .filter((item) => {
          if (!item || typeof item.text !== 'string') return false
          if (!matchesIdentifier(item?.identifier, identifier)) return false
          return String(item?.type || '').trim().toLowerCase() === 'constant'
        })
        .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
        .map((item, index) => ({
          order: Number(item?.order) || index + 1,
          identifier: String(item?.identifier || '').trim(),
          text: String(item?.text || '').trim(),
          speaker: String(item?.speaker || item?.name || '').trim(),
          audioFile: normalizeAudioUrl(item),
        }))
    : []

  return {
    chapterId,
    identifier,
    items: normalizedItems,
  }
})
