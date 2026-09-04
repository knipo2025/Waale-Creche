import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export default function EmptyState({
  icon: Icon,
  titre,
  description,
  action,
}: {
  icon: LucideIcon
  titre: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-wa-line bg-wa-surface px-6 py-10 text-center shadow-card-soft">
      <Icon size={32} className="text-wa-muted" strokeWidth={1.6} />
      <p className="font-display text-base font-semibold text-wa-ink">{titre}</p>
      {description && <p className="max-w-[26ch] text-sm text-wa-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
