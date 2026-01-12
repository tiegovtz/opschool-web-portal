import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'

// ============================================================================
// Configuration from environment variables
// ============================================================================
const TTS_STEPS_SHORT = parseInt(process.env.TTS_STEPS_SHORT || '10', 10) // For single short sentences
const TTS_STEPS_DEFAULT = parseInt(process.env.TTS_STEPS_DEFAULT || '6', 10) // For chunks in paragraphs
const TTS_STEPS_MIN = parseInt(process.env.TTS_STEPS_MIN || '2', 10) // Minimum when under time pressure
const TTS_STEPS_MAX = parseInt(process.env.TTS_STEPS_MAX || '20', 10) // Maximum cap (increased to allow higher steps for names)
const TTS_CHUNK_MAX_CHARS = parseInt(process.env.TTS_CHUNK_MAX_CHARS || '220', 10) // Max chars per chunk
const TTS_MAX_LATENCY_MS = parseInt(process.env.TTS_MAX_LATENCY_MS || '10000', 10) // 10 second budget
const TTS_SPEED = parseFloat(process.env.TTS_SPEED || '1.0') // Default speed
const TTS_BEST_OF_N = parseInt(process.env.TTS_BEST_OF_N || '2', 10) // How many takes to generate per chunk
const TTS_CHUNK_SILENCE_MS = parseInt(process.env.TTS_CHUNK_SILENCE_MS || '80', 10) // Silence between chunks to smooth pacing
const TTS_MAX_SENTENCES_PER_CHUNK = parseInt(process.env.TTS_MAX_SENTENCES_PER_CHUNK || '1', 10) // Limit sentences per chunk for stability
const TTS_NORMALIZE_EXCLAMATIONS = (process.env.TTS_NORMALIZE_EXCLAMATIONS || 'true').toLowerCase() === 'true' // Reduce extreme pauses in long text
const TTS_GLITCH_MAX_INTERNAL_SILENCE_MS = parseInt(process.env.TTS_GLITCH_MAX_INTERNAL_SILENCE_MS || '800', 10)
const TTS_GLITCH_MAX_INTERNAL_SILENCE_TOTAL_MS = parseInt(process.env.TTS_GLITCH_MAX_INTERNAL_SILENCE_TOTAL_MS || '2500', 10)
const TTS_GLITCH_MIN_RMS = parseFloat(process.env.TTS_GLITCH_MIN_RMS || '0.008')
const TTS_GLITCH_RETRY_LIMIT = parseInt(process.env.TTS_GLITCH_RETRY_LIMIT || '2', 10)
const TTS_DEFAULT_VOICE_FEMALE = (process.env.TTS_DEFAULT_VOICE_FEMALE || 'F4').toUpperCase()
const TTS_DEFAULT_VOICE_MALE = (process.env.TTS_DEFAULT_VOICE_MALE || 'M4').toUpperCase()
// ============================================================================
// Text preprocessing (quality/stability)
// ============================================================================
function preprocessText(input: string): string {
  let text = String(input || '').trim()
  // Normalize unicode (helps with curly quotes, weird spacing)
  try {
    text = text.normalize('NFKC')
  } catch {
    // ignore
  }
  // Replace common “smart” punctuation with simpler ASCII forms
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()

  // For longer paragraphs, normalize exclamation marks to periods to reduce overly long pauses/glitches
  // (Keeps short expressive lines intact.)
  if (TTS_NORMALIZE_EXCLAMATIONS && text.length > 120) {
    text = text.replace(/!+/g, '.')
  }

  // If the text ends with no sentence punctuation, add a period.
  // This often improves prosody and reduces word skipping at the end.
  if (text.length > 0 && !/[.!?]$/.test(text)) {
    text += '.'
  }

  return text
}
function ensureSentenceEnding(text: string): string {
  const t = String(text || '').trim()
  if (!t) return t
  return /[.!?]$/.test(t) ? t : `${t}.`
}

