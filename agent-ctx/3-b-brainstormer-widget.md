# Task 3-b: Brainstormer Widget Frontend

## Summary
Created the complete frontend for the Brainstormer Widget — an AI-powered brainstorming assistant that functions as a floating, draggable widget on the page.

## Files Created

### 1. `/home/z/my-project/src/components/brainstormer/WidgetShell.tsx`
- Main floating draggable widget container
- Floating FAB button with Brain icon and amber pulsing indicator when closed
- Header with brainstormer icon, title, minimize/close buttons
- 5-tab navigation bar (Spark, Chat, Voice, Export, History) with lucide-react icons
- Framer-motion animations for open/close, tab transitions, active tab indicator
- Draggable via mouse events on header (updates zustand store position)
- Ctrl+Shift+B keyboard shortcut to toggle
- Glassmorphism effect: `bg-black/80 backdrop-blur-xl`
- 420px wide, positioned bottom-right by default
- Uses zustand store for all widget state

### 2. `/home/z/my-project/src/components/brainstormer/PromptBuilder.tsx`
- 6 Quick-Start Templates grid (Blog Post, Social Campaign, Product Launch, App Concept, Course Outline, Tech Architecture)
- 4 selector dropdowns: Persona, Platform, Tone, Format (using shadcn Select)
- Topic text input and Custom Instructions textarea
- Generate button (amber/orange themed) that calls POST /api/brainstorm/generate
- Reset button to clear all fields
- Falls back to generateLocalBrainstorm when API unavailable
- Uses shadcn Select, Input, Textarea, Button, ScrollArea components

### 3. `/home/z/my-project/src/components/brainstormer/ChatPanel.tsx`
- Scrollable message list with user/assistant message bubbles
- User messages: right-aligned with amber/orange background
- Assistant messages: left-aligned with dark card bg, rendered with ReactMarkdown
- "Use in generation" button on assistant messages
- Auto-scroll to bottom on new messages
- Animated dots loading indicator when AI is thinking
- Input area with text field, send button, and mic button (navigates to Voice tab)
- Calls POST /api/brainstorm/chat with messages and promptConfig
- Falls back to generateLocalChatResponse on API failure

### 4. `/home/z/my-project/src/components/brainstormer/VoiceRecorder.tsx`
- Large circular record button (red, pulsing when recording)
- 30-bar waveform visualization using Web Audio API AnalyserNode for real-time frequency data
- Timer display (MM:SS format)
- Bookmark button to flag important moments
- Bookmark list with timestamps and editable labels
- Stop & Transcribe button: stops recording, sends audio to POST /api/brainstorm/transcribe as base64
- "Add to Chat" button to send transcription as chat message
- Uses browser MediaRecorder API for recording

### 5. `/home/z/my-project/src/components/brainstormer/ExportPanel.tsx`
- 6 format toggle buttons: Markdown, HTML, XML, JSON (Figma), TXT, PRD
- Preview area with rendered/raw toggle for Markdown/PRD formats
- Uses ReactMarkdown for rendered preview
- Copy to Clipboard button
- Download button that creates file with proper extension and MIME type
- Uses generateLocalExport for format conversion
- Empty state when no content generated

### 6. `/home/z/my-project/src/components/brainstormer/HistoryPanel.tsx`
- Save Current Session button with optional name input
- Session cards showing name, date (relative time), message count, topic
- Restore button to load session
- Delete button with AlertDialog confirmation
- Empty state with illustration when no sessions
- Clear All History button with confirmation dialog
- Sessions sorted by most recent first

### 7. `/home/z/my-project/src/app/page.tsx`
- Dark gradient background (zinc-950) with amber/orange ambient glow effects
- Brainstormer icon and title
- Keyboard shortcut hint display (Ctrl+Shift+B)
- Feature cards grid (Smart Prompts, Multi-Format, Voice Input)
- WidgetShell component rendered at root level

## Technical Decisions
- All state managed through existing zustand store at `/lib/brainstormer-store.ts`
- All fallback generators from `/lib/brainstormer-fallbacks.ts` used for offline mode
- No indigo/blue colors — amber/orange theme throughout
- All API calls use relative paths (`/api/brainstorm/generate`, etc.)
- Responsive design with max-width constraints
- Fixed React 19 strict lint rules (no ref access in render, no setState in effects)
- Lint passes cleanly with 0 errors

## Lint Status
✅ `bun run lint` passes with 0 errors, 0 warnings
