import type { LucideIcon } from 'lucide-react'

const TONE_STYLES = {
  default: { valeur: 'text-encre', badge: 'bg-pin-50 text-pin-700' },
  succes: { valeur: 'text-succes-600', badge: 'bg-succes-50 text-succes-700' },
  critique: { valeur: 'text-critique-600', badge: 'bg-critique-50 text-critique-700' },
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
  tone?: keyof typeof TONE_STYLES
}) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="rounded-card border border-brume bg-white p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.badge}`}>
        <Icon size={17} />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ardoise">{label}</p>
      <p className={`mt-0.5 font-display text-2xl font-bold tabular-nums ${styles.valeur}`}>
        {valeur}
      </p>
      {sousTexte && <p className="mt-0.5 text-xs text-ardoise">{sousTexte}</p>}
    </div>
  )
}
