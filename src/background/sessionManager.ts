import { PlaybackStateMachine } from './playbackStateMachine'
import { QueueManager } from './queueManager'

export interface TabSession {
  fsm: PlaybackStateMachine
  queue: QueueManager
}

class SessionManager {
  private sessions = new Map<number, TabSession>()
  private _activeTabId: number | null = null

  getOrCreate(tabId: number): TabSession {
    let session = this.sessions.get(tabId)
    if (!session) {
      session = { fsm: new PlaybackStateMachine(), queue: new QueueManager() }
      this.sessions.set(tabId, session)
    }
    return session
  }

  get(tabId: number): TabSession | undefined {
    return this.sessions.get(tabId)
  }

  getActiveTabId(): number | null {
    return this._activeTabId
  }

  getActive(): TabSession | null {
    if (this._activeTabId === null) return null
    return this.sessions.get(this._activeTabId) ?? null
  }

  setActive(tabId: number): void {
    this._activeTabId = tabId
  }

  clearActive(): void {
    this._activeTabId = null
  }

  entries(): IterableIterator<[number, TabSession]> {
    return this.sessions.entries()
  }

  remove(tabId: number): void {
    this.sessions.delete(tabId)
    if (this._activeTabId === tabId) this._activeTabId = null
  }
}

export const sessionManager = new SessionManager()
