import type { LucideIcon } from 'lucide-react'

export default function StatCard({
  icon: Icon,
  label,
  valeur,
  sousTexte,
}: {
  icon: LucideIcon
  label: string
  valeur: string
  sousTexte?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valeur}</p>
      {sousTexte && <p className="mt-0.5 text-xs text-slate-500">{sousTexte}</p>}
    </div>
  )
}
