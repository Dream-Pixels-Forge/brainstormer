/**
 * Local procedural fallback generators that activate automatically
 * when the AI API quota is exceeded or unavailable.
 */

const PERSONAS: Record<string, string[]> = {
  writer: [
    'Consider opening with a vivid scene that grounds the reader in your world.',
    'Try weaving a central metaphor through your piece — it creates cohesion.',
    'What if you structured this as a journey? Begin with the status quo, move through conflict, end with transformation.',
    'Experiment with unreliable narration to add depth and intrigue.',
    'Use sensory details: what does your world smell, sound, and feel like?',
    'Consider pacing — short sentences for tension, long ones for reflection.',
  ],
  designer: [
    'Start with a mood board: collect colors, textures, and references before designing.',
    'Consider the visual hierarchy — what should the eye see first?',
    'Use the rule of thirds to create balanced compositions.',
    'Think about whitespace as a design element, not empty space.',
    'Consider how your design adapts across different screen sizes and contexts.',
    'Use contrast strategically — it guides attention and creates visual interest.',
  ],
  developer: [
    'Break down the problem into smaller, manageable components.',
    'Consider the data flow first — how does information move through your system?',
    'Think about error handling upfront — what could go wrong?',
    'Consider performance implications of your architecture decisions.',
    'Document your API contracts before implementation.',
    'Plan your testing strategy: unit, integration, and end-to-end.',
  ],
  marketer: [
    'Lead with the pain point — make your audience feel the problem before offering the solution.',
    'Use the AIDA framework: Attention, Interest, Desire, Action.',
    'Consider your call-to-action placement carefully — it should feel natural, not forced.',
    'Social proof is powerful — weave in testimonials and case studies.',
    'Think about the customer journey from awareness to conversion.',
    'A/B test your headlines — they account for 80% of your results.',
  ],
  educator: [
    'Start with what learners already know — build bridges from familiar concepts.',
    'Use the "I do, we do, you do" scaffolding approach.',
    'Include formative checkpoints to gauge understanding before moving on.',
    'Vary your instructional methods: visual, auditory, kinesthetic.',
    'Provide worked examples before asking learners to solve independently.',
    'End with reflection — it consolidates learning.',
  ],
}

const TONES: Record<string, string> = {
  professional: 'Use clear, precise language. Maintain formality while remaining approachable.',
  casual: 'Write as if chatting with a knowledgeable friend. Keep it light and conversational.',
  creative: 'Embrace vivid imagery, unexpected metaphors, and playful language.',
  authoritative: 'Speak with confidence and expertise. Back claims with evidence.',
  empathetic: 'Acknowledge feelings and perspectives. Show understanding before advising.',
  humorous: 'Use wit and gentle humor to make points memorable and engaging.',
}

const PLATFORMS: Record<string, string> = {
  web: 'Optimize for screen reading: short paragraphs, clear headings, visual breaks.',
  mobile: 'Keep it concise. Thumb-friendly. Consider notification context.',
  social: 'Lead with hooks. Use formatting that stops the scroll. Include shareable moments.',
  print: 'Consider the physical page. Longer paragraphs work. Typography matters more.',
  email: 'Subject line is everything. Front-load value. Clear CTA above the fold.',
  presentation: 'One idea per slide. Minimal text. Maximum visual impact.',
}

interface GenerateOptions {
  persona: string
  platform: string
  tone: string
  format: string
  topic: string
  customInstructions: string
}

