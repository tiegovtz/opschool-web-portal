import { mkdir, unlink, access, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve, isAbsolute } from 'path'
import { spawn } from 'child_process'

// ============================================================================
// Piper configuration (matches sd-web-admin voice map)
// ============================================================================
const PIPER_VOICES_DIR_RAW = process.env.PIPER_VOICES_DIR || join('..', 'piper', 'voices')
const PIPER_VOICES_DIR = isAbsolute(PIPER_VOICES_DIR_RAW)
  ? PIPER_VOICES_DIR_RAW
  : resolve(process.cwd(), PIPER_VOICES_DIR_RAW)
const PIPER_PYTHON = process.env.PIPER_PYTHON || 'python'

// Keep env names for compatibility; now they store Piper voice IDs.
const TTS_DEFAULT_VOICE_FEMALE = (process.env.TTS_DEFAULT_VOICE_FEMALE || 'jenny_dioco').toLowerCase()
const TTS_DEFAULT_VOICE_MALE = (process.env.TTS_DEFAULT_VOICE_MALE || 'northern_english_male').toLowerCase()

const PIPER_VOICE_MAP: Record<string, string> = {
  // Male voices
  alan: 'en_GB-alan-medium',
  northern_english_male: 'en_GB-northern_english_male-medium',
  // Female voices
  jenny_dioco: 'en_GB-jenny_dioco-medium',
  alba: 'en_GB-alba-medium',
  aru: 'en_GB-aru-medium',
  semaine: 'en_GB-semaine-medium',
  vctk: 'en_GB-vctk-medium',
  cori: 'en_GB-cori-high',
  southern_english_female: 'en_GB-southern_english_female-low',
}

const PIPER_VOICE_IDS = new Set(Object.keys(PIPER_VOICE_MAP))

// ============================================================================
// In-memory audio cache
// ============================================================================
interface AudioCacheEntry {
  audioData: Buffer
  sampleRate: number
  timestamp: number
  filePath?: string
  contentType?: string
}

const audioCache = new Map<string, AudioCacheEntry>()
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour cache
const CACHE_MAX_ENTRIES = 200
const CACHE_MAX_BYTES = 64 * 1024 * 1024 // inline audio kept in memory
let audioCacheBytes = 0

function deleteCacheEntry(key: string) {
  const entry = audioCache.get(key)
  if (!entry) return
  audioCacheBytes -= entry.audioData.length
  if (entry.filePath && existsSync(entry.filePath)) {
    unlink(entry.filePath).catch(() => {})
  }
  audioCache.delete(key)
}

function getCacheEntry(key: string): AudioCacheEntry | undefined {
  const entry = audioCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.timestamp > CACHE_MAX_AGE_MS) {
    deleteCacheEntry(key)
    return undefined
  }
  // Refresh recency (Map keeps insertion order, oldest first).
  audioCache.delete(key)
  audioCache.set(key, entry)
  return entry
}

function setCacheEntry(key: string, entry: AudioCacheEntry) {
  deleteCacheEntry(key)
  if (entry.audioData.length > CACHE_MAX_BYTES) return
  audioCache.set(key, entry)
  audioCacheBytes += entry.audioData.length
  while (audioCache.size > CACHE_MAX_ENTRIES || audioCacheBytes > CACHE_MAX_BYTES) {
    const oldest = audioCache.keys().next().value
    if (oldest === undefined) break
    deleteCacheEntry(oldest)
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of [...audioCache.entries()]) {
      if (now - entry.timestamp > CACHE_MAX_AGE_MS) {
        deleteCacheEntry(key)
      }
    }
  }, 5 * 60 * 1000)
}

// ============================================================================
// Queue to serialize Piper work (avoid concurrent RAM spikes)
// ============================================================================
let piperQueue = Promise.resolve<void>(undefined)

function enqueuePiper<T>(task: () => Promise<T>): Promise<T> {
  const run = piperQueue.then(task, task)
  piperQueue = run.then(() => undefined, () => undefined)
  return run
}

