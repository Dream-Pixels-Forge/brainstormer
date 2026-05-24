import { NextResponse } from 'next/server'
import { getKokoroStatus } from '@/lib/kokoro/engine'

export async function GET() {
  const status = getKokoroStatus()
  return NextResponse.json(status)
}
