import type { ReactNode } from 'react'

export const inputClass =
  'h-14 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft'

export const labelClass = 'label-caps text-xs font-bold uppercase text-muted'

export function Champ({
  label,
  children,
  pleineLargeur = false,
}: {
  label: string
  children: ReactNode
  pleineLargeur?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1 ${pleineLargeur ? 'md:col-span-2' : ''}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card-soft">
      <h2 className="label-caps mb-3 text-sm font-bold uppercase text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4">{children}</div>
    </section>
  )
}