export function generateLocalBrainstorm(options: GenerateOptions): string {
  const { persona, platform, tone, format, topic } = options
  const personaKey = Object.keys(PERSONAS).find(
    (k) => persona.toLowerCase().includes(k)
  ) || 'writer'
  const personaTips = PERSONAS[personaKey] || PERSONAS.writer
  const toneGuide = TONES[tone.toLowerCase()] || TONES.professional
  const platformGuide = PLATFORMS[platform.toLowerCase()] || PLATFORMS.web

  // Shuffle and pick tips
  const shuffled = [...personaTips].sort(() => Math.random() - 0.5)
  const selectedTips = shuffled.slice(0, 4)

  const formatSection = format
    ? `\n## ${format} Format Considerations\nWhen creating ${format.toLowerCase()} content, focus on structure, clarity, and audience expectations for this medium.`
    : ''

  return `# Brainstorm: ${topic || 'Untitled Project'}

## Persona: ${persona || 'Creative Thinker'}
${selectedTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

## Tone Guide: ${tone || 'Professional'}
${toneGuide}

## Platform Strategy: ${platform || 'Web'}
${platformGuide}
${formatSection}

## Quick-Start Ideas
${generateIdeas(topic, personaKey, 5)}

## Next Steps
1. Review the tips above and select the most relevant ones
2. Sketch a rough outline incorporating your top 3 ideas
3. Set a 15-minute timer and draft without self-editing
4. Review and refine — focus on clarity and impact
5. Get feedback from a peer or test with your target audience

---
*Generated locally by Brainstormer fallback engine*
`
}

function generateIdeas(topic: string, persona: string, count: number): string {
  const ideaTemplates = [
    `Explore "${topic || 'your topic'}" through a counterintuitive angle — what if the opposite were true?`,
    `Connect "${topic || 'your topic'}" to an unexpected domain (nature, music, architecture) for fresh metaphors.`,
    `Consider "${topic || 'your topic'}" from your end user's perspective — what would surprise and delight them?`,
    `Take "${topic || 'your topic'}" and remove one key element — how does the constraint spark creativity?`,
    `Map "${topic || 'your topic'}" across time — past, present, future — to find narrative arcs.`,
    `Ask "what would a 10-year-old think about ${topic || 'your topic'}?" for simplicity insights.`,
    `Combine "${topic || 'your topic'}" with a trending cultural moment for relevance.`,
    `Break "${topic || 'your topic'}" into micro-moments — what's the smallest compelling unit?`,
  ]
  const shuffled = ideaTemplates.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((idea, i) => `${i + 1}. ${idea}`).join('\n')
}

export function generateLocalChatResponse(
  userMessage: string,
  persona: string,
  topic: string
): string {
  const responses = [
    `That's an interesting direction! For your ${topic || 'project'}, consider: what makes this approach uniquely valuable? Try to articulate the "why" behind the "what."`,
    `Great question! When thinking about ${topic || 'this topic'}, I'd suggest starting with your audience's deepest need and working backwards. What problem are they trying to solve?`,
    `I see where you're going with this. As a ${persona || 'creative'}, you might want to explore the tension between ${topic || 'your concept'} and its opposite — that's often where the most compelling ideas live.`,
    `Let me push back a little — what if you approached ${topic || 'this'} from a completely different angle? Sometimes the best ideas come from challenging our initial assumptions.`,
    `Interesting! Here's a framework that might help: think about ${topic || 'your project'} in three layers — the surface experience, the underlying system, and the emotional core. Which layer needs the most attention right now?`,
    `I notice you're focusing on the details. Before diving deeper, can you state the core idea of ${topic || 'your project'} in one sentence? If it's not crystal clear, the details won't matter.`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

export function generateLocalExport(
  content: string,
  format: string,
  topic: string
): string {
  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      return content
    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic || 'Brainstorm'}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 0.5rem; }
    h2 { color: #374151; margin-top: 2rem; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
    .meta { color: #6b7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="meta">Generated by Brainstormer Widget</div>
${markdownToHtmlTags(content)}
</body>
</html>`
    case 'xml':
      return `<?xml version="1.0" encoding="UTF-8"?>
<brainstorm>
  <meta>
    <title>${topic || 'Brainstorm'}</title>
    <generator>Brainstormer Widget</generator>
    <created>${new Date().toISOString()}</created>
  </meta>
  <content><![CDATA[${content}]]></content>
</brainstorm>`
    case 'json':
    case 'figma':
      return JSON.stringify(
        {
          name: topic || 'Brainstorm',
          generator: 'Brainstormer Widget',
          created: new Date().toISOString(),
          content,
          tokens: {
            colors: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
            spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
            typography: {
              heading: { fontFamily: 'system-ui', fontWeight: '700' },
              body: { fontFamily: 'system-ui', fontWeight: '400' },
            },
          },
        },
        null,
        2
      )
    case 'prd':
      return `# Product Requirements Document: ${topic || 'Untitled Project'}

## Document Information
- **Created:** ${new Date().toLocaleDateString()}
- **Generator:** Brainstormer Widget
- **Status:** Draft

## 1. Overview
${topic ? `This document outlines the requirements for ${topic}.` : 'Project overview to be defined.'}

## 2. Problem Statement
[Define the core problem this project solves]

## 3. Target Users
[Describe primary and secondary user personas]

## 4. Goals & Success Metrics
| Goal | Metric | Target |
|------|--------|--------|
| [Goal 1] | [Metric 1] | [Target 1] |
| [Goal 2] | [Metric 2] | [Target 2] |

## 5. Requirements
### Must Have
- [ ] [Requirement 1]
- [ ] [Requirement 2]

### Should Have
- [ ] [Requirement 3]

### Nice to Have
- [ ] [Requirement 4]

## 6. Brainstorm Content
${content}

## 7. Technical Considerations
[Architecture, performance, security notes]

## 8. Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Discovery | 1-2 weeks | Research, interviews |
| Design | 2-3 weeks | Wireframes, prototypes |
| Development | 4-6 weeks | MVP implementation |
| Testing | 1-2 weeks | QA, user testing |

## 9. Open Questions
- [Question 1]
- [Question 2]`
    case 'txt':
    default:
      return content.replace(/[#*_`]/g, '').replace(/\n{3,}/g, '\n\n')
  }
}

