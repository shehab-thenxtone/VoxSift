# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project

**VoxSift** — a Manifest V3 Chrome extension that extracts meaningful content from webpages and reads it aloud. Tagline: "Hear the page, not the noise."

The PRD lives at `VoxSift_PRD.md`. The project is fully implemented and building.

## Tech Stack

| Concern | Choice |
|---|---|
| Extension manifest | Manifest V3 |
| UI framework | React + Tailwind CSS (OKLCH design tokens) |
| State management | Zustand + FSM (`PlaybackStateMachine`) |
| Content extraction | Mozilla Readability + DOMPurify (async/chunked) |
| Text-to-speech | Web Speech API via offscreen doc; chrome.tts as fallback |
| Build | Vite + tsc (`npm run build` → `dist/`, ~558ms clean) |

## Architecture

### Content Script (`content/`)
Injected into every page. Runs `extractPageAsync` in batches of 20 paragraphs, yielding to the event loop between chunks. Sends fire-and-forget `ExtractionProgress` + `ExtractionChunk` messages to background as extraction proceeds, then `ExtractionCompleted` when done.

### Background Service Worker (`background/`)
Single source of truth for playback state. `playbackController` drives `PlaybackStateMachine` + `QueueManager`. Starts TTS on the first `ExtractionChunk` so audio begins before extraction finishes. Persists state to `chrome.storage.session` eagerly (MV3 workers can be terminated).

### Offscreen Document (`offscreen/`)
Hosts `speechSynthesis` (unavailable in MV3 service workers). Receives typed messages from background and forwards boundary/end/error events back.

### Popup UI (`popup/`)
Play/pause/stop, speed slider, Ghost Mode toggle, status badge. Shows an animated SVG ring (0–100%) while extracting. Uses OKLCH dual-theme color system (system + `html.dark` class).

### Reader Panel (`reader/`)
Full-page overlay (shadow DOM). Displays extracted text with per-sentence highlighting synced to TTS boundary events.

### Floating Mini Player (`miniplayer/`)
Draggable compact player injected into the page. Mounts on first chunk arrival; survives Ghost Mode.

## Streaming Extraction Pipeline

```text
Content Script                     Background SW
─────────────────                  ──────────────────────────────
extractPageAsync()
  onProgress → ExtractionProgress → onExtractionProgress() → broadcast
  onChunk (first) → ExtractionChunk(isFirst=true) → onFirstChunk()
                                                       queue.load()
                                                       play()  ← TTS starts
  onChunk (N) → ExtractionChunk → onChunk()
                                    queue.append()
                                    engine.appendSegments()
  done → ExtractionCompleted → loadContent() (wasPlaying guard)
```

## TTS Engines

Both `WebSpeechEngine` and `ChromeTtsEngine` use **per-sentence utterance playlists**. `appendSegments()` pushes new segments to a live playlist without restarting speech. `WebSpeechEngine` chains utterances via `onend`; `ChromeTtsEngine` uses `chrome.tts.speak({ enqueue: true })`.

## Design System

OKLCH channel variables (`--c-surface: L C H`) allow Tailwind alpha modifiers (`bg-accent/10`). Both `@media (prefers-color-scheme: dark)` and `html.dark` class are supported. Defined in `src/ui/tokens.css`; consumed via `tailwind.config.ts`.

## Key Constraints

- **Local only** — no external API calls, no analytics, no login.
- **Ghost Mode** — Reader Panel dismissed but Mini Player stays; audio continues.
- **Cross-tab persistence** — background SW owns state; tab switches don't interrupt audio.
- **MV3** — persist to `chrome.storage` eagerly; don't rely on SW staying alive.

## Development

```bash
npm run build        # tsc type-check + vite bundle → dist/
npm run dev          # watch mode
```

Load the extension: Chrome → `chrome://extensions` → Load unpacked → select `dist/`.
