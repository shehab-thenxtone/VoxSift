# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**VoxSift** — a Manifest V3 Chrome extension that extracts meaningful content from webpages and reads it aloud. Tagline: "Hear the page, not the noise."

The PRD lives at `# VoxSift_PRD.md`. This is currently a greenfield project (no implementation yet).

## Planned Tech Stack

| Concern | Choice |
|---|---|
| Extension manifest | Manifest V3 |
| UI framework | React + Tailwind CSS |
| State management | Zustand |
| Content extraction | Mozilla Readability + DOMPurify |
| Text-to-speech | Web Speech API (chrome.tts as fallback) |

## Architecture

Six logical modules defined in the PRD:

### Content Script (`content/`)
Injected into every page. Responsible for DOM analysis, content extraction via Readability, selected-text detection, and messaging to/from the background worker. This is where heuristic scoring runs (positive: semantic tags, long paragraphs, high text density; negative: excessive links, nav keywords, low text ratio).

### Background Service Worker (`background/`)
The single source of truth for playback state. Manages the speech queue, persists session state via `chrome.storage.local`, and coordinates cross-tab playback continuity. Must survive tab switches without losing state.

### Popup UI (`popup/`)
Lightweight quick-controls surface: play/pause/stop, voice selector, speed slider, "Read Selected Text", "Open Reader Mode", Ghost Mode toggle.

### Reader Panel (`reader/`)
Full-page overlay rendered as an injected React app. Displays clean extracted text with per-sentence highlighting synced to TTS position. Includes progress bar and voice settings.

### Floating Mini Player (`miniplayer/`)
Draggable, persistent compact player injected into the page. Survives Ghost Mode (when the Reader Panel is hidden). Auto-minimizes when idle.

### Storage Manager
Thin wrapper over `chrome.storage.local` for playback position, speed, voice preference, and session restore.

## Key Design Constraints

- **All processing is local** — no external API calls in MVP; no analytics; no login.
- **Ghost Mode** means the Reader Panel can be dismissed while audio keeps playing — the Mini Player must remain injected and responsive.
- **Cross-tab persistence** — the Background Service Worker (not a content script) owns playback so switching tabs doesn't interrupt audio.
- **Performance targets**: extraction < 2 s, playback start < 1 s post-extraction; avoid continuous DOM scanning (use event-driven updates).
- **MV3 constraint**: service workers can be terminated by the browser — session state must be persisted to `chrome.storage` eagerly, not lazily.

## MVP Scope

In scope: smart extraction, reader mode, 5 built-in voices, playback controls (play/pause/stop/skip/previous/speed), Ghost Mode, floating mini-player, resume playback.

Out of scope for MVP: AI voices, mobile browser support, cloud sync, offline audio export.