function isValidVoiceId(v: unknown): v is string {
  if (typeof v !== 'string') return false
  return /^[FM][1-5]$/i.test(v.trim())
}

// ============================================================================
// Caching and warmup
// ============================================================================
let cachedSupertonic: { helper: any; tts: any } | null = null
let cachedStyles: Map<string, any> = new Map() // Cache voice styles by voiceId
let isWarmedUp = false

// In-memory audio cache (cleared on server restart)
// Note: Files in public/temp-audio are cleaned up on server restart (Nuxt clears public directory)
interface AudioCacheEntry {
  audioData: Buffer // For interface compatibility
  sampleRate: number
  timestamp: number
  filePath?: string // Actual file path for cached entries
}
const audioCache = new Map<string, AudioCacheEntry>()
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour cache

// Cleanup old cache entries periodically (only if in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of audioCache.entries()) {
      if (now - entry.timestamp > CACHE_MAX_AGE_MS) {
        // Optionally delete the file (but files are cleaned on restart anyway)
        if (entry.filePath && existsSync(entry.filePath)) {
          unlink(entry.filePath).catch(() => {}) // Ignore errors
        }
        audioCache.delete(key)
      }
    }
  }, 5 * 60 * 1000) // Cleanup every 5 minutes
}

// ============================================================================
// Telemetry interface
// ============================================================================
interface TTSMetrics {
  inputLength: number
  numChunks: number
  stepsPerChunk: number[]
  totalTimeMs: number
  fallbackReduced: boolean
  voiceType: string
  voiceId: string
}

function logMetrics(metrics: TTSMetrics) {
  // Lightweight logging - safe for production
  console.log(`[TTS] len=${metrics.inputLength} chunks=${metrics.numChunks} steps=[${metrics.stepsPerChunk.join(',')}] time=${metrics.totalTimeMs}ms fallback=${metrics.fallbackReduced} voiceType=${metrics.voiceType} voiceId=${metrics.voiceId}`)
}

// ============================================================================
// Text chunking utilities
// ============================================================================
function splitIntoSentences(text: string): string[] {
  const t = String(text || '').trim()
  if (!t) return []

  // Prefer Intl.Segmenter when available (more robust than regex)
  const Seg = (globalThis as any).Intl?.Segmenter
  if (Seg) {
    try {
      const seg = new Seg('en', { granularity: 'sentence' })
      const out: string[] = []
      for (const part of seg.segment(t)) {
        const s = String(part.segment).trim()
        if (s) out.push(s)
      }
      return out
    } catch {
      // fall back to regex
    }
  }

  // Regex fallback: keep punctuation AND keep final fragment without punctuation
  const parts = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
  return parts.map(s => s.trim()).filter(s => s.length > 0)
}

function chunkText(text: string, maxChars: number): string[] {
  const cleaned = preprocessText(text)
  const sentences = splitIntoSentences(cleaned)
  
  if (sentences.length === 0) {
    return [cleaned.trim()].filter(s => s.length > 0)
  }

  const chunks: string[] = []
  let currentChunk = ''
  let currentSentenceCount = 0

  for (const sentence of sentences) {
    // If single sentence exceeds max, split it by commas or just take it
    if (sentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
        currentSentenceCount = 0
      }
      // Split long sentence by commas or just take it
      const parts = sentence.split(',').map(p => p.trim())
      for (const part of parts) {
        if (currentChunk.length + part.length + 2 <= maxChars) {
          currentChunk += (currentChunk ? ', ' : '') + part
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trim())
          }
          currentChunk = part
          currentSentenceCount = 1
        }
      }
    } else if (
      currentChunk.length + sentence.length + 2 <= maxChars &&
      currentSentenceCount < TTS_MAX_SENTENCES_PER_CHUNK
    ) {
      // Add sentence to current chunk
      currentChunk += (currentChunk ? ' ' : '') + sentence
      currentSentenceCount += 1
    } else {
      // Current chunk is full, start new one
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = sentence
      currentSentenceCount = 1
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks.length > 0 ? chunks : [cleaned.trim()].filter(s => s.length > 0)
}

