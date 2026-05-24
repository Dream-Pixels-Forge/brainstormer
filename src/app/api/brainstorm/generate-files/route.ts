import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ProjectFile {
  filename: string
  content: string
  description: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GenerateFilesRequest {
  idea: string
  messages: ChatMessage[]
  settings: {
    llmModel: string
    questionCount: number
    researchMode: boolean
    github: { repoUrl: string; projectName: string; description: string; tags: string[] }
  }
}

function buildLocalFallbackFiles(idea: string, messages: ChatMessage[]): ProjectFile[] {
  // Extract Q&A content for richer file generation
  const qaSummary = messages
    .map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content}`)
    .join('\n\n')

  return [
    {
      filename: 'idea.md',
      description: 'Core idea and vision',
      content: `# ${idea}\n\n## Vision\nA comprehensive exploration of the core concept, its potential impact, and the value it brings to users.\n\n## Problem Statement\nThis project addresses key challenges in the domain, providing innovative solutions that simplify workflows and enhance user experience.\n\n## Key Insights from Q&A\n${messages.filter((m) => m.role === 'assistant').map((m) => `- ${m.content.slice(0, 120)}`).join('\n') || '- To be defined through further exploration'}\n\n## Goals\n1. Deliver measurable value to target users\n2. Build with scalability and maintainability in mind\n3. Create a delightful and intuitive user experience\n`,
    },
    {
      filename: 'tasks.md',
      description: 'Task breakdown and priorities',
      content: `# Tasks — ${idea}\n\n## Priority 1 — Foundation\n- [ ] Define core data models and schemas\n- [ ] Set up project structure and tooling\n- [ ] Implement authentication and authorization\n- [ ] Create base UI component library\n\n## Priority 2 — Core Features\n- [ ] Build primary user workflow end-to-end\n- [ ] Implement data persistence layer\n- [ ] Add real-time updates and notifications\n- [ ] Create dashboard and analytics views\n\n## Priority 3 — Polish & Launch\n- [ ] Write comprehensive tests\n- [ ] Performance optimization and caching\n- [ ] Documentation and onboarding flow\n- [ ] Deployment pipeline and monitoring\n`,
    },
    {
      filename: 'plan.md',
      description: 'Implementation roadmap',
      content: `# Implementation Plan — ${idea}\n\n## Phase 1: Discovery & Design (Week 1-2)\n- User research and competitive analysis\n- Wireframes and user flow diagrams\n- Technical architecture decisions\n- API contract definitions\n\n## Phase 2: MVP Development (Week 3-5)\n- Core feature implementation\n- Database setup and migrations\n- Frontend component development\n- Integration testing\n\n## Phase 3: Enhancement & Polish (Week 6-7)\n- Performance optimization\n- Error handling and edge cases\n- UX refinements based on feedback\n- Documentation\n\n## Phase 4: Launch & Iteration (Week 8+)\n- Deployment to production\n- Monitoring and analytics setup\n- User feedback collection\n- Iterative improvements\n`,
    },
    {
      filename: 'progress.md',
      description: 'Progress tracking template',
      content: `# Progress Tracker — ${idea}\n\n## Status Overview\n| Phase | Status | Completion |\n|-------|--------|------------|\n| Discovery | Not Started | 0% |\n| Design | Not Started | 0% |\n| Development | Not Started | 0% |\n| Testing | Not Started | 0% |\n| Launch | Not Started | 0% |\n\n## Daily Log\n\n### Day 1\n- [ ] Tasks completed today\n- [ ] Blockers encountered\n- [ ] Plan for tomorrow\n\n## Key Decisions\n| Date | Decision | Rationale |\n|------|----------|------------|\n| - | - | - |\n`,
    },
    {
      filename: 'design.md',
      description: 'Design decisions and guidelines',
      content: `# Design Decisions — ${idea}\n\n## Design Principles\n1. **Clarity** — Every element should communicate its purpose instantly\n2. **Consistency** — Uniform patterns reduce cognitive load\n3. **Feedback** — Every action gets a visible response\n4. **Efficiency** — Minimize steps to complete any task\n\n## Visual Language\n- **Color palette**: Amber/orange accent on dark backgrounds for warmth and energy\n- **Typography**: System font stack for performance and familiarity\n- **Spacing**: 4px base grid with consistent component padding\n- **Motion**: Subtle transitions (150-300ms) for state changes\n\n## Component Architecture\n- Atomic design methodology: atoms → molecules → organisms → templates\n- Shared design tokens for colors, spacing, and typography\n- Accessible by default: WCAG 2.1 AA compliance\n`,
    },
    {
      filename: 'architecture.md',
      description: 'Technical architecture overview',
      content: `# Technical Architecture — ${idea}\n\n## System Overview\nA modern web application built on proven, scalable technologies.\n\n## Tech Stack\n- **Frontend**: React/Next.js with TypeScript\n- **Backend**: Next.js API routes / Node.js services\n- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM\n- **Real-time**: WebSocket / Socket.io for live updates\n- **Deployment**: Docker containers with CI/CD pipeline\n\n## Architecture Pattern\n- **Frontend**: Component-based with server-side rendering\n- **Backend**: API-first with RESTful endpoints\n- **State**: Zustand (client) + TanStack Query (server)\n- **Auth**: NextAuth.js with multiple providers\n\n## Data Flow\n1. User interacts with React components\n2. Client state managed by Zustand store\n3. API calls via fetch with error boundaries\n4. Server processes requests through API routes\n5. Database queries via Prisma ORM\n6. Real-time updates via WebSocket connection\n\n## Key Decisions\n- Monorepo structure for shared types and utilities\n- Edge-first deployment for low latency\n- Feature flags for gradual rollouts\n`,
    },
    {
      filename: 'agents.md',
      description: 'AI agent configurations',
      content: `# AI Agent Configurations — ${idea}\n\n## Agent: Code Reviewer\n- **Trigger**: On pull request creation\n- **Model**: Cloud LLM\n- **Instructions**: Review code for bugs, style, performance. Suggest improvements.\n- **Output**: Inline comments on PR\n\n## Agent: Documentation Writer\n- **Trigger**: On feature completion\n- **Model**: Cloud LLM\n- **Instructions**: Generate API docs, README sections, and usage examples.\n- **Output**: Markdown files in /docs\n\n## Agent: Test Generator\n- **Trigger**: On code change detection\n- **Model**: Cloud LLM\n- **Instructions**: Generate unit and integration tests for modified code.\n- **Output**: Test files alongside source\n\n## Agent: Release Notes\n- **Trigger**: On version bump\n- **Model**: Cloud LLM\n- **Instructions**: Summarize changes, highlight breaking changes, list contributors.\n- **Output**: CHANGELOG.md entry\n`,
    },
    {
      filename: 'claude.md',
      description: 'Claude Code instructions',
      content: `# Claude Code Instructions — ${idea}\n\n## Project Context\nThis project is a brainstorming tool that helps users explore and refine ideas through AI-powered Q&A sessions.\n\n## Code Style\n- TypeScript with strict mode enabled\n- Functional components with hooks\n- Named exports preferred\n- Use path aliases (@/ for src/)\n- shadcn/ui for UI components\n- Tailwind CSS for styling (no inline styles)\n\n## Architecture\n- Next.js App Router with API routes\n- Zustand for client state management\n- Prisma ORM for database access\n- Server-side: use z-ai-web-dev-sdk only\n\n## Conventions\n- File naming: kebab-case for files, PascalCase for components\n- Each API route in its own directory with route.ts\n- Components in src/components/ organized by feature\n- Store in src/lib/brainstormer-store.ts\n\n## Testing\n- Write tests for critical business logic\n- Use React Testing Library for component tests\n- Mock API calls in tests\n\n## Git\n- Conventional commits: feat:, fix:, docs:, chore:\n- PRs require at least one review\n- Squash merge to main\n`,
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFilesRequest = await request.json()
    const { idea, messages, settings } = body

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea is required' },
        { status: 400 }
      )
    }

    // Build Q&A context from messages
    const qaContext = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const systemPrompt = `You are a project scaffolding AI. Given a project idea and Q&A session data, generate a set of project files that would help a developer start building this project. 

Return a JSON array of file objects, each with:
- "filename": string (e.g., "idea.md", "tasks.md", "architecture.md")
- "description": string (one-line summary)
- "content": string (full file content in markdown)

Generate these 8 files:
1. idea.md — Core idea and vision
2. tasks.md — Task breakdown and priorities
3. plan.md — Implementation roadmap
4. progress.md — Progress tracking template
5. design.md — Design decisions and guidelines
6. architecture.md — Technical architecture overview
7. agents.md — AI agent configurations
8. claude.md — Claude Code instructions

Populate each file with specific, relevant content based on the idea and Q&A session. Be detailed and practical.

IMPORTANT: Return ONLY valid JSON. No markdown code fences, no extra text.`

    const userPrompt = `Project Idea: ${idea}

Q&A Session:
${qaContext || 'No Q&A session data available.'}

${settings?.github?.repoUrl ? `GitHub Repository: ${settings.github.repoUrl}` : ''}

Generate 8 project files with detailed, specific content.`

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      // Fallback to local generation
      return NextResponse.json({
        files: buildLocalFallbackFiles(idea, messages),
        fallback: true,
      })
    }

    // Parse the JSON response
    try {
      // Strip markdown code fences if present
      const cleaned = content
        .replace(/^```json?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim()

      const files = JSON.parse(cleaned)

      if (!Array.isArray(files) || files.length === 0) {
        throw new Error('Invalid file array')
      }

      return NextResponse.json({ files })
    } catch {
      // JSON parse failed, use fallback
      return NextResponse.json({
        files: buildLocalFallbackFiles(idea, messages),
        fallback: true,
      })
    }
  } catch (error) {
    console.error('[brainstorm/generate-files] Error:', error)
    return NextResponse.json(
      { error: 'File generation failed', fallback: true },
      { status: 500 }
    )
  }
}
