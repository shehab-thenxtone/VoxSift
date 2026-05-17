import { createRoot } from 'react-dom/client'
import { createShadowRoot, destroyShadowRoot } from './shadowRoot'
import miniCss from './styles/miniplayer.css?inline'

const HOST_ID = 'voxsift-miniplayer-host'
let miniRoot: ReturnType<typeof createRoot> | null = null

export function mountMiniPlayer(_contentId: string): void {
  const { shadow } = createShadowRoot(HOST_ID)

  const style = document.createElement('style')
  style.textContent = miniCss
  shadow.appendChild(style)

  const container = document.createElement('div')
  shadow.appendChild(container)

  import('../miniplayer').then(({ MiniPlayerApp }) => {
    miniRoot = createRoot(container)
    miniRoot.render(<MiniPlayerApp />)
  })
}

export function unmountMiniPlayer(): void {
  miniRoot?.unmount()
  miniRoot = null
  destroyShadowRoot(HOST_ID)
}
