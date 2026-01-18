import * as storage from '../../../../../utils/videoInteractionsStorage'
import type { Interaction } from '~/types/interactive-video.interface'

export default defineEventHandler(async (event) => {
  const videoId = getRouterParam(event, 'videoId')
  const interactionId = getRouterParam(event, 'interactionId')
  const body = await readBody(event)
  
  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Video ID is required'
    })
  }
  
  if (!interactionId) {
    throw createError({
      statusCode: 400,
      message: 'Interaction ID is required'
    })
  }
  
  // Validate startTime if provided
  if (body.startTime !== undefined && (typeof body.startTime !== 'number' || body.startTime < 0)) {
    throw createError({
      statusCode: 400,
      message: 'Valid startTime is required'
    })
  }
  
  // If startTime is provided but endTime is not, set endTime to startTime
  // (interactions appear when paused at that time)
  if (body.startTime !== undefined && body.endTime === undefined) {
    body.endTime = body.startTime
  }
  
  // Validate endTime if provided
  if (body.endTime !== undefined) {
    const startTime = body.startTime !== undefined ? body.startTime : (await storage.loadInteractions(videoId)).find(i => i.id === interactionId)?.startTime ?? 0
    // endTime can be equal to startTime (interactions appear when paused at that time)
    if (typeof body.endTime !== 'number' || body.endTime < startTime) {
      throw createError({
        statusCode: 400,
        message: 'Valid endTime must be greater than or equal to startTime'
      })
    }
  }
  
  try {
    const updated = await storage.updateInteraction(videoId, interactionId, body as Partial<Interaction>)
    return updated
  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      throw createError({
        statusCode: 404,
        message: (error as Error).message
      })
    }
    console.error('Error updating interaction:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update interaction'
    })
  }
})