function containsName(text: string): boolean {
  // Detect common patterns for names: "My name is [Name]", "I am [Name]", etc.
  // Check for patterns that introduce names, followed by capitalized words (names)
  const namePatterns = [
    /(?:my name is|i am|i'm|this is)\s+[A-Z][a-z]+/i, // "My name is Anna", "I am John"
    /name's\s+[A-Z][a-z]+/i, // "name's Anna"
    /^[A-Z][a-z]+\s+here/i, // "Anna here" (name at start)
  ]
  return namePatterns.some(pattern => pattern.test(text))
}

function determineSteps(
  text: string,
  isShortAndInitial: boolean,
  isChunked: boolean,
  voiceType: string
): number {
  // If text contains a name, use higher steps for better pronunciation
  const hasName = containsName(text)
  const isMale = voiceType === 'male'
  const maleBoost = isMale ? 2 : 0

  // If it's the first (short) chunk, use higher steps even when the text is chunked.
  // This reduces early-word dropouts (e.g., skipping the name at the end of the first sentence).
  if (isShortAndInitial) {
    const shortBase = hasName
      ? Math.max(TTS_STEPS_SHORT + 6, 16) // extra boost for names on the first chunk
      : Math.max(TTS_STEPS_SHORT + 2, TTS_STEPS_MIN)

    // When chunked, add a tiny extra stability bump for the first chunk
    const chunkedBump = isChunked ? (hasName ? 2 : 1) : 0

    return Math.min(shortBase + chunkedBump + maleBoost, TTS_STEPS_MAX)
  }
  const baseSteps = hasName ? Math.max(TTS_STEPS_DEFAULT + 3, 9) : TTS_STEPS_DEFAULT
  return Math.min(baseSteps + maleBoost, TTS_STEPS_MAX)
}

// ============================================================================
// Audio concatenation utilities
// ============================================================================
function addSilence(samples: Float32Array, sampleRate: number, ms: number): Float32Array {
  const n = Math.max(0, Math.floor((sampleRate * ms) / 1000))
  if (n === 0) return samples
  const out = new Float32Array(samples.length + n)
  out.set(samples, 0)
  // remaining are zeros
  return out
}

function scoreAudio(samples: Float32Array, sampleRate: number): number {
  if (!samples || samples.length === 0) return -1e9

  // Leading/trailing silence (smaller is better)
  const thr = 0.003
  let lead = 0
  while (lead < samples.length && Math.abs(samples[lead]) < thr) lead++
  let trail = 0
  while (trail < samples.length && Math.abs(samples[samples.length - 1 - trail]) < thr) trail++

  // RMS (avoid too quiet), clipping (avoid)
  let sum2 = 0
  let clip = 0
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i])
    sum2 += samples[i] * samples[i]
    if (a > 0.99) clip++
  }
  const rms = Math.sqrt(sum2 / samples.length)

  // Convert silence samples to ms for easier weighting
  const leadMs = (lead / sampleRate) * 1000
  const trailMs = (trail / sampleRate) * 1000

  // Internal silence detection (penalize glitch takes with long pauses inside speech)
  const start = lead
  const end = Math.max(start, samples.length - trail)
  const minInternalMs = 250
  const minInternalLen = Math.floor((sampleRate * minInternalMs) / 1000)
  let maxInternalRun = 0
  let internalRunCount = 0
  let internalSilentTotal = 0

  let run = 0
  for (let i = start; i < end; i++) {
    if (Math.abs(samples[i]) < thr) {
      run++
    } else {
      if (run >= minInternalLen) {
        maxInternalRun = Math.max(maxInternalRun, run)
        internalRunCount++
        internalSilentTotal += run
      }
      run = 0
    }
  }
  if (run >= minInternalLen) {
    maxInternalRun = Math.max(maxInternalRun, run)
    internalRunCount++
    internalSilentTotal += run
  }

  const maxInternalMs = (maxInternalRun / sampleRate) * 1000
  const internalTotalMs = (internalSilentTotal / sampleRate) * 1000

  // Heuristic score: prefer reasonable loudness, penalize leading/trailing + internal long silences and clipping
  return (
    rms * 10 -
    (leadMs + trailMs) * 0.02 -
    internalTotalMs * 0.01 -
    maxInternalMs * 0.02 -
    internalRunCount * 0.15 -
    clip * 0.001
  )
}


