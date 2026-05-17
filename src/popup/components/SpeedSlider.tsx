import { Slider } from '../../ui/Slider'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'

interface Props {
  rate: number
}

export function SpeedSlider({ rate }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value)
    sendToBackground({ type: MESSAGE_TYPE.SetRate, rate: newRate } as Parameters<typeof sendToBackground>[0])
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-8 text-right">{rate.toFixed(1)}×</span>
      <Slider
        min={0.5}
        max={2.0}
        step={0.1}
        value={rate}
        onChange={handleChange}
        aria-label="Playback speed"
        className="flex-1"
      />
    </div>
  )
}
