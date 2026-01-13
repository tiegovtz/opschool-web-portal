import * as storage from '../../../../utils/videoInteractionsStorage'

export default defineEventHandler(async (event) => {
  const videoId = getRouterParam(event, 'videoId')
  
  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Video ID is required'
    })
  }
  
  try {
    const interactions = await storage.loadInteractions(videoId)
    return interactions
  } catch (error) {
    console.error('Error loading interactions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load interactions'
    })
  }
})

