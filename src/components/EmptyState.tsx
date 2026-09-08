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
    <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-6 py-10 text-center shadow-card-soft">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-soft text-amber">
        <Icon size={28} strokeWidth={2.2} />
      </div>
      <p className="font-heading text-base font-semibold text-ink">{titre}</p>
      {description && <p className="max-w-[26ch] text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
