# Task 2c — Export and Settings Tabs

## Work Completed

### Files Created

1. **`/home/z/my-project/src/components/brainstormer/ExportTab.tsx`**
   - Full project file export tab with 3 sections (Status, File List, Actions)
   - Auto-generates files when tab opens with messages but no files
   - FileCard component with expand/collapse preview, copy, download per file
   - Download All with Tauri native save dialog support
   - Push to GitHub with tooltip when not configured
   - Local fallback generates 8 template files
   - Amber/orange theme, dark UI

2. **`/home/z/my-project/src/components/brainstormer/SettingsTab.tsx`**
   - 5 organized sections: AI Model, Brainstorming, Voice, GitHub Integration, Data
   - RadioGroup for LLM model (Cloud/Local) and TTS engine (Kokoro/Browser)
   - Slider for question count (3-10)
   - Switch toggles for research mode, TTS, auto-populate
   - GitHub config with URL validation and auto-populate from repo
   - AlertDialog confirmations for destructive actions
   - Test voice button using Web Speech API

3. **`/home/z/my-project/src/app/api/brainstorm/generate-files/route.ts`**
   - API endpoint using z-ai-web-dev-sdk
   - Generates 8 project files from idea + Q&A session data
   - Local fallback with comprehensive template files
   - Handles JSON parsing with markdown fence stripping

### Lint Status
- 0 errors, 0 new warnings
- 1 pre-existing warning in ChatTab.tsx (unused eslint-disable directive)
