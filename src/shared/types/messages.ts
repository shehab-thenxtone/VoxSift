import type { ExtractedContent } from './content'
import type { PlaybackState } from './playback'
import type { VoiceConfig, VoiceDescriptor } from './voice'

export const MESSAGE_TYPE = {
  // Commands: popup/reader/miniplayer → background
  ExtractAndPlay: 'cmd/extractAndPlay',
  ExtractOnly: 'cmd/extractOnly',
  ReadSelection: 'cmd/readSelection',
  Play: 'cmd/play',
  Pause: 'cmd/pause',
  Stop: 'cmd/stop',
  SkipNext: 'cmd/skipNext',
  SkipPrev: 'cmd/skipPrev',
  SeekToSegment: 'cmd/seekToSegment',
  SetVoice: 'cmd/setVoice',
  SetRate: 'cmd/setRate',
  ToggleGhostMode: 'cmd/toggleGhostMode',
  OpenReader: 'cmd/openReader',
  CloseReader: 'cmd/closeReader',

  // Control: background → content
  RunExtraction: 'ctl/runExtraction',
  ExtractSelection: 'ctl/extractSelection',
  MountReader: 'ctl/mountReader',
  UnmountReader: 'ctl/unmountReader',
  MountMiniPlayer: 'ctl/mountMiniPlayer',
  UnmountMiniPlayer: 'ctl/unmountMiniPlayer',
  HighlightSegment: 'ctl/highlightSegment',

  // Queries: any surface → background
  GetPlaybackState: 'q/getPlaybackState',
  GetVoices: 'q/getVoices',

  // Broadcasts: background → all surfaces
  PlaybackUpdated: 'evt/playbackUpdated',
  SegmentBoundary: 'evt/segmentBoundary',
  VoicesChanged: 'evt/voicesChanged',
  ExtractionStarted: 'evt/extractionStarted',
  ExtractionCompleted: 'evt/extractionCompleted',
  ExtractionFailed: 'evt/extractionFailed',
} as const

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

interface Base<T extends MessageType> {
  type: T
  reqId: string
  ts: number
}

export type Message =
  | (Base<typeof MESSAGE_TYPE.ExtractAndPlay> & { tabId: number })
  | (Base<typeof MESSAGE_TYPE.ExtractOnly> & { tabId: number })
  | (Base<typeof MESSAGE_TYPE.ReadSelection> & { tabId: number })
  | Base<typeof MESSAGE_TYPE.Play>
  | Base<typeof MESSAGE_TYPE.Pause>
  | Base<typeof MESSAGE_TYPE.Stop>
  | Base<typeof MESSAGE_TYPE.SkipNext>
  | Base<typeof MESSAGE_TYPE.SkipPrev>
  | (Base<typeof MESSAGE_TYPE.SeekToSegment> & { segmentIndex: number })
  | (Base<typeof MESSAGE_TYPE.SetVoice> & { voice: VoiceConfig })
  | (Base<typeof MESSAGE_TYPE.SetRate> & { rate: number })
  | (Base<typeof MESSAGE_TYPE.ToggleGhostMode> & { enabled: boolean })
  | (Base<typeof MESSAGE_TYPE.OpenReader> & { tabId: number })
  | (Base<typeof MESSAGE_TYPE.CloseReader> & { tabId: number })
  | (Base<typeof MESSAGE_TYPE.RunExtraction> & { contentId: string })
  | (Base<typeof MESSAGE_TYPE.ExtractSelection> & { contentId: string })
  | (Base<typeof MESSAGE_TYPE.MountReader> & { content: ExtractedContent })
  | Base<typeof MESSAGE_TYPE.UnmountReader>
  | (Base<typeof MESSAGE_TYPE.MountMiniPlayer> & { contentId: string })
  | Base<typeof MESSAGE_TYPE.UnmountMiniPlayer>
  | (Base<typeof MESSAGE_TYPE.HighlightSegment> & {
      segmentId: string
      segmentIndex: number
    })
  | Base<typeof MESSAGE_TYPE.GetPlaybackState>
  | Base<typeof MESSAGE_TYPE.GetVoices>
  | (Base<typeof MESSAGE_TYPE.PlaybackUpdated> & { state: PlaybackState })
  | (Base<typeof MESSAGE_TYPE.SegmentBoundary> & {
      segmentId: string
      segmentIndex: number
      charOffsetInSegment: number
    })
  | (Base<typeof MESSAGE_TYPE.VoicesChanged> & { voices: VoiceDescriptor[] })
  | (Base<typeof MESSAGE_TYPE.ExtractionStarted> & { tabId: number })
  | (Base<typeof MESSAGE_TYPE.ExtractionCompleted> & { content: ExtractedContent })
  | (Base<typeof MESSAGE_TYPE.ExtractionFailed> & { tabId: number; reason: string })

export type MessageResponse<T = unknown> =
  | { ok: true; reqId: string; data: T }
  | { ok: false; reqId: string; error: { code: string; message: string } }