function analyzeSilence(samples: Float32Array, sampleRate: number) {
  const thr = 0.003
  let sum2 = 0

  // leading/trailing silence
  let lead = 0
  while (lead < samples.length && Math.abs(samples[lead]) < thr) lead++
  let trail = 0
  while (trail < samples.length && Math.abs(samples[samples.length - 1 - trail]) < thr) trail++

  const start = lead
  const end = Math.max(start, samples.length - trail)

  // internal silence runs
  const minInternalMs = 250
  const minInternalLen = Math.floor((sampleRate * minInternalMs) / 1000)
  let maxInternalRun = 0
  let internalRunCount = 0
  let internalSilentTotal = 0

  let run = 0
  for (let i = start; i < end; i++) {
    const v = samples[i]
    sum2 += v * v

    if (Math.abs(v) < thr) {
      run++
    } else {
      if (run >= minInternalLen) {
        maxInternalRun = Math.max(maxInternalRun, run)
        internalRunCount++
        internalSilentTotal += run
      }
      run = 0
    }
  }
  if (run >= minInternalLen) {
    maxInternalRun = Math.max(maxInternalRun, run)
    internalRunCount++
    internalSilentTotal += run
  }

  const rms = Math.sqrt(sum2 / Math.max(1, end - start))
  const maxInternalMs = (maxInternalRun / sampleRate) * 1000
  const internalTotalMs = (internalSilentTotal / sampleRate) * 1000

  return { rms, maxInternalMs, internalTotalMs, internalRunCount }
}

function isGlitchTake(samples: Float32Array, sampleRate: number): boolean {
  if (!samples || samples.length === 0) return true
  const a = analyzeSilence(samples, sampleRate)
  return (
    a.rms < TTS_GLITCH_MIN_RMS ||
    a.maxInternalMs > TTS_GLITCH_MAX_INTERNAL_SILENCE_MS ||
    a.internalTotalMs > TTS_GLITCH_MAX_INTERNAL_SILENCE_TOTAL_MS
  )
}

function pickBestTake(takes: Float32Array[], sampleRate: number): Float32Array {
  if (takes.length === 0) return new Float32Array(0)
  if (takes.length === 1) return takes[0]

  const nonGlitch = takes.filter(t => !isGlitchTake(t, sampleRate))
  const candidates = nonGlitch.length > 0 ? nonGlitch : takes

  let best = candidates[0]
  let bestScore = scoreAudio(best, sampleRate)
  for (let i = 1; i < candidates.length; i++) {
    const s = scoreAudio(candidates[i], sampleRate)
    if (s > bestScore) {
      bestScore = s
      best = candidates[i]
    }
  }
  return best
}

function concatenateAudioSamples(samples: Float32Array[], sampleRate: number, silenceMs: number): Float32Array {
  if (samples.length === 0) return new Float32Array(0)
  if (samples.length === 1) return samples[0]

  const silenceSamples = Math.max(0, Math.floor((sampleRate * silenceMs) / 1000))
  const totalLength = samples.reduce((sum, arr, idx) => sum + arr.length + (idx === samples.length - 1 ? 0 : silenceSamples), 0)

  const out = new Float32Array(totalLength)
  let offset = 0
  for (let i = 0; i < samples.length; i++) {
    out.set(samples[i], offset)
    offset += samples[i].length
    // leave silenceSamples as zeros between chunks
    if (i !== samples.length - 1) offset += silenceSamples
  }
  return out
}

