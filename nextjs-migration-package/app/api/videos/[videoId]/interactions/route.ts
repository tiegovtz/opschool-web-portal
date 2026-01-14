import { NextRequest, NextResponse } from 'next/server'
import * as storage from '@/lib/storage/videoInteractionsStorage'
import type { Interaction } from '@/types/interactive-video.interface'

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const videoId = params.videoId
  
  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const interactions = await storage.loadInteractions(videoId)
    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error loading interactions:', error)
    return NextResponse.json(
      { error: 'Failed to load interactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const videoId = params.videoId
  const body = await request.json()
  
  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    )
  }
  
  // Validate required fields
  if (!body.type) {
    return NextResponse.json(
      { error: 'Interaction type is required' },
      { status: 400 }
    )
  }
  
  if (typeof body.startTime !== 'number' || body.startTime < 0) {
    return NextResponse.json(
      { error: 'Valid startTime is required' },
      { status: 400 }
    )
  }
  
  // endTime can be equal to startTime (interactions appear when paused at that time)
  if (typeof body.endTime !== 'number' || body.endTime < body.startTime) {
    return NextResponse.json(
      { error: 'Valid endTime must be greater than or equal to startTime' },
      { status: 400 }
    )
  }
  
  // Validate type-specific fields
  if (body.type === 'quiz') {
    if (!body.question) {
      return NextResponse.json(
        { error: 'Question is required for quiz interactions' },
        { status: 400 }
      )
    }
    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required for quiz interactions' },
        { status: 400 }
      )
    }
    if (!body.correctAnswer) {
      return NextResponse.json(
        { error: 'Correct answer is required for quiz interactions' },
        { status: 400 }
      )
    }
  }
  
  if (body.type === 'selection') {
    if (!body.task) {
      return NextResponse.json(
        { error: 'Task description is required for selection interactions' },
        { status: 400 }
      )
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required for selection interactions' },
        { status: 400 }
      )
    }
    if (!Array.isArray(body.labels) || body.labels.length === 0) {
      return NextResponse.json(
        { error: 'At least one label is required for selection interactions' },
        { status: 400 }
      )
    }
  }
  
  try {
    const interaction = await storage.addInteraction(videoId, body as Partial<Interaction>)
    return NextResponse.json(interaction)
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}


