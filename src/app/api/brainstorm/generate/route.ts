import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { promptConfig } = await request.json()

    if (!promptConfig || !promptConfig.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = buildSystemPrompt(promptConfig)
    const userPrompt = buildUserPrompt(promptConfig)

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('[brainstorm/generate] Error:', error)
    return NextResponse.json(
      { error: 'Generation failed', fallback: true },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(config: {
  persona: string
  platform: string
  tone: string
  format: string
  customInstructions: string
}): string {
  const parts = [
    'You are a creative brainstorming assistant. Your job is to help users generate, explore, and refine ideas.',
  ]

  if (config.persona) {
    parts.push(`You are acting as a ${config.persona}. Approach the topic from this expert perspective.`)
  }

  if (config.platform) {
    parts.push(`The content is for the ${config.platform} platform. Consider its constraints, audience, and best practices.`)
  }

  if (config.tone) {
    parts.push(`Write in a ${config.tone.toLowerCase()} tone.`)
  }

  if (config.format) {
    parts.push(`Structure your output as a ${config.format}.`)
  }

  parts.push(
    'Provide actionable, specific, and creative ideas. Include:',
    '- A clear structure with headers and sections',
    '- At least 5 specific, actionable ideas or strategies',
    '- Practical tips and considerations',
    '- Next steps the user can take immediately',
    '- Make the content detailed and valuable — aim for substance over brevity'
  )

  if (config.customInstructions) {
    parts.push(`Additional instructions from the user: ${config.customInstructions}`)
  }

  return parts.join('\n')
}

function buildUserPrompt(config: { topic: string; persona: string; platform: string; tone: string; format: string }): string {
  const parts = [`Brainstorm about: ${config.topic}`]

  if (config.persona) parts.push(`Perspective: ${config.persona}`)
  if (config.platform) parts.push(`Platform: ${config.platform}`)
  if (config.tone) parts.push(`Tone: ${config.tone}`)
  if (config.format) parts.push(`Output format: ${config.format}`)

  parts.push(
    '\nGive me a comprehensive brainstorm with creative ideas, strategies, and actionable next steps.'
  )

  return parts.join('\n')
}
