import type { VoiceDescriptor } from '../shared/types/voice'

/** Preferred voice name keywords for each of the 5 curated slots. */
const BUILTIN_PREFERENCES = [
  { slot: 0, label: 'Neutral', keywords: ['google us english', 'microsoft david', 'daniel'] },
  { slot: 1, label: 'Warm Female', keywords: ['samantha', 'zira', 'google uk english female'] },
  { slot: 2, label: 'Warm Male', keywords: ['tom', 'alex', 'google uk english male'] },
  { slot: 3, label: 'Energetic Female', keywords: ['karen', 'victoria', 'google australian'] },
  { slot: 4, label: 'Calm Male', keywords: ['fred', 'bruce', 'rishi'] },
] as const

export function buildVoiceCatalog(raw: SpeechSynthesisVoice[]): VoiceDescriptor[] {
  const descriptors: VoiceDescriptor[] = raw.map((v) => ({
    id: v.voiceURI,
    displayName: v.name,
    lang: v.lang,
    engine: 'web-speech' as const,
    localService: v.localService,
    isBuiltIn: false,
  }))

  // Mark curated built-ins
  for (const { keywords, label } of BUILTIN_PREFERENCES) {
    const match = descriptors.find((d) =>
      keywords.some((kw) => d.displayName.toLowerCase().includes(kw)),
    )
    if (match) {
      match.isBuiltIn = true
      match.displayName = label
    }
  }

  return descriptors
}

export function pickDefaultVoice(voices: VoiceDescriptor[]): VoiceDescriptor | undefined {
  return (
    voices.find((v) => v.isBuiltIn && v.lang.startsWith('en')) ??
    voices.find((v) => v.lang.startsWith('en') && v.localService) ??
    voices[0]
  )
}
