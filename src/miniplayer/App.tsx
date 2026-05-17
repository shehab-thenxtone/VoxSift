import { useEffect } from 'react'
import { MiniPlayerShell } from './components/MiniPlayerShell'
import { initPlaybackChannel } from '../state/playbackStateChannel'

export function MiniPlayerApp() {
  useEffect(() => {
    initPlaybackChannel()
  }, [])

  return <MiniPlayerShell />
}