// ============================================================================
// Helpers
// ============================================================================
function cleanForTts(text: string): string {
  let output = String(text || '').trim()
  output = output.replace(/https?:\/\/\S+/g, '')
  output = output.replace(/#[\w\-_]+/g, '')
  output = output.replace(/\s{2,}/g, ' ').trim()
  if (output.length > 0 && !/[.!?]$/.test(output)) {
    output += '.'
  }
  return output
}

function isLegacySupertonicVoice(voiceId: unknown): voiceId is string {
  if (typeof voiceId !== 'string') return false
  return /^[FM][1-5]$/i.test(voiceId.trim())
}

function resolveVoiceId(voiceType: string, voiceId?: string): string {
  const requested = (voiceId || '').trim().toLowerCase()
  if (requested && PIPER_VOICE_IDS.has(requested)) {
    return requested
  }
  if (isLegacySupertonicVoice(voiceId)) {
    return voiceId!.toUpperCase().startsWith('M') ? TTS_DEFAULT_VOICE_MALE : TTS_DEFAULT_VOICE_FEMALE
  }
  return voiceType === 'male' ? TTS_DEFAULT_VOICE_MALE : TTS_DEFAULT_VOICE_FEMALE
}

async function getPiperVoicePath(voiceId: string): Promise<string> {
  const voiceModel = PIPER_VOICE_MAP[voiceId]
  if (!voiceModel) {
    throw new Error(
      `Unknown Piper voice: ${voiceId}. Available voices: ${Object.keys(PIPER_VOICE_MAP).join(', ')}`
    )
  }

  try {
    await access(PIPER_VOICES_DIR)
  } catch {
    throw new Error(
      `Piper voices directory not found at: ${PIPER_VOICES_DIR}\n` +
        'Set PIPER_VOICES_DIR to your voice models directory.'
    )
  }

  const possiblePaths = [
    join(PIPER_VOICES_DIR, voiceModel, `${voiceModel}.onnx`),
    join(PIPER_VOICES_DIR, `${voiceModel}.onnx`),
    join(PIPER_VOICES_DIR, voiceModel, 'model.onnx'),
    join(PIPER_VOICES_DIR, 'en', 'en_GB', voiceModel, `${voiceModel}.onnx`),
    join(PIPER_VOICES_DIR, 'en', 'en_GB', `${voiceModel}.onnx`),
  ]

  for (const voicePath of possiblePaths) {
    try {
      await access(voicePath)
      return voicePath
    } catch {
      // try next
    }
  }

  throw new Error(
    `Piper voice model not found for "${voiceId}" (${voiceModel}). Searched in: ${PIPER_VOICES_DIR}`
  )
}

const PIPER_TIMEOUT_MS = Math.max(5000, Number(process.env.TTS_PIPER_TIMEOUT_MS) || 60000)
export const TTS_MAX_TEXT_CHARS = 5000

async function synthesizePiper(text: string, voicePath: string, speed: number, outputPath: string) {
  return new Promise<void>((rawResolve, rawReject) => {
    const pythonProcess = spawn(
      PIPER_PYTHON,
      ['-m', 'piper', '--model', voicePath, '-f', outputPath, '--length-scale', String(speed)],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    )

    // A hung Piper process would block the serialized queue forever: kill it.
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      pythonProcess.kill('SIGKILL')
      unlink(outputPath).catch(() => {})
      reject(new Error(`Piper TTS timed out after ${PIPER_TIMEOUT_MS}ms and was killed`))
    }, PIPER_TIMEOUT_MS)
    const resolve = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      rawResolve()
    }
    const reject = (error: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (pythonProcess.exitCode === null) pythonProcess.kill('SIGKILL')
      rawReject(error)
    }

    const writeText = (textToWrite: string) => {
      return new Promise<void>((writeResolve, writeReject) => {
        const chunkSize = 64 * 1024
        let offset = 0

        const writeChunk = () => {
          if (offset >= textToWrite.length) {
            pythonProcess.stdin.end()
            writeResolve()
            return
          }

          const chunk = textToWrite.slice(offset, offset + chunkSize)
          const canContinue = pythonProcess.stdin.write(chunk, 'utf8')
          offset += chunkSize

          if (!canContinue) {
            pythonProcess.stdin.once('drain', writeChunk)
          } else {
            setImmediate(writeChunk)
          }
        }

        pythonProcess.stdin.on('error', writeReject)
        writeChunk()
      })
    }

    let stderr = ''
    pythonProcess.stderr.on('data', (data) => {
      // Keep only the tail; Piper can be chatty.
      stderr = (stderr + data.toString()).slice(-4000)
    })

    writeText(text)
      .then(() => {
        pythonProcess.on('close', (code, signal) => {
          if (code === 0) {
            access(outputPath)
              .then(() => resolve())
              .catch(() =>
                reject(new Error(`Piper TTS completed but output file not found: ${outputPath}`))
              )
          } else {
            const signalInfo = signal ? ` (signal ${signal})` : ''
            reject(new Error(`Piper TTS failed${signalInfo} with code ${code ?? 'null'}. ${stderr || 'Unknown error'}`))
          }
        })
      })
      .catch((error) => {
        reject(new Error(`Failed to write text to Piper TTS. Original error: ${error.message}`))
      })

    pythonProcess.on('error', (error) => {
      reject(
        new Error(
          `Failed to execute Piper TTS. Ensure Python and piper-tts are installed. Original error: ${error.message}`
        )
      )
    })
  })
}

