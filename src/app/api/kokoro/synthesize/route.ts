import { NextRequest, NextResponse } from 'next/server'
import { synthesize, getKokoroStatus, loadKokoroModel } from '@/lib/kokoro/engine'

export async function POST(request: NextRequest) {
  try {
    // Ensure model is loaded
    let status = getKokoroStatus()
    if (!status.ready) {
      if (status.loading) {
        return NextResponse.json(
          { error: 'Model is still loading. Please wait.' },
          { status: 503 }
        )
      }
      // Try to load on demand
      status = await loadKokoroModel()
      if (!status.ready) {
        return NextResponse.json(
          { error: `Model not available: ${status.error || 'Unknown error'}` },
          { status: 503 }
        )
      }
    }

    const body = await request.json()
    const { text, voice, speed } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    const result = await synthesize({
      text,
      voice: voice || 'af_heart',
      speed: speed || 1.0,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Synthesis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
