# VoxSift

> **Hear the page, not the noise.**

VoxSift is a Manifest V3 Chrome extension that extracts meaningful content from any webpage and reads it aloud. It strips headers, ads, cookie banners, and navigation clutter, then delivers clean audio using your device's built-in voices — no subscription, no account, no external API calls.

---

## Features

| Feature | Description |
|---|---|
| Smart extraction | Powered by Mozilla Readability (same engine as Firefox Reader View) |
| Natural TTS | Web Speech API + Chrome TTS fallback, 5 built-in voices, 0.5×–3× speed |
| Ghost Mode | Dismiss the reader panel; audio keeps playing via the floating mini-player |
| Cross-tab continuity | Background service worker owns playback — switching tabs never interrupts audio |
| Reader mode | Clean extracted view with per-sentence highlight synced to TTS position |
| Selected text | Highlight any text and choose "Read Selected Text" |
| Resume playback | Remembers position across popup closes and tab switches |
| 100% local | No network requests, no analytics, no login |

---

## Architecture

```
src/
├── background/          # MV3 service worker — playback state machine, queue,
│                        #   tab registry, keepalive alarms, crash recovery
├── content/             # Injected into every page — extraction bridge, shadow-DOM
│                        #   mounts for reader panel & mini-player, selection watcher
├── extraction/          # Mozilla Readability wrapper, heuristic scorer,
│                        #   DOMPurify sanitizer, sentence segmenter
├── popup/               # React quick-controls UI (play/pause/stop, speed, voice,
│                        #   Ghost Mode toggle)
├── reader/              # Full-page reader panel with per-sentence highlighting
├── miniplayer/          # Draggable floating player — survives Ghost Mode
├── tts/                 # TTS engine abstraction: Web Speech API + chrome.tts
├── storage/             # chrome.storage.local wrapper with Zod schema + migrations
├── shared/              # Typed message bus, constants, utility types
└── manifest.config.ts   # Extension manifest (TypeScript source, compiled by crxjs)
```

### Key design constraints

- **All processing is local.** No external API calls in MVP.
- **Ghost Mode** — the reader panel can be dismissed while audio keeps playing. The mini-player remains injected and responsive.
- **Cross-tab persistence** — the background service worker (not the content script) owns playback state. Switching tabs never drops audio.
- **MV3 service worker survival** — session state is persisted to `chrome.storage.local` eagerly; `chrome.alarms` prevents the worker from going dormant mid-playback.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Manifest | Manifest V3 |
| UI | React 18 + Tailwind CSS |
| State | Zustand |
| Build | Vite + `@crxjs/vite-plugin` |
| Content extraction | Mozilla Readability + DOMPurify |
| TTS | Web Speech API (`chrome.tts` as fallback) |
| Schema validation | Zod |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Prerequisites

- Node.js 20+
- npm 10+
- Google Chrome 120+

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Generate PNG icons

```bash
npm run icons:generate
```

This downscales `public/icons/icon.svg` (512 px master) to the four sizes required by Chrome (16, 32, 48, 128 px).

### 3. Build the extension

```bash
npm run build
```

The compiled extension is written to `dist/`.

### 4. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

The VoxSift icon appears in the Chrome toolbar. Navigate to any article and click it to start reading.

### 5. Development mode (hot reload)

```bash
npm run dev
```

crxjs watches for file changes and hot-reloads the extension automatically. You still need to load `dist/` once via **Load unpacked** on first run.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with V8 coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run icons:generate` | Regenerate PNG icons from SVG master |
| `npm run lint` | ESLint across `src/` |
| `npm run format` | Prettier formatting across `src/` |

---

## Project Structure

```
VoxSift/
├── dist/                   # Build output (gitignored) — load this folder in Chrome
├── public/
│   ├── icons/              # icon.svg (512px master) + generated PNGs (16/32/48/128)
│   └── privacy-policy.html # Host at a public URL for CWS submission
├── scripts/
│   └── generate-icons.mjs  # PNG icon generation script (uses sharp)
├── src/                    # Extension source — see Architecture section above
├── store/
│   └── listing-assets.md   # Ready-to-paste copy for Chrome Web Store dashboard
├── tests/
│   ├── e2e/                # Playwright E2E specs
│   ├── unit/               # Vitest unit specs
│   └── setup/chromeMock.ts # Chrome API stubs for unit tests
├── manifest.json           # Reference manifest (source-level paths)
└── # VoxSift_PRD.md        # Full product requirements document
```

---

## Manifest

The [manifest.json](manifest.json) at the repo root is the **source-level reference** manifest. During `npm run build`, `@crxjs/vite-plugin` compiles it from [src/manifest.config.ts](src/manifest.config.ts) and rewrites paths to content-hashed asset filenames in `dist/manifest.json`.

### Permissions rationale

| Permission | Why it is needed |
|---|---|
| `storage` | Saves voice selection, speed, and session position in `chrome.storage.local` |
| `tts` | Routes audio through Chrome's built-in TTS engine |
| `activeTab` | Reads the active tab's content when you click the popup |
| `scripting` | Injects the reader panel and mini-player into the page |
| `offscreen` | Runs the Web Speech API from the background service worker |
| `alarms` | Periodic keepalive prevents the MV3 service worker being terminated during long playback |
| `tabs` | Tracks tab state to maintain cross-tab playback continuity |
| `host_permissions: <all_urls>` | Extracts content from any webpage the user chooses to listen to |

---

## Chrome Web Store Submission

All required CWS assets are included:

- **Icons** — 16, 32, 48, 128 px PNGs in `public/icons/`
- **Privacy policy** — `public/privacy-policy.html` (host this page and paste the URL into the CWS dashboard)
- **Store listing copy** — `store/listing-assets.md` (detailed description, category, screenshots checklist, all placeholder URLs to fill in)

See [store/listing-assets.md](store/listing-assets.md) for full step-by-step submission instructions.

---

## Privacy

VoxSift processes everything locally. It makes **zero external network requests**. The only data stored is your voice/speed preferences and current reading position, both in `chrome.storage.local` on your device. Full policy: [public/privacy-policy.html](public/privacy-policy.html).

---

## MVP Scope

**In scope:** smart extraction, reader mode, 5 built-in voices, playback controls (play/pause/stop/skip/previous/speed), Ghost Mode, floating mini-player, resume playback, read selected text.

**Out of scope for MVP:** AI voices, mobile browser support, cloud sync, offline audio export.

---

## License

MIT
