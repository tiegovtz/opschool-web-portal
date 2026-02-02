import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Interaction } from '~/types/interactive-video.interface'

// Use process.cwd() to get the project root, then navigate to server/data
const STORAGE_DIR = join(process.cwd(), 'server', 'data', 'video-interactions')

// Ensure directory exists
async function ensureDir(): Promise<void> {
  try {
    await mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist, ignore error
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

// Get file path for a video
function getFilePath(videoId: string): string {
  // Sanitize videoId to prevent directory traversal
  const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return join(STORAGE_DIR, `${sanitizedId}.json`)
}

// Load interactions for a video
export async function loadInteractions(videoId: string): Promise<Interaction[]> {
  await ensureDir()
  const filePath = getFilePath(videoId)
  
  try {
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data) as Interaction[]
  } catch (error) {
    // File doesn't exist yet, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

// Save interactions for a video
export async function saveInteractions(videoId: string, interactions: Interaction[]): Promise<void> {
  await ensureDir()
  const filePath = getFilePath(videoId)
  
  // Sort interactions by startTime
  const sorted = [...interactions].sort((a, b) => a.startTime - b.startTime)
  
  await writeFile(filePath, JSON.stringify(sorted, null, 2), 'utf-8')
}

// Add a single interaction
export async function addInteraction(videoId: string, interaction: Partial<Interaction>): Promise<Interaction> {
  const interactions = await loadInteractions(videoId)
  
  const newInteraction: Interaction = {
    ...interaction,
    id: interaction.id || `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: interaction.startTime ?? 0,
    endTime: interaction.endTime ?? interaction.startTime ?? 0,
  } as Interaction
  
  interactions.push(newInteraction)
  await saveInteractions(videoId, interactions)
  
  return newInteraction
}

// Update an interaction
export async function updateInteraction(
  videoId: string, 
  interactionId: string, 
  updates: Partial<Interaction>
): Promise<Interaction> {
  const interactions = await loadInteractions(videoId)
  const index = interactions.findIndex(i => i.id === interactionId)
  
  if (index === -1) {
    throw new Error(`Interaction with id ${interactionId} not found`)
  }
  
  const updated = {
    ...interactions[index],
    ...updates,
    id: interactionId, // Ensure ID doesn't change
  } as Interaction
  
  interactions[index] = updated
  await saveInteractions(videoId, interactions)
  
  return updated
}

// Delete an interaction
export async function deleteInteraction(videoId: string, interactionId: string): Promise<void> {
  const interactions = await loadInteractions(videoId)
  const filtered = interactions.filter(i => i.id !== interactionId)
  
  if (filtered.length === interactions.length) {
    throw new Error(`Interaction with id ${interactionId} not found`)
  }
  
  await saveInteractions(videoId, filtered)
}

