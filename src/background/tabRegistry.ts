/** Tracks which tab currently owns the active playback session. */
export class TabRegistry {
  private activeTabId: number | null = null

  setActive(tabId: number): void {
    this.activeTabId = tabId
  }

  getActive(): number | null {
    return this.activeTabId
  }

  clear(): void {
    this.activeTabId = null
  }
}

export const tabRegistry = new TabRegistry()
