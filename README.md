# Brainstormer

> AI-powered brainstorming desktop widget for writers, designers, and builders.

Prompt builder, interactive Q&A companion, and project file generator — available as a frameless Tauri desktop widget or in the browser.

## Download

Pre-built binaries are available on the [Releases page](https://github.com/dimonapatrick/brainstormer/releases).

| Platform | Format | Install |
|----------|--------|---------|
| **Linux** | `.deb` / `.AppImage` | `sudo dpkg -i brainstormer_*.deb` or run the AppImage |
| **macOS** | `.dmg` | Open the .dmg and drag to Applications |
| **Windows** | `.msi` | Run the installer |

Press **`Ctrl+Shift+B`** anywhere to toggle the widget.

### Build from Source

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm tauri:build
```

The binaries will be in `src-tauri/target/release/bundle/`. Requires Rust + [Tauri system deps](https://v2.tauri.app/start/prerequisites/).

## Tech Stack

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-NY-000000?logo=shadcnui)
![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri)
![Rust](https://img.shields.io/badge/Rust-2024-E34F26?logo=rust)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-000?logo=sqlite)
![Zustand](https://img.shields.io/badge/Zustand-5-000?logo=react)
![Framer Motion](https://img.shields.io/badge/Motion-12-FF0080?logo=framer)
![z-ai-web-dev-sdk](https://img.shields.io/badge/z--ai--web--dev--sdk-0.0.18-8E75B2)
![Ollama](https://img.shields.io/badge/Ollama-Local-000?logo=ollama)
![Kokoro](https://img.shields.io/badge/Kokoro-TTS-FF6F00)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Tauri Desktop                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │            Next.js 16 (App Router)               │ │
│  │  ┌─────────┐ ┌──────┐ ┌────────┐ ┌──────────┐  │ │
│  │  │ Spark   │ │ Chat │ │ Export │ │ Settings │  │ │
│  │  │ (Idea)  │ │ (QA) │ │(Files) │ │(Config)  │  │ │
│  │  └────┬────┘ └──┬───┘ └───┬────┘ └────┬─────┘  │ │
│  │       └─────────┴─────────┴───────────┘         │ │
│  │                  │ Zustand Store                 │ │
│  └──────────────────┼───────────────────────────────┘ │
│                     │                                 │
│  ┌──────────────────┼───────────────────────────────┐ │
│  │      API Routes (Next.js)                        │ │
│  │  /api/brainstorm/*  /api/kokoro/*  /api/ollama/* │ │
│  └──────────────────┼───────────────────────────────┘ │
└─────────────────────┼─────────────────────────────────┘
                      │
     ┌────────────────┼────────────────────┐
     ▼                ▼                    ▼
┌──────────┐   ┌──────────┐        ┌──────────────┐
│ Cloud AI │   │  Ollama  │        │  Kokoro TTS  │
│ (Claude, │   │ (Local)  │        │  (Local 82M) │
│ GPT-4o,  │   └──────────┘        └──────────────┘
│ Gemini)  │
└──────────┘
```

**Desktop-first**: Built as a Tauri 2 frameless, transparent, always-on-top widget with a Rust backend, system tray, and global shortcut (`Ctrl+Shift+B`). Graceful fallback runs entirely in the browser.

## Features

- **Spark Tab** — Enter your idea via text or voice (SpeechRecognition + MediaRecorder), get an AI-powered analysis, and kick off a structured brainstorming session. Quick-start templates included.
- **Chat Tab** — Structured Q&A brainstorming: the AI asks one question at a time, you answer, it builds context. Progress tracking with configurable question count (3-10) and research mode. Voice input and TTS replay for every response.
- **Export Tab** — Auto-generates 8 project files from your Q&A session: `idea.md`, `tasks.md`, `plan.md`, `progress.md`, `design.md`, `architecture.md`, `agents.md`, `claude.md`. Preview, copy, download individually or all at once (Tauri native save dialog or browser download).
- **Settings Tab** — 5 sections:
  - **AI Model**: Cloud (Claude Sonnet 4 / Claude Opus 4 / Claude Haiku 4 / GPT-4o / GPT-4o Mini / Gemini 2.0 Flash) or Local (Ollama with auto-discovered models or custom endpoint)
  - **Brainstorming**: Question count slider (3-10), research mode toggle
  - **Voice**: TTS on/off, Kokoro (local 82M neural TTS, ~86MB download) vs Browser SpeechSynthesis, test voice button
  - **GitHub Integration**: Repo URL, auto-populate, project name, description, tags
  - **Data**: Session management with save/restore/delete, clear all, reset settings
- **TTS (Text-to-Speech)** — Browser SpeechSynthesis API with markdown cleaning, or on-device Kokoro-js (82M parameter, q8 quantized, runs locally via ONNX Runtime).
- **Voice Recording** — Real-time speech-to-text via z-ai-web-dev-sdk ASR or browser SpeechRecognition, with waveform visualization.
- **Session History** — Save brainstorming sessions to localStorage with restore and delete.
- **Desktop Mode** (Tauri) — Frameless window with custom titlebar, drag region, pin/always-on-top, minimize-to-tray, compact mode toggle, system tray icon with menu, `Ctrl+Shift+B` global shortcut.
- **Offline Fallbacks** — Full procedural local generators activate when AI APIs are unavailable.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and API keys as needed

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

Open `http://localhost:3000` in your browser.

### Desktop Mode (Tauri)

```bash
pnpm tauri:dev
```

Requires [Rust toolchain](https://www.rust-lang.org/tools/install) and Tauri system dependencies (see [Tauri docs](https://v2.tauri.app/start/prerequisites/)).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server on port 3000 |
| `pnpm build` | Production build (Next.js standalone) |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |
| `pnpm tauri:dev` | Start Tauri desktop app in dev mode |
| `pnpm tauri:build` | Build Tauri desktop app for production |
| `pnpm db:push` | Push Prisma schema to SQLite database |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:reset` | Reset database |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brainstorm/analyze` | POST | Analyze an idea and generate a structured breakdown |
| `/api/brainstorm/generate` | POST | Legacy brainstorm generation from topic + config |
| `/api/brainstorm/chat` | POST | Interactive Q&A: single-question brainstorming |
| `/api/brainstorm/generate-files` | POST | Generate 8 project files from Q&A session |
| `/api/brainstorm/transcribe` | POST | Audio transcription via ASR |
| `/api/kokoro/status` | GET | Kokoro TTS engine status |
| `/api/kokoro/download` | POST | Download/load Kokoro TTS model |
| `/api/kokoro/synthesize` | POST | Synthesize speech via Kokoro (returns base64 WAV) |
| `/api/ollama/models` | GET | List available Ollama models from endpoint |

### `/api/brainstorm/analyze`

**Request:**
```json
{
  "idea": "I want to build a mind-mapping tool for remote teams",
  "settings": { "questionCount": 5, "researchMode": false }
}
```

**Response:**
```json
{
  "analysis": "# Idea Analysis: ...\n\n## Core Concept\n..."
}
```

### `/api/brainstorm/chat`

**Request:**
```json
{
  "messages": [],
  "idea": "A SaaS app for...",
  "ideaAnalysis": "# Analysis...",
  "settings": { "questionCount": 5 },
  "questionIndex": 0
}
```

**Response:**
```json
{
  "response": "Great question! Let's start with... What problem does your idea solve?"
}
```

## Configuration

### AI Models — Cloud

| Value | Label | Provider |
|-------|-------|----------|
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | Anthropic |
| `claude-opus-4-20250514` | Claude Opus 4 | Anthropic |
| `claude-haiku-4-20250514` | Claude Haiku 4 | Anthropic |
| `gpt-4o` | GPT-4o | OpenAI |
| `gpt-4o-mini` | GPT-4o Mini | OpenAI |
| `gemini-2.0-flash` | Gemini 2.0 Flash | Google |

### AI Models — Local

Any model served by [Ollama](https://ollama.ai) at your configured endpoint (default `http://localhost:11434`).

### TTS Engines

| Engine | Type | Description |
|--------|------|-------------|
| `kokoro` | Local | Kokoro-82M ONNX model, q8 quantized, ~86MB download, runs on CPU via ONNX Runtime |
| `browser` | Built-in | Uses `window.speechSynthesis` (Web Speech API) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path (e.g. `file:/path/to/custom.db`) |

API keys for cloud AI models are configured through the UI Settings tab.

## Project Structure

```
brainstormer/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Entry point — renders WidgetShell
│   │   ├── layout.tsx                 # Root layout (always dark, transparent bg)
│   │   ├── globals.css                # Tailwind imports + theme + widget styles
│   │   └── api/
│   │       ├── brainstorm/
│   │       │   ├── analyze/route.ts   # AI-powered idea analysis
│   │       │   ├── generate/route.ts  # Legacy brainstorm generation
│   │       │   ├── chat/route.ts      # Q&A brainstorming (1 question at a time)
│   │       │   ├── generate-files/route.ts  # Project file generation
│   │       │   └── transcribe/route.ts     # Audio transcription
│   │       ├── kokoro/
│   │       │   ├── status/route.ts    # TTS engine status
│   │       │   ├── download/route.ts  # Model download
│   │       │   └── synthesize/route.ts # Speech synthesis
│   │       └── ollama/
│   │           └── models/route.ts    # List Ollama models
│   ├── components/
│   │   ├── brainstormer/
│   │   │   ├── WidgetShell.tsx        # Main widget: tabs, titlebar, controls
│   │   │   ├── SparkTab.tsx           # Idea input + voice recording + analysis
│   │   │   ├── ChatTab.tsx            # Q&A brainstorming with progress
│   │   │   ├── ExportTab.tsx          # Project file preview + download
│   │   │   └── SettingsTab.tsx        # Full settings with 5 sections
│   │   └── ui/                        # shadcn/ui components (button, card, etc.)
│   ├── lib/
│   │   ├── brainstormer-store.ts      # Zustand store with persist middleware
│   │   ├── brainstormer-fallbacks.ts   # Local fallback generators
│   │   ├── tts-service.ts             # Browser SpeechSynthesis wrapper
│   │   ├── use-tauri.ts               # Tauri API detection + window helpers
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── kokoro/engine.ts           # Kokoro TTS engine (load, synthesize, WAV encode)
│   │   └── utils.ts                   # Utility helpers (cn, etc.)
│   └── hooks/
│       ├── use-mobile.ts              # Mobile breakpoint detection
│       └── use-toast.ts               # Toast hook
├── src-tauri/
│   ├── Cargo.toml                     # Rust dependencies
│   ├── tauri.conf.json                # Window config, tray, shortcuts
│   ├── src/
│   │   ├── main.rs                    # Rust backend: toggle_window, save_file, tray
│   │   └── lib.rs                     # Library entry for mobile
│   └── icons/                         # App icons (32x32, 128x128, icns, ico)
├── prisma/
│   └── schema.prisma                  # SQLite schema (User, Post)
├── db/
│   └── custom.db                      # SQLite database
├── next.config.ts                     # Next.js configuration (standalone output)
├── package.json                       # Dependencies and scripts
├── tailwind.config.ts                 # Tailwind CSS configuration
├── postcss.config.mjs                 # PostCSS with Tailwind
├── components.json                    # shadcn/ui configuration
├── Caddyfile                          # Reverse proxy config (port 81 → 3000)
└── .env                               # Environment variables
```
