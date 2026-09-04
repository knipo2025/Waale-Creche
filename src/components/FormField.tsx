import type { ReactNode } from 'react'

export const inputClass =
  'h-14 w-full rounded-xl border border-wa-line bg-wa-surface px-4 text-base text-wa-ink outline-none focus:border-wa-green-600 focus:ring-2 focus:ring-wa-green-50'

export const labelClass = 'text-sm font-medium text-wa-muted'

export function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-wa-line bg-wa-surface p-4 shadow-card-soft">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-wa-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
