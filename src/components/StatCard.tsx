import type { LucideIcon } from 'lucide-react'

const TONE_STYLES = {
  sky: { valeur: 'text-wa-ink', badge: 'bg-school-sky/15 text-school-sky' },
  green: { valeur: 'text-wa-ink', badge: 'bg-wa-green-50 text-wa-green-700' },
  money: { valeur: 'text-wa-money', badge: 'bg-wa-green-50 text-wa-green-700' },
  coral: { valeur: 'text-wa-danger', badge: 'bg-school-coral/15 text-school-coral' },
} as const

export default function StatCard({
  icon: Icon,
  label,
  valeur,
  sousTexte,
  tone = 'green',
}: {
  icon: LucideIcon
  label: string
  valeur: string
  sousTexte?: string
  tone?: keyof typeof TONE_STYLES
}) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="rounded-card border border-wa-line bg-wa-surface p-4 shadow-card-soft">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.badge}`}>
        <Icon size={17} />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-wa-muted">{label}</p>
      <p className={`mt-0.5 font-heading text-2xl font-bold tabular-nums ${styles.valeur}`}>
        {valeur}
      </p>
      {sousTexte && <p className="mt-0.5 text-xs text-wa-muted">{sousTexte}</p>}
    </div>
  )
}
