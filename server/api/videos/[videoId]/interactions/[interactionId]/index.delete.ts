import * as storage from '../../../../../utils/videoInteractionsStorage'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'DELETE') {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed'
    })
  }
  
  const videoId = getRouterParam(event, 'videoId')
  const interactionId = getRouterParam(event, 'interactionId')
  
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
  
  try {
    await storage.deleteInteraction(videoId, interactionId)
    return { success: true, message: 'Interaction deleted successfully' }
  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      throw createError({
        statusCode: 404,
        message: (error as Error).message
      })
    }
    console.error('Error deleting interaction:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete interaction'
    })
  }
})

