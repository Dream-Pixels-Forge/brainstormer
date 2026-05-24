import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'http://localhost:11434'

  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        { models: [], error: `Ollama returned ${response.status}` },
        { status: 200 } // still 200 so frontend can handle gracefully
      )
    }

    const data = await response.json()
    const models: string[] = (data.models || []).map(
      (m: { name: string }) => m.name
    )

    return NextResponse.json({ models })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect to Ollama'
    return NextResponse.json(
      { models: [], error: message },
      { status: 200 }
    )
  }
}
