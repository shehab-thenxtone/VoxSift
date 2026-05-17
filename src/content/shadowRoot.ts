export interface ShadowRootResult {
  host: HTMLElement
  shadow: ShadowRoot
}

export function createShadowRoot(hostId: string): ShadowRootResult {
  // Remove any existing host
  document.getElementById(hostId)?.remove()

  const host = document.createElement('div')
  host.id = hostId
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0;'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'closed' })
  return { host, shadow }
}

export function destroyShadowRoot(hostId: string): void {
  document.getElementById(hostId)?.remove()
}
