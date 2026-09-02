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
    <div className="flex flex-col items-center gap-2 rounded-card border border-brume bg-white px-6 py-10 text-center">
      <Icon size={32} className="text-ardoise" strokeWidth={1.6} />
      <p className="font-display text-base font-semibold text-encre">{titre}</p>
      {description && <p className="max-w-[26ch] text-sm text-ardoise">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
