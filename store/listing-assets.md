# VoxSift — Chrome Web Store Listing Assets

Use this file to populate the Chrome Web Store Developer Dashboard when submitting.

---

## Required Fields

### Extension Name
```
VoxSift
```

### Short Description (max 132 chars — used in manifest.json)
```
Hear the page, not the noise. Smart content extraction and text-to-speech for any webpage.
```
Character count: 90 ✓

### Detailed Description (paste into CWS "Detailed description" field)

```
VoxSift turns any webpage into a clean, distraction-free audio experience. One click and the article or page content is extracted, junk removed, and read aloud in a natural voice — hands-free.

WHAT IT DOES
• Smart extraction — powered by Mozilla Readability, the same engine behind Firefox Reader View. Headers, nav menus, ads, cookie banners, and sidebars are stripped automatically.
• Natural text-to-speech — uses your device's built-in voices via the Web Speech API and Chrome TTS. No external API calls, no subscription required.
• Ghost Mode — dismiss the reader panel while audio keeps playing. A floating mini-player stays on-screen so you stay in control.
• Cross-tab continuity — switch tabs freely. The background service worker owns playback, so audio never stops when you navigate.
• Reader mode — clean, formatted view of the extracted content with per-sentence highlighting that follows along as text is read.
• Resume playback — close and re-open the extension; it remembers where you left off.
• Read selected text — highlight any text on the page and choose "Read Selected Text" to hear just that portion.

CONTROLS
Play · Pause · Stop · Skip forward · Skip back · 5 built-in voices · Speed (0.5× – 3×)

PRIVACY
100% local. No accounts, no analytics, no external requests. Webpage content is processed inside your browser and discarded after playback. Your preferences are stored locally in chrome.storage.local only. Full privacy policy: https://YOUR_PRIVACY_POLICY_URL

PERMISSIONS EXPLAINED
• All sites access — required to extract and read content from any page you visit.
• Storage — saves your voice and speed preferences on your device only.
• TTS — routes audio through Chrome's built-in text-to-speech engine.
• Scripting — injects the reader panel and mini-player into the active tab.
• Offscreen / Alarms / Tabs — keep background playback alive across tab switches.

OPEN SOURCE
VoxSift is MIT licensed. Source code: https://github.com/YOUR_GITHUB_HANDLE/voxsift
```

---

## Store Listing Dashboard Fields

| Field | Value |
|---|---|
| Category | **Accessibility** (primary) |
| Additional categories | Productivity |
| Language | English |
| Privacy policy URL | `https://YOUR_PRIVACY_POLICY_URL` (host `public/privacy-policy.html`) |
| Homepage URL | `https://github.com/YOUR_GITHUB_HANDLE/voxsift` |
| Support URL | `https://github.com/YOUR_GITHUB_HANDLE/voxsift/issues` |

---

## Required Visual Assets

### Store Icon (128x128 PNG) — REQUIRED
File: `public/icons/icon-128.png` ✓

### Screenshots — MINIMUM 1 REQUIRED
Resolution: **1280x800** or **640x400** pixels, JPEG or PNG.

Suggested screenshots to capture:
1. **Popup open** — show the play/pause controls, voice selector, and speed slider on a real article page.
2. **Reader mode** — show the clean extracted text with the per-sentence highlight active.
3. **Mini-player** — show the floating mini-player on a complex news page, contrasting it with the page noise behind it.
4. **Selected text** — show text selected on a page with the "Read Selected Text" prompt visible.

Capture at the right resolution using Playwright:
```bash
npx playwright screenshot --viewport-size=1280,800 http://localhost:5173 store/screenshots/popup.png
```

### Promotional Tiles (optional but recommended)
- Small tile: 440x280 PNG
- Large tile: 920x680 PNG
- Marquee: 1400x560 PNG

---

## Checklist Before Submission

- [ ] Privacy policy hosted at a public URL (update placeholder URLs above and in the description)
- [ ] `public/icons/icon-128.png` present ✓
- [ ] At least 1 screenshot at 1280x800 or 640x400 uploaded
- [ ] All 4 PNG icon sizes present (16, 32, 48, 128) ✓
- [ ] `manifest.json` `description` ≤ 132 characters ✓
- [ ] `manifest.json` `name` ≤ 45 characters ✓
- [ ] No remote code execution (all JS bundled locally) ✓
- [ ] No hardcoded secrets ✓
- [ ] Single, clearly defined purpose ✓
- [ ] All permissions justified in store description ✓
