import type { LucideIcon } from 'lucide-react'

const TONE_CLASSES = {
  default: 'text-encre',
  succes: 'text-succes-600',
  critique: 'text-critique-600',
} as const

export default function StatCard({
  icon: Icon,
  label,
  valeur,
  sousTexte,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  valeur: string
  sousTexte?: string
  tone?: keyof typeof TONE_CLASSES
}) {
  return (
    <div className="rounded-card border border-brume bg-white p-4">
      <div className="flex items-center gap-2 text-ardoise">
        <Icon size={16} />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className={`mt-2 font-display text-2xl font-bold tabular-nums ${TONE_CLASSES[tone]}`}>
        {valeur}
      </p>
      {sousTexte && <p className="mt-0.5 text-xs text-ardoise">{sousTexte}</p>}
    </div>
  )
}
