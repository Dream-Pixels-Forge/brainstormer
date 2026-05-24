import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, promptConfig } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Build system prompt for the chat context
    const systemPrompt = buildChatSystemPrompt(promptConfig)

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

function buildChatSystemPrompt(config: {
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
