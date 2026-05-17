export interface SpeechSegment {
  /** Stable id — used as React key and in PlaybackState.activeSegmentId */
  id: string
  /** Zero-based index in ExtractedContent.segments */
  index: number
  /** Plain text fed to the TTS engine */
  text: string
  /** Char offset into concatenated article text — used for boundary event mapping */
  charStart: number
  charEnd: number
  /** Paragraph grouping — segments in the same paragraph share this id */
  paragraphId: string
  /** BCP 47 language tag; falls back to ExtractedContent.lang */
  lang: string
}

export interface ExtractedContent {
  /** ULID generated at extraction time; primary key for session storage */
  id: string
  tabId: number
  /** Canonical URL (post-redirect) */
  url: string
  title: string
  byline: string | null
  siteName: string | null
  /** BCP 47 language code */
  lang: string
  /** Sentence-level segments in reading order */
  segments: SpeechSegment[]
  /** Sanitized HTML for reader rendering only — never fed to TTS */
  sanitizedHtml: string
  /** Total character count across all segments — used for progress math */
  totalChars: number
  wordCount: number
  extractedAt: number
  source: 'page' | 'selection'
}