function markdownToHtmlTags(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `  <h2>${line.slice(3)}</h2>`
      if (line.startsWith('# ')) return `  <h1>${line.slice(2)}</h1>`
      if (line.startsWith('- ')) return `  <li>${line.slice(2)}</li>`
      if (line.match(/^\d+\.\s/)) return `  <li>${line.replace(/^\d+\.\s/, '')}</li>`
      if (line.trim() === '---') return '  <hr/>'
      if (line.trim() === '') return ''
      return `  <p>${line}</p>`
    })
    .join('\n')
}

// Quick-start templates
export const TEMPLATES: { name: string; description: string; config: import('./brainstormer-store').PromptConfig }[] = [
  {
    name: 'Blog Post',
    description: 'Generate engaging blog post ideas and outlines',
    config: {
      persona: 'Writer',
      platform: 'Web',
      tone: 'Casual',
      format: 'Blog Post',
      topic: '',
      customInstructions: 'Focus on SEO-friendly headlines, engaging intro hooks, and shareable takeaways.',
    },
  },
  {
    name: 'Social Campaign',
    description: 'Plan a multi-platform social media campaign',
    config: {
      persona: 'Marketer',
      platform: 'Social',
      tone: 'Creative',
      format: 'Campaign Brief',
      topic: '',
      customInstructions: 'Include hashtag strategy, content calendar, and platform-specific adaptations.',
    },
  },
  {
    name: 'Product Launch',
    description: 'Brainstorm product launch strategies and messaging',
    config: {
      persona: 'Marketer',
      platform: 'Email',
      tone: 'Professional',
      format: 'Launch Plan',
      topic: '',
      customInstructions: 'Cover pre-launch teaser, launch day, and post-launch nurture sequences.',
    },
  },
  {
    name: 'App Concept',
    description: 'Design and plan a new application concept',
    config: {
      persona: 'Designer',
      platform: 'Mobile',
      tone: 'Creative',
      format: 'PRD',
      topic: '',
      customInstructions: 'Include user flows, key screens, and differentiation from competitors.',
    },
  },
  {
    name: 'Course Outline',
    description: 'Structure an educational course or workshop',
    config: {
      persona: 'Educator',
      platform: 'Web',
      tone: 'Empathetic',
      format: 'Course Syllabus',
      topic: '',
      customInstructions: 'Design for progressive learning with clear outcomes for each module.',
    },
  },
  {
    name: 'Tech Architecture',
    description: 'Plan technical architecture and approach',
    config: {
      persona: 'Developer',
      platform: 'Web',
      tone: 'Authoritative',
      format: 'Technical Spec',
      topic: '',
      customInstructions: 'Cover system design, data flow, scalability considerations, and tech stack rationale.',
    },
  },
]
