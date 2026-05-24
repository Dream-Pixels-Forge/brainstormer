import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface SettingsInput {
  llmModel: string
  questionCount: number
  researchMode: boolean
  ttsEnabled: boolean
  ttsEngine: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, idea, ideaAnalysis, settings, questionIndex, promptConfig } = body

    // Support both new Q&A flow and legacy promptConfig flow
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Build system prompt based on which flow is being used
    let systemPrompt: string
    if (idea) {
      systemPrompt = buildQASystemPrompt(idea, ideaAnalysis, settings as SettingsInput, questionIndex as number)
    } else if (promptConfig) {
      systemPrompt = buildLegacySystemPrompt(promptConfig)
    } else {
      systemPrompt = buildQASystemPrompt('', '', null, 0)
    }

    // Build the messages array for the AI
    const aiMessages: { role: 'assistant' | 'user'; content: string }[] = [
      { role: 'assistant', content: systemPrompt },
    ]

    // Add conversation history (limit to last 20 messages for context)
    const recentMessages = messages.slice(-20)
    for (const msg of recentMessages) {
      const typedMsg = msg as ChatMessageInput
      if (typedMsg.role === 'user' || typedMsg.role === 'assistant') {
        aiMessages.push({
          role: typedMsg.role,
          content: typedMsg.content,
        })
      }
    }

    const completion = await zai.chat.completions.create({
      messages: aiMessages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('[brainstorm/chat] Error:', error)
    return NextResponse.json(
      { error: 'Chat failed', fallback: true },
      { status: 500 }
    )
  }
}

/**
 * System prompt for the Q&A brainstorming flow.
 * Instructs the LLM to ask ONE clarifying question at a time.
 */
function buildQASystemPrompt(
  idea: string,
  ideaAnalysis: string,
  settings: SettingsInput | null,
  questionIndex: number
): string {
  const parts = [
    'You are an expert brainstorming companion conducting a structured Q&A session. Your job is to help the user explore and refine their idea by asking ONE clarifying question at a time.',
    '',
    'CRITICAL RULES:',
    '- Ask exactly ONE question per response. Do not ask multiple questions.',
    '- Keep your question focused and specific.',
    '- Before asking, briefly acknowledge the user\'s previous answer (1-2 sentences max).',
    '- Build on what the user has already shared — don\'t repeat topics already covered.',
    '- Progress from broad exploration to specific details across the conversation.',
    '- Be encouraging but honest about potential challenges.',
    '- Keep responses concise (2-4 sentences before your question).',
    '- End every response with a clear, single question.',
  ]

  if (idea) {
    parts.push(`\nThe user's original idea: "${idea}"`)
  }

  if (ideaAnalysis) {
    parts.push(`\nInitial analysis of the idea: ${ideaAnalysis}`)
  }

  if (settings) {
    if (settings.researchMode) {
      parts.push('\nResearch mode is ON. Incorporate broader context, market trends, and evidence-based insights into your questions.')
    }

    parts.push(`\nThis is question ${questionIndex + 1} of ${settings.questionCount} total questions.`)

    if (questionIndex === 0) {
      parts.push('This is the first question. Start by asking about the core problem or motivation behind the idea.')
    } else if (questionIndex >= settings.questionCount - 2) {
      parts.push('We\'re near the end. Focus on actionable next steps, implementation details, or success metrics.')
    }
  }

  return parts.join('\n')
}

/**
 * Legacy system prompt for the old promptConfig-based chat flow.
 * Kept for backward compatibility.
 */
function buildLegacySystemPrompt(config: {
  persona: string
  platform: string
  tone: string
  topic: string
  customInstructions: string
}): string {
  const parts = [
    'You are an interactive brainstorming companion. Your role is to help the user explore and refine their ideas through conversation.',
    '',
    'GUIDELINES:',
    '- Ask clarifying questions when the user\'s idea is vague',
    '- Offer specific suggestions and alternatives',
    '- Build on the user\'s ideas rather than replacing them',
    '- Use the Socratic method: ask "what if?" and "have you considered?"',
    '- Keep responses concise but substantive (2-4 paragraphs max)',
    '- When the user seems stuck, offer 2-3 specific directions to explore',
    '- Always be encouraging while being honest about potential challenges',
  ]

  if (config.persona) {
    parts.push(`\nYou are acting as a ${config.persona}. Use this expertise to guide the conversation.`)
  }

  if (config.platform) {
    parts.push(`The project targets the ${config.platform} platform. Keep platform-specific considerations in mind.`)
  }

  if (config.tone) {
    parts.push(`Communicate in a ${config.tone.toLowerCase()} tone.`)
  }

  if (config.topic) {
    parts.push(`\nThe current topic is: "${config.topic}". Use this as the primary context for the conversation.`)
  }

  if (config.customInstructions) {
    parts.push(`\nAdditional user instructions: ${config.customInstructions}`)
  }

  return parts.join('\n')
}
