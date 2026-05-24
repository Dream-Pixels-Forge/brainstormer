import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { audio } = await request.json()

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const response = await zai.audio.asr.create({
      file_base64: audio,
    })

    const text = response.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty transcription result' },
        { status: 500 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[brainstorm/transcribe] Error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', fallback: true },
      { status: 500 }
    )
  }
}
