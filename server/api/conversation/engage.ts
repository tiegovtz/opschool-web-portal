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
  identifier: string
): { name: string; pieces: string[] } {
  const items = Array.isArray(payload)
    ? payload
    : payload?.data || payload?.results || payload?.items || []

  if (!Array.isArray(items)) {
    return { name: '', pieces: [] }
  }

  const sorted = items
    .filter(
      (item) =>
        item &&
        typeof item.text === 'string' &&
        matchesIdentifier(item?.identifier, identifier)
    )
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))

  const name = sorted.find((item) => typeof item.name === 'string')?.name || ''
  const pieces = sorted
    .map((item) => String(item.text || '').trim())
    .filter((text) => text.length > 0)

  return { name, pieces }
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
      statusCode: 500,
      message: 'CONVERSATION_CHAPTER_ID is not set',
    })
  }

  const baseUrl = process.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
  const base = baseUrl.replace(/\/$/, '')
  const urls = [
    `${base}/conversation/engage/${encodeURIComponent(chapterId)}`,
    `${base}/conversations/engage/${encodeURIComponent(chapterId)}`,
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

  const { name, pieces } = normalizePieces(payload, identifier)

  return {
    chapterId,
    name,
    pieces,
    identifier,
  }
})
