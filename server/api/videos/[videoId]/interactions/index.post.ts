import * as storage from '../../../../utils/videoInteractionsStorage'
import type { Interaction } from '~/types/interactive-video.interface'

export default defineEventHandler(async (event) => {
  const videoId = getRouterParam(event, 'videoId')
  const body = await readBody(event)
  
  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Video ID is required'
    })
  }
  
  // Validate required fields
  if (!body.type) {
    throw createError({
      statusCode: 400,
      message: 'Interaction type is required'
    })
  }
  
  if (typeof body.startTime !== 'number' || body.startTime < 0) {
    throw createError({
      statusCode: 400,
      message: 'Valid startTime is required'
    })
  }
  
  // endTime can be equal to startTime (interactions appear when paused at that time)
  if (typeof body.endTime !== 'number' || body.endTime < body.startTime) {
    throw createError({
      statusCode: 400,
      message: 'Valid endTime must be greater than or equal to startTime'
    })
  }
  
  // Validate type-specific fields
  if (body.type === 'quiz') {
    if (!body.question) {
      throw createError({
        statusCode: 400,
        message: 'Question is required for quiz interactions'
      })
    }
    if (!Array.isArray(body.options) || body.options.length < 2) {
      throw createError({
        statusCode: 400,
        message: 'At least 2 options are required for quiz interactions'
      })
    }
    if (!body.correctAnswer) {
      throw createError({
        statusCode: 400,
        message: 'Correct answer is required for quiz interactions'
      })
    }
  }
  
  if (body.type === 'selection') {
    if (!body.task) {
      throw createError({
        statusCode: 400,
        message: 'Task description is required for selection interactions'
      })
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'At least one item is required for selection interactions'
      })
    }
    if (!Array.isArray(body.labels) || body.labels.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'At least one label is required for selection interactions'
      })
    }
  }
  
  try {
    const interaction = await storage.addInteraction(videoId, body as Partial<Interaction>)
    return interaction
  } catch (error) {
    console.error('Error creating interaction:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create interaction'
    })
  }
})

