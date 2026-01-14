import { NextRequest, NextResponse } from 'next/server'
import * as storage from '@/lib/storage/videoInteractionsStorage'
import type { Interaction } from '@/types/interactive-video.interface'

export async function PUT(
  request: NextRequest,
  { params }: { params: { videoId: string; interactionId: string } }
) {
  const videoId = params.videoId
  const interactionId = params.interactionId
  const body = await request.json()
  
  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    )
  }
  
  if (!interactionId) {
    return NextResponse.json(
      { error: 'Interaction ID is required' },
      { status: 400 }
    )
  }
  
  // Validate startTime if provided
  if (body.startTime !== undefined && (typeof body.startTime !== 'number' || body.startTime < 0)) {
    return NextResponse.json(
      { error: 'Valid startTime is required' },
      { status: 400 }
    )
  }
  
  // If startTime is provided but endTime is not, set endTime to startTime
  if (body.startTime !== undefined && body.endTime === undefined) {
    body.endTime = body.startTime
  }
  
  // Validate endTime if provided
  if (body.endTime !== undefined) {
    const existingInteractions = await storage.loadInteractions(videoId)
    const existing = existingInteractions.find(i => i.id === interactionId)
    const startTime = body.startTime !== undefined ? body.startTime : (existing?.startTime ?? 0)
    
    if (typeof body.endTime !== 'number' || body.endTime < startTime) {
      return NextResponse.json(
        { error: 'Valid endTime must be greater than or equal to startTime' },
        { status: 400 }
      )
    }
  }
  
  try {
    const updated = await storage.updateInteraction(videoId, interactionId, body as Partial<Interaction>)
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    console.error('Error updating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string; interactionId: string } }
) {
  const videoId = params.videoId
  const interactionId = params.interactionId
  
  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    )
  }
  
  if (!interactionId) {
    return NextResponse.json(
      { error: 'Interaction ID is required' },
      { status: 400 }
    )
  }
  
  try {
    await storage.deleteInteraction(videoId, interactionId)
    return NextResponse.json({ success: true, message: 'Interaction deleted successfully' })
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    console.error('Error deleting interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}


