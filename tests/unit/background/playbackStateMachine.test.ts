import { describe, test, expect } from 'vitest'
import { PlaybackStateMachine } from '../../../src/background/playbackStateMachine'

describe('PlaybackStateMachine', () => {
  test('starts in idle state', () => {
    const fsm = new PlaybackStateMachine()
    expect(fsm.getState().status).toBe('idle')
  })

  test('transitions to extracting on ExtractAndPlay', () => {
    const fsm = new PlaybackStateMachine()
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    expect(fsm.getState().status).toBe('extracting')
    expect(fsm.getState().tabId).toBe(1)
  })

  test('transitions to ready on ExtractCompleted', () => {
    const fsm = new PlaybackStateMachine()
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    fsm.dispatch({ type: 'EXTRACT_COMPLETED' })
    expect(fsm.getState().status).toBe('ready')
  })

  test('transitions to playing on Play from ready', () => {
    const fsm = new PlaybackStateMachine()
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    fsm.dispatch({ type: 'EXTRACT_COMPLETED' })
    fsm.dispatch({ type: 'PLAY' })
    expect(fsm.getState().status).toBe('playing')
  })

  test('transitions to paused on Pause', () => {
    const fsm = new PlaybackStateMachine()
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    fsm.dispatch({ type: 'EXTRACT_COMPLETED' })
    fsm.dispatch({ type: 'PLAY' })
    fsm.dispatch({ type: 'PAUSE' })
    expect(fsm.getState().status).toBe('paused')
  })

  test('increments revision on each transition', () => {
    const fsm = new PlaybackStateMachine()
    const r0 = fsm.getState().revision
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    expect(fsm.getState().revision).toBe(r0 + 1)
  })

  test('toggles ghost mode without changing playback status', () => {
    const fsm = new PlaybackStateMachine()
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId: 1, contentId: 'cnt_test' })
    fsm.dispatch({ type: 'EXTRACT_COMPLETED' })
    fsm.dispatch({ type: 'PLAY' })
    fsm.dispatch({ type: 'TOGGLE_GHOST_MODE', enabled: true })
    expect(fsm.getState().ghostMode).toBe(true)
    expect(fsm.getState().status).toBe('playing')
  })
})
