/**
 * Migration utility to export hardcoded interactions to JSON files
 * This can be run manually to migrate existing interactions
 */

import * as storage from './videoInteractionsStorage'
import type { Interaction, QuizInteraction } from '~/types/interactive-video.interface'

// Default interactions that were previously added
export const defaultInteractions: Interaction[] = [
  {
    id: 'quiz-1',
    type: 'quiz',
    startTime: 57,
    endTime: 62,
    question: 'Before we start, think about this: Imagine a world without the interaction of matter and energy. What would be missing?',
    options: [
      { id: 'option-1', label: 'A) Sunlight' },
      { id: 'option-2', label: 'B) Movement' },
      { id: 'option-3', label: 'C) Electricity' },
      { id: 'option-4', label: 'D) All of the above' },
    ],
    correctAnswer: 'option-4',
    feedback: {
      correct: 'Correct! Without the interaction of matter and energy, the universe as we know it—light, heat, motion—would simply not exist.',
      incorrect: 'Think about how matter and energy interact to create the phenomena we observe. Try again!',
    },
  } as QuizInteraction,
  {
    id: 'quiz-2',
    type: 'quiz',
    startTime: 200,
    endTime: 205,
    question: 'True or False: This statement is true.',
    options: [
      { id: 'option-1', label: 'True' },
      { id: 'option-2', label: 'False' },
    ],
    correctAnswer: 'option-1',
    feedback: {
      correct: 'Correct!',
      incorrect: 'Incorrect. Try again!',
    },
  } as QuizInteraction,
  {
    id: 'quiz-3',
    type: 'quiz',
    startTime: 245,
    endTime: 250,
    question: 'The Kinyerezi station generates electricity using natural gas. This is an example of converting:',
    options: [
      { id: 'option-1', label: 'A) Matter into Space' },
      { id: 'option-2', label: 'B) Chemical Energy into Electrical Energy' },
      { id: 'option-3', label: 'C) Motion into Time' },
    ],
    correctAnswer: 'option-2',
    feedback: {
      correct: 'Correct! Natural gas contains chemical energy that is converted to electrical energy.',
      incorrect: 'Think about what type of energy conversion happens in power generation. Try again!',
    },
  } as QuizInteraction,
]

/**
 * Migrate interactions for a specific video
 * @param videoId - The video ID to migrate interactions for
 * @param interactions - Array of interactions to migrate
 */
export async function migrateInteractionsForVideo(
  videoId: string,
  interactions: Interaction[]
): Promise<void> {
  try {
    // Check if interactions already exist
    const existing = await storage.loadInteractions(videoId)
    
    if (existing.length > 0) {
      console.log(`Video ${videoId} already has ${existing.length} interactions. Skipping migration.`)
      return
    }
    
    // Save interactions
    await storage.saveInteractions(videoId, interactions)
    console.log(`Successfully migrated ${interactions.length} interactions for video ${videoId}`)
  } catch (error) {
    console.error(`Error migrating interactions for video ${videoId}:`, error)
    throw error
  }
}

/**
 * Example usage:
 * 
 * import { migrateInteractionsForVideo } from '~/server/utils/migrateInteractions'
 * 
 * // In an API endpoint or script:
 * await migrateInteractionsForVideo('video-123', exampleInteractions)
 */

