import type { LucideIcon } from 'lucide-react'

const TONE_STYLES = {
  neutre: { valeur: 'text-ink', badge: 'bg-pin-soft text-pin-ink' },
  ok: { valeur: 'text-ok', badge: 'bg-ok-bg text-ok' },
  bad: { valeur: 'text-bad', badge: 'bg-bad-bg text-bad' },
} as const

export default function StatCard({
  icon: Icon,
  label,
  valeur,
  sousTexte,
  tone = 'neutre',
}: {
  icon: LucideIcon
  label: string
  valeur: string
  sousTexte?: string
  tone?: keyof typeof TONE_STYLES
}) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card-soft">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.badge}`}>
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <p className="label-caps mt-2 text-xs font-bold uppercase text-muted">{label}</p>
      <p className={`mt-0.5 font-heading text-2xl font-bold tabular-nums ${styles.valeur}`}>
        {valeur}
      </p>
      {sousTexte && <p className="mt-0.5 text-xs text-muted">{sousTexte}</p>}
    </div>
  )
}
