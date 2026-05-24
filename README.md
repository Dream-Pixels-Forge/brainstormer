# Brainstormer

> AI-powered brainstorming assistant for writers and designers.

Prompt builder, interactive Q&A companion, and multi-format export engine powered by Google Gemini AI.

## Tech Stack

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![Google Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini)
![Motion](https://img.shields.io/badge/Motion-12-FF0080?logo=framer)

## Architecture

```
┌──────────┐     HTTP      ┌──────────┐     API      ┌──────────────┐
│  Browser │  ──────────▶  │ Express  │  ──────────▶  │ Google Gemini │
│  (Vite)  │  ◀──────────  │  Server  │  ◀──────────  │     AI       │
└──────────┘               └──────────┘               └──────────────┘
     │                           │
     │ localStorage              │ Fallback
     ▼                           ▼
┌──────────┐               ┌──────────┐
│ Session  │               │  Local   │
│ History  │               │Procedural│
│ (Indexed)│               │Generator │
└──────────┘               └──────────┘
```

**Client** (React SPA) → **Express Server** → **Google Gemini AI API** with automatic local procedural fallbacks when API rate limits are hit.

## Features

- **Prompt Builder** — Configure persona, platform, tone, format, and topic. Apply 6 quick-start templates.
- **Interactive Q&A Chat** — AI companion that asks clarifying questions and refines your project scope.
- **Gemini AI Integration** — 4 API endpoints: `generate`, `chat`, `generate-from-chat`, `tts`.
- **Local Fallbacks** — High-fidelity procedural generators activate automatically when API quota is exceeded.
- **Voice Recording** — Real-time speech-to-text with waveform visualization and bookmark flags.
- **Text-to-Speech** — Gemini neural TTS with 5 voices (Kore, Puck, Charon, Fenrir, Zephyr) + browser fallback.
- **Multi-Format Export** — Markdown, HTML, XML, JSON (Figma tokens), TXT, PRD.
- **Session History** — Persistent localStorage archive with restore and delete.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

# Start development server
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Configuration

### Personas

| Value     | Label             | Description                   |
|-----------|-------------------|-------------------------------|
| `writer`  | Spec Writer       | Sensory world-building & hooks |
| `designer`| UI Designer       | UI specifications & wireframes |
| `hybrid`  | Hybrid Architect  | Telemetry PRDs & full specs    |

### Platforms

| Value    | Label   | Description       |
|----------|---------|-------------------|
| `notion` | Notion  | Obsidian logs     |
| `figma`  | Figma   | Design specs      |
| `docs`   | GDocs   | Text briefs       |
| `vscode` | IDE     | XML snippets      |

### Tones

- **Sci-Fi** — Neon-infused cyberpunk aesthetic
- **Brutalist** — Raw, high-contrast, chunky
- **Gothic** — Dark, purple-toned, dramatic
- **Whimsical** — Playful, pink gradient
- **Minimalist** — Clean, slate, functional
- **Corporate** — Professional, blue-accented

### Formats

| Value      | Label             | Extension |
|------------|-------------------|-----------|
| `markdown` | Obsidian MD       | `.md`     |
| `xml`      | XML Tags Code     | `.xml`    |
| `html`     | Tailwind HTML     | `.html`   |
| `tokens`   | Figma JSON Tokens | `.json`   |
| `prompt`   | Direct AI prompt  | `.txt`    |
| `prd`      | Draft Product PRD | `.md`     |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate brainstorm from topic + config |
| `/api/chat` | POST | Interactive Q&A conversation |
| `/api/generate-from-chat` | POST | Compile spec dossier from chat history |
| `/api/tts` | POST | Text-to-speech audio generation |

### `/api/generate`

**Request:**
```json
{
  "persona": "writer",
  "platform": "notion",
  "tone": "scifi",
  "topic": "Amara Vance, a renegade warp miner",
  "format": "markdown"
}
```

**Response:**
```json
{
  "title": "Creative Brainstorm: ...",
  "summary": "...",
  "prompts": ["...", "...", "..."],
  "codeOutput": "...",
  "exportFileName": "brainstorm-spec-prd.md"
}
```

### `/api/chat`

**Request:**
```json
{
  "message": "What styling elements should we add?",
  "chatHistory": [...],
  "activeSpec": {...}
}
```

**Response:**
```json
{
  "reply": "### Cohesive Visual Styling...",
  "speech": "That clarifies our user base...",
  "questions": ["...", "...", "..."]
}
```

### `/api/generate-from-chat`

**Request:**
```json
{
  "chatHistory": [...],
  "persona": "writer",
  "platform": "notion",
  "tone": "scifi",
  "format": "markdown"
}
```

**Response:** Same shape as `/api/generate`.

### `/api/tts`

**Request:**
```json
{
  "text": "Your brainstorm spec includes...",
  "voice": "Kore"
}
```

**Response:**
```json
{
  "audio": "<base64-encoded-pcm-audio>"
}
```

Available voices: `Kore`, `Puck`, `Charon`, `Fenrir`, `Zephyr`.

## Deployment

### Google Cloud Run (Recommended)

Brainstormer is designed for **Google Cloud Run** — a fully managed serverless container platform.

```bash
# 1. Build the production bundle
pnpm build
# Output: dist/index.html + assets/ (Vite frontend), dist/server.cjs (Express server)

# 2. Test locally (simulates Cloud Run)
NODE_ENV=production pnpm start

# 3. Deploy via Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

### Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) authenticated to a GCP project
- APIs enabled: `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`
- A Secret Manager secret named `gemini-api-key` containing your Gemini API key

### Environment Variables

Set in Cloud Run console or via `gcloud run deploy --set-secrets`:

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `GEMINI_API_KEY` | Yes | Secret Manager | Google Gemini AI API authentication |
| `APP_URL` | No | Injected by Cloud Run | Service URL for callbacks |
| `NODE_ENV` | Yes | Always `production` | Enables static file serving mode |

### CI/CD Pipeline

- **CI** (`.github/workflows/ci.yml`): Runs `tsc --noEmit` + `pnpm build` on push/PR to `main`
- **CD** (`.github/workflows/deploy.yml`): Builds Docker image, pushes to Artifact Registry, deploys to Cloud Run on push to `main`

See [dev_notes/DEPLOYMENT.md](dev_notes/DEPLOYMENT.md) for full deployment guide, rollback procedures, and troubleshooting.

## Built With

This project was crafted using [Dream Pixels Forge (DPF)](https://github.com/Dream-Pixels-Forge) tools:
- **[dpf-publisher-engineer](https://github.com/Dream-Pixels-Forge/dpf-publisher-engineer)** — Release automation, CI/CD publishing, and distribution

## Project Structure

```
brainstormer/
├── index.html              # HTML entry point
├── server.ts               # Express server + Gemini API routes + fallbacks
├── vite.config.ts          # Vite configuration (React + Tailwind)
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── metadata.json           # AI Studio metadata
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component (layout, tabs, state)
│   ├── index.css           # Tailwind imports + fonts + custom scrollbar
│   ├── types.ts            # TypeScript type definitions
│   ├── data.ts             # Quick templates data
│   └── components/
│       ├── PromptBuilder.tsx   # Configuration form + presets
│       ├── ChatQA.tsx          # Interactive Q&A chat companion
│       ├── VoiceRecorder.tsx   # Speech-to-text with waveform
│       └── AudioPlayer.tsx     # TTS playback controls
├── dev_notes/
│   ├── ARCHITECTURE.md     # Architecture documentation
│   ├── CHANGELOG.md        # Release history
│   ├── PROGRESS.md         # Development progress notes
│   ├── TASKS.md            # Task tracking
│   └── PRIDES.md           # PRIDES methodology guidelines
└── README.md               # This file
```
