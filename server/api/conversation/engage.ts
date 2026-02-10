const DEFAULT_BASE_URL = 'https://apitie.ekima.africa/v1'

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

function normalizePieces(
  payload: any,
  identifier: string,
  type?: string
): {
  name: string
  pieces: string[]
  entries: Array<{ order: number; text: string; speaker: string }>
  speakerNames: string[]
} {
  const items = Array.isArray(payload)
    ? payload
    : payload?.data || payload?.results || payload?.items || []

  if (!Array.isArray(items)) {
    return { name: '', pieces: [], entries: [], speakerNames: [] }
  }

  const sorted = items
    .filter(
      (item) => {
        // Existing checks
        if (!item || typeof item.text !== 'string') return false
        if (!matchesIdentifier(item?.identifier, identifier)) return false
        
        // NEW: Filter by type
        const itemType = String(item?.type || '').trim().toLowerCase()
        const requestedType = String(type || '').trim().toLowerCase()
        
        if (requestedType === 'constant') {
          // English practice: only include items with type="constant"
          return itemType === 'constant'
        } else {
          // Conversation practice: include items with type="engage" or missing type
          return itemType === 'engage' || itemType === ''
        }
      }
    )
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))

  const name = sorted.find((item) => typeof item.name === 'string')?.name || ''
  const pieces = sorted
    .map((item) => String(item.text || '').trim())
    .filter((text) => text.length > 0)

  const entries = sorted
    .map((item, index) => ({
      order: Number(item?.order) || index + 1,
      text: String(item?.text || '').trim(),
      speaker: String(
          item?.speaker ||
          item?.speakerName ||
          item?.actor ||
          item?.name ||
          item?.role ||
          ''
      ).trim(),
    }))
    .filter((entry) => entry.text.length > 0)

  const rawSpeakerNames = [
    ...(Array.isArray(payload?.names) ? payload.names : []),
    ...(Array.isArray(payload?.speakers) ? payload.speakers : []),
    ...(Array.isArray(payload?.participants)
      ? payload.participants.map((participant: any) =>
          typeof participant === 'string' ? participant : participant?.name
        )
      : []),
  ]

  const speakerNames = Array.from(
    new Set(
      rawSpeakerNames
        .map((value: unknown) => String(value || '').trim())
        .filter((value: string) => value.length > 0)
    )
  )

  return { name, pieces, entries, speakerNames }
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
  const type = normalizeQueryValue(query?.type)
  if (!chapterId) {
    throw createError({
      statusCode: 500,
      message: 'CONVERSATION_CHAPTER_ID is not set',
    })
  }

  const baseUrl = process.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
  const base = baseUrl.replace(/\/$/, '')
  
  // Build URLs based on type - backend might expect type in the path
  const normalizedType = String(type || '').trim().toLowerCase()
  const typePath = normalizedType === 'constant' ? 'constant' : 'engage'
  
  const urls = [
    `${base}/conversations/${typePath}/${encodeURIComponent(chapterId)}`,
    `${base}/conversation/${typePath}/${encodeURIComponent(chapterId)}`,
    // Fallback to old URLs for backward compatibility
    `${base}/conversations/engage/${encodeURIComponent(chapterId)}`,
    `${base}/conversation/engage/${encodeURIComponent(chapterId)}`,
  ]

  const authToken =
    getCookie(event, 'signInAccessToken') ||
    process.env.CONVERSATION_AUTH_TOKEN ||
    process.env.CONVERSATION_ENGAGE_TOKEN ||
    ''

  const headers: Record<string, string> = {
    Accept: '*/*',
  }
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
      message: `Failed to load conversation (${lastStatus})`,
    })
  }

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const { name, pieces, entries, speakerNames } = normalizePieces(payload, identifier, type)

  return {
    chapterId,
    name,
    pieces,
    entries,
    speakerNames,
    identifier,
  }
})
