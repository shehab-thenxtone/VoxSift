export const LIMITS = {
  EXTRACTION_TIMEOUT_MS: 8_000,
  MAX_CONTENT_CACHE_ENTRIES: 20,
  MAX_SEGMENTS_PER_ARTICLE: 2_000,
  MAX_TEXT_LEN: 500_000,
  /** Trailing debounce for state persistence */
  PERSIST_DEBOUNCE_MS: 200,
  /** SW keepalive alarm interval (must be < 0.5 min to beat 30s idle) */
  KEEPALIVE_ALARM_PERIOD_MIN: 0.4,
  /** Port ping interval when playing */
  KEEPALIVE_PING_INTERVAL_MS: 20_000,
  /** Drop broadcasts older than this */
  MESSAGE_STALE_THRESHOLD_MS: 5_000,
} as const