// ============================================================================
// Public API (used by /api/conversation/tts and /api/conversation/tts-batch)
// ============================================================================
export type TtsRequest = {
  text: string
  voiceType?: string
  voiceId?: string
  inline?: boolean
}

export async function generateTts({ text, voiceType = 'female', voiceId, inline }: TtsRequest) {
  const normalizedVoiceType = voiceType === 'male' ? 'male' : 'female'
  const resolvedVoiceId = resolveVoiceId(normalizedVoiceType, voiceId)
  const cleanedText = cleanForTts(text)

  const cacheKey = `${cleanedText}:${normalizedVoiceType}:${resolvedVoiceId}`
  const cached = getCacheEntry(cacheKey)
  if (cached) {
    if (inline && cached.audioData && cached.audioData.length > 0) {
      return {
        success: true,
        audioBase64: cached.audioData.toString('base64'),
        contentType: cached.contentType || 'audio/wav',
        cached: true,
        metrics: {
          inputLength: cleanedText.length,
          numChunks: 1,
          totalTimeMs: 0,
          fallbackReduced: false,
          voiceId: resolvedVoiceId,
        },
      }
    }
    if (!inline && cached.filePath && existsSync(cached.filePath)) {
      const audioUrl = `/temp-audio/${cached.filePath.split('/').pop()}`
      return {
        success: true,
        audioUrl,
        cached: true,
        metrics: {
          inputLength: cleanedText.length,
          numChunks: 1,
          totalTimeMs: 0,
          fallbackReduced: false,
          voiceId: resolvedVoiceId,
        },
      }
    }
  }

  return await enqueuePiper(async () => {
    const startTime = Date.now()
    const voicePath = await getPiperVoicePath(resolvedVoiceId)

    const audioDir = join(process.cwd(), 'public', 'temp-audio')
    await mkdir(audioDir, { recursive: true })

    const fileName = `conversation-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`
    const filePath = join(audioDir, fileName)

    await synthesizePiper(cleanedText, voicePath, 1.0, filePath)

    if (inline) {
      const audioData = await readFile(filePath)
      await unlink(filePath).catch(() => {})

      setCacheEntry(cacheKey, {
        audioData,
        sampleRate: 0,
        timestamp: Date.now(),
        contentType: 'audio/wav',
      })

      return {
        success: true,
        audioBase64: audioData.toString('base64'),
        contentType: 'audio/wav',
        metrics: {
          inputLength: cleanedText.length,
          numChunks: 1,
          totalTimeMs: Date.now() - startTime,
          fallbackReduced: false,
          voiceId: resolvedVoiceId,
        },
      }
    }

    setCacheEntry(cacheKey, {
      audioData: Buffer.alloc(0),
      sampleRate: 0,
      timestamp: Date.now(),
      filePath,
      contentType: 'audio/wav',
    })

    const audioUrl = `/temp-audio/${fileName}`
    return {
      success: true,
      audioUrl,
      metrics: {
        inputLength: cleanedText.length,
        numChunks: 1,
        totalTimeMs: Date.now() - startTime,
        fallbackReduced: false,
        voiceId: resolvedVoiceId,
      },
    }
  })
}
