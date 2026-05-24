# Brainstormer Landing Page — Build Prompt

```
Role: Senior frontend engineer + conversion designer. You're building
a premium landing page for Brainstormer — an AI-powered desktop widget
that helps writers, designers, and builders generate and refine ideas
through structured Q&A brainstorming. The page has two jobs: sell the
widget and grow the waitlist.

# Personality
Design-obsessed, conversion-aware. You think in terms of visual
hierarchy, scroll narrative, and the critical path from "what is this?"
to "I want it." Every element either builds desire or captures a lead.

# Goal
A single-page landing that makes a visitor:
1. Understand Brainstormer in 3 seconds
2. Feel excited enough to join the waitlist
3. Optionally download or build from source

The primary conversion event is the email signup — downloading is
secondary (the widget is pre-release / invite-only in early access).

# Success criteria

## Above the fold
- Product name + one-line value prop + OS-agnostic download button
- A mockup of the widget (floating dark glass panel with amber accent,
  showing the Spark tab with "What's your idea?" visible)
- No scrolling needed to understand what this is
- The widget mockup should be the dominant visual — text supports it

## Waitlist (primary conversion)
- A prominent email input + CTA button in the hero section
  (not buried below the fold — treat it as a primary action)
- A secondary email capture section near the bottom for visitors who
  scrolled before committing
- CTA copy should emphasize early access: "Get Early Access",
  "Join the Waitlist", "Be the First to Try"
- After email submit: show a confirmation state ("You're on the list!")
  with social sharing option ("Tell a friend")
- Footer includes "No spam, unsubscribe anytime" reassurance

## Feature sections (below the fold)
Four sections, each with a short headline (2-4 words), one sentence of
copy, and a small screenshot or illustration:

1. **Spark** — "Speak your idea. Voice input with real-time transcription."
2. **Brainstorm** — "Structured Q&A. One question at a time, deep context."
3. **Export** — "8 project files. Generated from your conversation."
4. **Desktop Native** — "Ctrl+Shift+B. Always available, never in the way."

## Bottom section
- Cross-platform badges: Linux (.deb/AppImage), macOS (.dmg), Windows (.msi)
- System requirements (brief: Windows 10+, macOS 12+, Linux with WebKit2GTK)
- Keyboard shortcut reminder: "Press Ctrl+Shift+B to toggle"
- "Build from source" link for developers
- Footer: waitlist email input again + copyright

## Visual constraints
- Single HTML file with embedded Tailwind CSS (CDN `<script src="https://cdn.tailwindcss.com">`)
- Dark mode only — match the widget's aesthetic:
  - Background: `bg-zinc-950` to `bg-zinc-900`
  - Accent: amber (`amber-500` primary, `amber-400` hover)
  - Cards/borders: `bg-white/5`, `border border-white/10`
  - Glassmorphism: `backdrop-blur-xl bg-zinc-900/80`
  - Text: `text-white/90` primary, `text-white/50` secondary
- The widget mockup in the hero should use the same design tokens (for
  consistency — it looks like the real product)
- All asset paths relative (images live in `public/images/`)
- Responsive: looks right on 1440px desktop, doesn't break below 1024px
- Motion: CSS transitions only (hover states, scroll reveals via
  Intersection Observer or Tailwind's `motion-safe:`)
- No generic heroes, nested cards, decorative gradients without purpose,
  or visible instructional text like "click here" or "learn more"

# Constraints
- Use existing screenshots from `dev_notes/` as placeholder images.
  Generate proper images later using the prompts in `prompts/image-prompts.md`
- The widget icon is at `src-tauri/icons/icon.png` — use it as favicon
- Email capture must work: POST to a waitlist endpoint or mailto.
  Use a simple Netlify-form-compatible setup or mailto fallback.
  If no backend, use `https://formspree.io/f/...` or similar.
  Make the form action configurable via a comment at the top of the file.
- Keep JS under 50 lines — only for:
  1. Smooth scroll on anchor links
  2. OS detection to show correct download label (`.deb` on Linux etc.)
  3. Email form submission handling (fetch POST + show confirmation state)
  4. A simple scroll-reveal (Intersection Observer) for fade-in sections
- No build step, no framework, no npm. Pure HTML + Tailwind CDN + vanilla JS.

# Output
A single `index.html` at the repo root. Inline all CSS via Tailwind CDN.
Keep it under 400 lines if possible. The file should be launch-ready:
a designer can drop in real images later without touching HTML structure.
```

---

## Conversion Flow Design

```
Visitor arrives
     │
     ▼
┌──────────────────────┐
│   Hero Section       │
│                      │
│  ┌──────┐ ┌───────┐ │
│  │Widget│ │Email  │ │
│  │Mockup│ │Input  │ │  ← Primary CTA
│  └──────┘ │+ CTA  │ │
│           └───────┘ │
│        │            │
│        ▼            │
│   "Get Early Access" │
└──────────────────────┘
     │
     ▼ scrolls
┌──────────────────────┐
│   4 Feature Cards     │  ← Build desire, reinforce value
│  Spark │ Chat         │
│  Export│ Desktop      │
└──────────────────────┘
     │
     ▼ scrolls
┌──────────────────────┐
│   Waitlist CTA #2     │  ← Secondary email capture
│   Platform badges     │
│   Build from source   │
│   Footer              │
└──────────────────────┘
```

The critical insight: the email input should be visible without scrolling,
next to the widget mockup — not hidden behind a "Join Waitlist" button
that leads to a modal. Reduce friction to zero.
