# Image Generation Prompts — Brainstormer Landing Page

These prompts are designed for Midjourney / DALL-E / Stable Diffusion to generate assets for the landing page. All images should be dark-theme, amber-accented, and match the widget's aesthetic.

---

## 1. Hero — Widget in Use (Primary Hero Image)

**Use**: Full-width hero background / product mockup — the first thing visitors see.

**Prompt:**
```
A frameless dark glassmorphism desktop widget floating centered in a dimly lit 
workspace, seen from slightly above at an angle. The widget has a dark translucent 
background (zinc-900/95) with a subtle amber glow border, showing a minimalist UI 
with "What's your idea?" text inside, a glowing amber brain icon at the top, and 
a microphone button. The workspace background is a dark gradient with ambient amber 
lighting. The widget casts a soft shadow on the desk surface. Cinematic lighting, 
ultra-detailed, 8K, photorealistic but with a subtle sci-fi minimal vibe. Dark 
academia meets cyberpunk — muted, sophisticated, warm amber on deep charcoal. 
No visible window chrome or title bar — it floats like a native widget. 
--ar 3:2 --v 6.1 --style raw
```

---

## 2. Feature: Spark Tab (Idea Input)

**Use**: Feature section showing the idea input flow.

**Prompt:**
```
Close-up view of a dark glassmorphism UI panel with a large text input area 
containing placeholder text "I want to build...", a glowing amber "Spark It" 
button, and a circular red microphone button with a subtle pulse ring. The UI 
has amber accent colors, white/10 borders, and shows a glowing brain icon above 
the input. Background is out-of-focus dark workspace with warm amber bokeh lights. 
The aesthetic is premium, minimal, tool-like — like a developer's creative companion. 
Macro shot style, shallow depth of field, UI elements sharp and crisp. 
--ar 16:9 --v 6.1
```

---

## 3. Feature: Brainstorm Q&A (Chat Tab)

**Use**: Feature section showing the chat/Q&A experience.

**Prompt:**
```
Dark UI chat interface showing an AI brainstorming conversation. On the left, 
a message bubble in dark gray (bg-white/10) with AI text. On the right, a user 
response bubble in warm amber. A progress bar at the top shows "Q 2/5" in amber. 
The UI has a border glow effect, subtle glassmorphism background. The overall 
feel is of an intelligent, focused conversation — not a generic chat app. 
Dark theme, amber accents, minimal UI chrome. Cinematic lighting highlights the 
amber bubble. Text is readable English but intentionally blurred at the edges 
to focus on the conversation flow. 
--ar 16:9 --v 6.1
```

---

## 4. Feature: Export Files

**Use**: Feature section showing project file generation.

**Prompt:**
```
A dark UI panel showing a list of generated project files: idea.md, tasks.md, 
plan.md, architecture.md, etc. Each file card has a small amber file icon, 
filename in white, and download/copy buttons. The UI is minimal, monospaced 
font vibe, developer aesthetic. Background has a subtle amber radial glow behind 
the panel. The scene suggests productivity, organization, creative output. 
Code/markdown preview visible in an expanded card. Dark glassmorphism container 
with white/10 borders. Premium tool aesthetic, not a generic file manager. 
--ar 16:9 --v 6.1
```

---

## 5. Feature: Desktop Native (Tauri)

**Use**: Feature section showing the desktop integration.

**Prompt:**
```
A split composition: left side shows a macOS menu bar with a small amber 
brain icon in the system tray, right side shows the widget pinned on top of 
a code editor (VS Code) with translucent background. A keyboard overlay shows 
"Ctrl+Shift+B" in amber keys. The scene communicates "always available, never 
in the way." Dark workspace, warm amber accents, clean and professional. 
The widget appears as a floating overlay above the editor, demonstrating 
always-on-top behavior. Photorealistic but with premium, editorial photography 
lighting. 
--ar 16:9 --v 6.1
```

---

## 6. Waitlist / CTA Section Background

**Use**: Background or ambient visual for the email capture / waitlist section.

**Prompt:**
```
Abstract dark background with a subtle amber glow radiating from the center, 
like a brain wave or neural activity visualized as warm light pulses. Very dark 
edges (zinc-950), soft radial amber gradient toward center. No text, no UI, 
just atmospheric light. The glow has subtle organic shapes suggesting neural 
connections or idea sparks. Minimal, elegant, premium — could be a hero 
background or a section divider. 8K, volumetric lighting, subtle particle dust 
in the light beams. Dark, moody, sophisticated. 
--ar 3:1 --v 6.1
```

---

## 7. OG Image / Social Card

**Use**: Open Graph preview image for social sharing and SEO.

**Prompt:**
```
A dark square composition with "Brainstormer" in clean sans-serif font (white, 
thin weight, generous letter-spacing) at the top left. Below it, a subtle tagline 
"AI-Powered Brainstorming Widget" in smaller amber text. On the right, a glowing 
abstract brain icon made of wireframe lines in amber on dark background. The 
background is a deep charcoal (almost black) with a subtle amber gradient glow 
from the bottom right. Minimal, premium, Apple-esque. No clutter, just 
typography and a single iconic visual element. High contrast, sophisticated. 
--ar 1:1 --v 6.1 --style raw
```

---

## 8. Device Frames (Mockup Base)

**Use**: Display the widget inside a monitor frame for the hero section.

**Prompt:**
```
A high-end minimalist desk setup from a slightly elevated angle: a thin-bezel 
dark monitor display showing a dark glassmorphism widget panel floating on a 
dark gradient desktop. The widget features amber accents, a glowing brain icon, 
and minimalist UI. The monitor sits on a clean wooden desk with subtle ambient 
amber bias lighting behind the monitor. The room is dark, the lighting is warm 
and dramatic. No keyboard, no clutter — the focus is on the screen content. 
Think Apple product photography meets Blade Runner 2049 minimalism. 
--ar 3:2 --v 6.1
```

---

## Usage

1. Generate images with Midjourney (recommended for best quality) or DALL-E 3
2. Save to `public/images/` with descriptive filenames
3. Reference in the landing page HTML as relative paths `images/brainstormer-hero.png`

| File | Size | Usage |
|------|------|-------|
| `hero-widget.png` | 1200×800 | Hero section — widget mockup |
| `feature-spark.png` | 800×450 | Spark tab feature card |
| `feature-chat.png` | 800×450 | Chat tab feature card |
| `feature-export.png` | 800×450 | Export tab feature card |
| `feature-desktop.png` | 800×450 | Desktop native feature card |
| `bg-waitlist.png` | 1920×640 | Waitlist section background |
| `og-image.png` | 1200×630 | Social sharing card |
