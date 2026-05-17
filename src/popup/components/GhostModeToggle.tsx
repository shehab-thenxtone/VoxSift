import { Toggle } from '../../ui/Toggle'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'

interface Props {
  enabled: boolean
}

export function GhostModeToggle({ enabled }: Props) {
  return (
    <Toggle
      checked={enabled}
      onChange={(checked) =>
        sendToBackground({ type: MESSAGE_TYPE.ToggleGhostMode, enabled: checked } as Parameters<typeof sendToBackground>[0])
      }
      label="Ghost Mode"
    />
  )
}
