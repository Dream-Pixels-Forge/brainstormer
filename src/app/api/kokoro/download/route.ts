import { NextResponse } from 'next/server'
import { loadKokoroModel, getKokoroStatus } from '@/lib/kokoro/engine'

export async function POST() {
  const current = getKokoroStatus()

  // Already loaded
  if (current.ready) {
    return NextResponse.json({ ...current, message: 'Model already loaded' })
  }

  // Already loading
  if (current.loading) {
    return NextResponse.json({ ...current, message: 'Model is currently loading' })
  }

  // Start loading (this downloads + loads the model)
  try {
    // Don't await the full load — return immediately and let the client poll /status
    loadKokoroModel().catch(() => {
      // Error is captured in engine state
    })

    return NextResponse.json({
      ...getKokoroStatus(),
      message: 'Model download started',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start download'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