// ============================================================================
// WAV file creation utilities
// ============================================================================
function createWavFile(pcmData: Buffer, sampleRate: number): Buffer {
  // Create WAV header for raw PCM data
  const wavHeader = Buffer.alloc(44)
  wavHeader.write('RIFF', 0)
  wavHeader.writeUInt32LE(36 + pcmData.length, 4) // File size - 8
  wavHeader.write('WAVE', 8)
  wavHeader.write('fmt ', 12)
  wavHeader.writeUInt32LE(16, 16) // fmt chunk size
  wavHeader.writeUInt16LE(1, 20) // Audio format (PCM)
  wavHeader.writeUInt16LE(1, 22) // Number of channels (mono)
  wavHeader.writeUInt32LE(sampleRate, 24) // Sample rate
  wavHeader.writeUInt32LE(sampleRate * 2, 28) // Byte rate (sample rate * channels * bytes per sample)
  wavHeader.writeUInt16LE(2, 32) // Block align (channels * bytes per sample)
  wavHeader.writeUInt16LE(16, 34) // Bits per sample
  wavHeader.write('data', 36)
  wavHeader.writeUInt32LE(pcmData.length, 40) // Data chunk size
  
  return Buffer.concat([wavHeader, pcmData])
}

// ============================================================================
// Supertonic loading and warmup
// ============================================================================
async function loadSupertonicHelpers() {
  if (cachedSupertonic) return cachedSupertonic

  // Get paths from env vars
  const supertonicNodeDirRaw = process.env.SUPERTONIC_NODEJS || '/Users/ninasgama/Github/sd-web-admin/supertonic/nodejs'
  const supertonicAssetsRaw = process.env.SUPERTONIC_ASSETS || '/Users/ninasgama/Github/sd-web-admin/supertonic/assets'

  // Resolve absolute paths
  const supertonicNodeDir = supertonicNodeDirRaw.startsWith('/')
    ? supertonicNodeDirRaw
    : join(process.cwd(), supertonicNodeDirRaw)
  const supertonicAssets = supertonicAssetsRaw.startsWith('/')
    ? supertonicAssetsRaw
    : join(process.cwd(), supertonicAssetsRaw)

  // Check if supertonic is available
  if (!existsSync(supertonicNodeDir) || !existsSync(supertonicAssets)) {
    throw new Error(
      `Failed to load Supertonic helper. Ensure SUPERTONIC_NODEJS and SUPERTONIC_ASSETS are set and restart the server.`
    )
  }

  try {
    // Import supertonic helper dynamically
    const helperPath = join(supertonicNodeDir, 'helper.js')
    const helper = await import(/* webpackIgnore: true */ pathToFileURL(helperPath).href)

    // Load TTS (try onnx first, fallback to assets)
    let tts
    try {
      tts = await helper.loadTextToSpeech(join(supertonicAssets, 'onnx'), false)
    } catch (e1) {
      tts = await helper.loadTextToSpeech(supertonicAssets, false)
    }

    cachedSupertonic = { helper, tts }
    return cachedSupertonic
  } catch (err) {
    throw new Error(
      `Failed to load Supertonic helper at ${join(supertonicNodeDir, 'helper.js')}. Ensure SUPERTONIC_NODEJS and SUPERTONIC_ASSETS are set and restart the server. Original error: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

async function warmupSupertonic() {
  if (isWarmedUp) return

  try {
    const { helper, tts } = await loadSupertonicHelpers()
    
    // Get default voice for warmup
    const supertonicAssetsRaw = process.env.SUPERTONIC_ASSETS || '/Users/ninasgama/Github/sd-web-admin/supertonic/assets'
    const supertonicAssets = supertonicAssetsRaw.startsWith('/')
      ? supertonicAssetsRaw
      : join(process.cwd(), supertonicAssetsRaw)
    
    const warmId = isValidVoiceId(TTS_DEFAULT_VOICE_FEMALE) ? TTS_DEFAULT_VOICE_FEMALE : 'F2'
    const warmCandidate = join(supertonicAssets, 'voice_styles', `${warmId}.json`)
    const warmFallback = join(supertonicAssets, 'voice_styles', 'F2.json')
    const voicePath = existsSync(warmCandidate) ? warmCandidate : warmFallback
    const style = helper.loadVoiceStyle([voicePath], false)
    
    // Generate a tiny phrase at low steps for warmup
    await tts.call('Hello', style, 2, TTS_SPEED)
    
    isWarmedUp = true
    console.log('[TTS] Warmup complete')
  } catch (err) {
    console.warn('[TTS] Warmup failed (non-fatal):', err instanceof Error ? err.message : String(err))
    // Don't throw - warmup failure shouldn't block requests
  }
}

function getCachedStyle(voiceId: string, helper: any): any {
  if (cachedStyles.has(voiceId)) {
    return cachedStyles.get(voiceId)
  }

  const supertonicAssetsRaw = process.env.SUPERTONIC_ASSETS || '/Users/ninasgama/Github/sd-web-admin/supertonic/assets'
  const supertonicAssets = supertonicAssetsRaw.startsWith('/')
    ? supertonicAssetsRaw
    : join(process.cwd(), supertonicAssetsRaw)

  const voiceMap: Record<string, string> = {
    M1: 'M1.json',
    M2: 'M2.json',
    M3: 'M3.json',
    M4: 'M4.json',
    M5: 'M5.json',
    F1: 'F1.json',
    F2: 'F2.json',
    F3: 'F3.json',
    F4: 'F4.json',
    F5: 'F5.json',
  }

  const requested = isValidVoiceId(voiceId) ? voiceId.trim().toUpperCase() : ''
  const fallbackByGender = requested.startsWith('M') ? 'M1' : 'F2'
  const defaultByGender = requested.startsWith('M') ? TTS_DEFAULT_VOICE_MALE : TTS_DEFAULT_VOICE_FEMALE

  // Try: requested -> default (by gender) -> hard fallback (M1/F2)
  const candidates = [requested, defaultByGender, fallbackByGender].filter(Boolean)

  let resolvedId = candidates[0]
  for (const c of candidates) {
    const fn = voiceMap[c]
    if (!fn) continue
    const p = join(supertonicAssets, 'voice_styles', fn)
    if (existsSync(p)) {
      resolvedId = c
      break
    }
  }

  const resolvedVoiceFile = voiceMap[resolvedId] || voiceMap.F2
  const voicePath = join(supertonicAssets, 'voice_styles', resolvedVoiceFile)
  const style = helper.loadVoiceStyle([voicePath], false)
  
  cachedStyles.set(voiceId, style)
  return style
}

// ============================================================================
// Main TTS generation with adaptive steps and chunking
// ============================================================================
async function generateTTSAdaptive(
  text: string,
  voiceType: string,
  voiceIdOverride?: string,
  explicitSteps?: number
): Promise<{ wav: Float32Array; sampleRate: number; metrics: TTSMetrics }> {
  const startTime = Date.now()
  const { helper, tts } = await loadSupertonicHelpers()

  // Voice mapping (defaults via env; optional override from request)
  const preferredDefault = voiceType === 'male' ? TTS_DEFAULT_VOICE_MALE : TTS_DEFAULT_VOICE_FEMALE
  const requested = isValidVoiceId(voiceIdOverride) ? voiceIdOverride.trim().toUpperCase() : null
  const voiceId = (requested || preferredDefault).toUpperCase()
  const style = getCachedStyle(voiceId, helper)

  // Preprocess text once for quality and stability
  const cleanedText = preprocessText(text)

  // Determine if we should chunk
  const textLength = cleanedText.length
  const isShort = textLength < 150 // Single short sentence threshold
  const shouldChunk = textLength > TTS_CHUNK_MAX_CHARS

  let chunks: string[]
  let stepsPerChunk: number[]
  let fallbackReduced = false

  if (shouldChunk) {
    chunks = chunkText(cleanedText, TTS_CHUNK_MAX_CHARS)
  } else {
    chunks = [cleanedText]
  }

  // Determine steps for each chunk
  if (explicitSteps !== undefined) {
    // User provided explicit steps - respect it (with cap)
    const cappedSteps = Math.min(Math.max(explicitSteps, TTS_STEPS_MIN), TTS_STEPS_MAX)
    stepsPerChunk = new Array(chunks.length).fill(cappedSteps)
  } else {
    // Adaptive policy
    stepsPerChunk = chunks.map((chunk, idx) => {
      const isFirstChunk = idx === 0
      const chunkIsShort = chunk.length < 150
      return determineSteps(
        chunk,
        chunkIsShort && isFirstChunk,
        chunks.length > 1,
        voiceType
      )
    })
  }

  // Generate audio for each chunk with time budget management
  // Note: tts.call returns { wav: Float32Array, duration: number }
  // wav is audio samples (Float32Array), NOT PCM bytes or Buffer
  const chunkSamples: Float32Array[] = []
  const timeBudget = TTS_MAX_LATENCY_MS
  const chunkStartTime = Date.now()
  let elapsedTime = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = ensureSentenceEnding(chunks[i])
    let steps = stepsPerChunk[i]

    // Check if we're running over budget
    if (i > 0) {
      elapsedTime = Date.now() - chunkStartTime
      const remainingChunks = chunks.length - i
      const avgTimePerChunk = elapsedTime / i
      const estimatedRemaining = avgTimePerChunk * remainingChunks
      const totalEstimated = elapsedTime + estimatedRemaining

      if (totalEstimated > timeBudget && steps > TTS_STEPS_MIN) {
        // Reduce steps for remaining chunks
        steps = Math.max(TTS_STEPS_MIN, Math.floor(steps * 0.6))
        stepsPerChunk[i] = steps
        if (!fallbackReduced) {
          fallbackReduced = true
          console.log(`[TTS] Time budget pressure: reducing steps to ${steps} for remaining chunks`)
        }
      }
    }

    // Generate multiple takes and pick the best one (quality can vary slightly).
    // Glitch guard: avoid takes with long internal silence.
    const baseMaxRuns = Math.max(1, Math.min(TTS_BEST_OF_N, 6))
    let attempt = 0
    let chosen: Float32Array | null = null

    while (attempt <= Math.max(0, TTS_GLITCH_RETRY_LIMIT)) {
      const maxRuns = baseMaxRuns
      // Short chunks benefit more from best-of; long chunks get at most 2 takes to avoid latency.
      const runs = chunk.length <= 120 ? maxRuns : Math.min(maxRuns, 2)

      const takes: Float32Array[] = []
      for (let run = 0; run < runs; run++) {
        const { wav } = await tts.call(chunk, style, steps, TTS_SPEED)
        if (wav && wav.length) takes.push(wav)
      }

      chosen = pickBestTake(takes, tts.sampleRate)
      if (chosen && chosen.length > 0 && !isGlitchTake(chosen, tts.sampleRate)) {
        break
      }

      // Retry: bump steps slightly (helps stability) and try again
      attempt++
      steps = Math.min(TTS_STEPS_MAX, steps + 2)
      stepsPerChunk[i] = steps
      if (attempt <= TTS_GLITCH_RETRY_LIMIT) {
        console.log(`[TTS] Glitch detected in chunk ${i + 1}; retrying (attempt ${attempt}) with steps=${steps}`)
      }
    }

    if (!chosen || chosen.length === 0) {
      throw new Error(`Failed to generate audio for chunk ${i + 1}`)
    }

    chunkSamples.push(chosen)
  }

  // Concatenate chunks if multiple
  // chunkSamples contains Float32Arrays of audio samples
  let finalWav: Float32Array
  if (chunkSamples.length === 1) {
    finalWav = chunkSamples[0]
  } else {
    // Concatenate Float32Arrays directly (helper.writeWavFile handles conversion to WAV)
    finalWav = concatenateAudioSamples(chunkSamples, tts.sampleRate, TTS_CHUNK_SILENCE_MS)
  }

  const totalTime = Date.now() - startTime

  const metrics: TTSMetrics = {
    inputLength: textLength,
    numChunks: chunks.length,
    stepsPerChunk,
    totalTimeMs: totalTime,
    fallbackReduced,
    voiceType,
    voiceId,
  }

  logMetrics(metrics)

  return {
    wav: finalWav,
    sampleRate: tts.sampleRate,
    metrics,
  }
}

// ============================================================================
// HTTP Endpoint
// ============================================================================
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  // Warmup on first request if not already done
  if (!isWarmedUp) {
    await warmupSupertonic()
  }

  try {
    const body = await readBody(event)
    const { 
      text, 
      voiceType = 'female',
      voiceId,
      steps, // Optional: explicit steps parameter (backward compatible)
      num_inference_steps, // Alternative name
      total_step, // Alternative name
    } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Text is required'
      })
    }

    // Support multiple parameter names for steps (backward compatibility)
    const explicitSteps = steps || num_inference_steps || total_step

    // Cache key must include effective voice id for correct caching
    const effectiveVoiceId = isValidVoiceId(voiceId)
      ? voiceId.trim().toUpperCase()
      : (voiceType === 'male' ? TTS_DEFAULT_VOICE_MALE : TTS_DEFAULT_VOICE_FEMALE)
    const cacheKey = `${text.trim()}:${voiceType}:${effectiveVoiceId}:${explicitSteps || 'auto'}`
    const cached = audioCache.get(cacheKey)
    if (cached && cached.filePath && existsSync(cached.filePath)) {
      // Return cached audio URL (file still exists)
      const audioUrl = `/temp-audio/${cached.filePath.split('/').pop()}`
      return {
        success: true,
        audioUrl,
        cached: true,
        metrics: {
          inputLength: text.trim().length,
          numChunks: 1, // Cached, so we don't have original metrics
          totalTimeMs: 0,
          fallbackReduced: false,
          voiceId: effectiveVoiceId,
        },
      }
    }

    // Generate TTS with adaptive strategy
    const { wav, sampleRate, metrics } = await generateTTSAdaptive(
      text.trim(),
      voiceType,
      voiceId,
      explicitSteps !== undefined ? parseInt(String(explicitSteps), 10) : undefined
    )

    // Create WAV file using helper (same as admin implementation)
    // Save to public/temp-audio directory (files cleaned up on server restart)
    const { helper } = await loadSupertonicHelpers()
    const audioDir = join(process.cwd(), 'public', 'temp-audio')
    await mkdir(audioDir, { recursive: true })
    
    const fileName = `conversation-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`
    const filePath = join(audioDir, fileName)
    
    // Use helper.writeWavFile to create proper WAV format (same as admin)
    helper.writeWavFile(filePath, wav, sampleRate)
    
    // Debug: Verify WAV file was created
    console.log(`[TTS] Created WAV file: ${filePath}, samples: ${wav.length}, sample rate: ${sampleRate}`)

      // Cache the file path for faster lookup
      audioCache.set(cacheKey, {
        audioData: Buffer.alloc(0), // Dummy buffer for interface compatibility
        sampleRate,
        timestamp: Date.now(),
        filePath, // Store actual path
      })

    // Return URL to the audio file (same approach as before optimization)
    const audioUrl = `/temp-audio/${fileName}`
    console.log(`[TTS] Returning audio URL: ${audioUrl}`)
    
    return {
      success: true,
      audioUrl,
      metrics: {
        inputLength: metrics.inputLength,
        numChunks: metrics.numChunks,
        totalTimeMs: metrics.totalTimeMs,
        fallbackReduced: metrics.fallbackReduced,
        voiceId: metrics.voiceId,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('TTS generation error:', errorMessage)
    if (errorStack) {
      console.error('Stack trace:', errorStack)
    }
    throw createError({
      statusCode: 500,
      message: `TTS generation failed: ${errorMessage}`,
    })
  }
})
