import * as storage from '../../../../utils/videoInteractionsStorage'
import { defaultInteractions } from '../../../../utils/migrateInteractions'

export default defineEventHandler(async (event) => {
  const videoId = getRouterParam(event, 'videoId')
  const body = await readBody(event).catch(() => ({}))
  const force = body.force === true || body.force === 'true'
  
  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Video ID is required'
    })
  }
  
  try {
    // Check if interactions already exist
    const existing = await storage.loadInteractions(videoId)
    
    if (force) {
      // Force restore: Replace all with defaults (but keep non-default interactions)
      const defaultIds = new Set(defaultInteractions.map(i => i.id))
      const nonDefaultInteractions = existing.filter(i => !defaultIds.has(i.id))
      const merged = [...nonDefaultInteractions, ...defaultInteractions]
      await storage.saveInteractions(videoId, merged)
      return {
        success: true,
        message: `Force restored ${defaultInteractions.length} default interactions. Total: ${merged.length}`,
        interactions: merged
      }
    }
    
    if (existing.length > 0) {
      // Merge with existing interactions (avoid duplicates by ID)
      const existingIds = new Set(existing.map(i => i.id))
      const newInteractions = defaultInteractions.filter(i => !existingIds.has(i.id))
      
      if (newInteractions.length > 0) {
        const merged = [...existing, ...newInteractions]
        await storage.saveInteractions(videoId, merged)
        return {
          success: true,
          message: `Added ${newInteractions.length} new interactions. Total: ${merged.length}`,
          interactions: merged
        }
      } else {
        // All defaults exist, but check if any are missing
        const defaultIds = new Set(defaultInteractions.map(i => i.id))
        const missingDefaults = defaultInteractions.filter(i => !existingIds.has(i.id))
        
        if (missingDefaults.length > 0) {
          const merged = [...existing, ...missingDefaults]
          await storage.saveInteractions(videoId, merged)
          return {
            success: true,
            message: `Restored ${missingDefaults.length} missing default interactions. Total: ${merged.length}`,
            interactions: merged
          }
        }
        
        return {
          success: true,
          message: `All default interactions already exist. Total: ${existing.length}`,
          interactions: existing
        }
      }
    } else {
      // No existing interactions, add all defaults
      await storage.saveInteractions(videoId, defaultInteractions)
      return {
        success: true,
        message: `Successfully restored ${defaultInteractions.length} default interactions`,
        interactions: defaultInteractions
      }
    }
  } catch (error) {
    console.error('Error migrating interactions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to migrate interactions'
    })
  }
})

