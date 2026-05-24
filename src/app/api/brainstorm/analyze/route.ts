import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { idea, settings } = await request.json()

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return NextResponse.json(
        { error: 'Idea is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = buildAnalyzeSystemPrompt(settings)
    const userPrompt = buildAnalyzeUserPrompt(idea, settings)

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const analysis = completion.choices[0]?.message?.content

    if (!analysis) {
      return NextResponse.json(
        { error: 'Empty analysis from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[brainstorm/analyze] Error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', fallback: true },
      { status: 500 }
    )
  }
}

function buildAnalyzeSystemPrompt(settings: {
  llmModel?: string
  questionCount?: number
  researchMode?: boolean
  ttsEngine?: string
  ttsEnabled?: boolean
}): string {
  const parts = [
    'You are a creative brainstorming analyst. When a user presents a raw idea, your job is to:',
    '',
    '1. Understand the core concept and intent',
    '2. Identify the target audience and problem it solves',
    '3. Break it down into key components and considerations',
    '4. Suggest initial directions and questions to explore',
    '5. Assess feasibility and potential challenges',
    '',
    'Provide a structured analysis that sets up a productive brainstorming session.',
    'Be specific, actionable, and encouraging. Use markdown formatting with headers and bullet points.',
  ]

  if (settings.researchMode) {
    parts.push(
      '',
      'RESEARCH MODE: The user wants you to do deeper research. Provide more detailed analysis with references to industry trends, competitors, and market data where relevant.'
    )
  }

  const questionCount = settings.questionCount ?? 5
  parts.push(
    '',
    `The user has configured ${questionCount} Q&A rounds. Structure your analysis to lead into ${questionCount} key questions that will refine this idea.`
  )

  return parts.join('\n')
}

function buildAnalyzeUserPrompt(idea: string, _settings: Record<string, unknown>): string {
  return `Here's my idea: "${idea}"

Please analyze this idea and provide:
1. **Core Concept**: A clear restatement of the idea
2. **Problem & Audience**: What problem does it solve and for whom?
3. **Key Components**: Break it into 3-5 main parts or features
4. **Initial Directions**: 3-4 possible approaches to explore
5. **Challenges**: 2-3 potential obstacles to anticipate
6. **First Questions**: The most important questions to answer first

Keep the analysis concise but thorough — this is the starting point for our brainstorming conversation.`
}
