import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

const TONE_STYLES = {
  succes: { classe: 'bg-ok-bg text-ok', Icon: CheckCircle2 },
  critique: { classe: 'bg-bad-bg text-bad', Icon: AlertCircle },
} as const

export default function Banner({
  tone,
  children,
}: {
  tone: keyof typeof TONE_STYLES
  children: ReactNode
}) {
  const { classe, Icon } = TONE_STYLES[tone]
  return (
    <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${classe}`}>
      <Icon size={17} className="mt-0.5 shrink-0" strokeWidth={2.2} />
      <span>{children}</span>
    </p>
  )
}
