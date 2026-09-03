import type { ReactNode } from 'react'

export const inputClass =
  'h-14 w-full rounded-xl border border-brume bg-white px-4 text-base text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100'

export const labelClass = 'text-sm font-medium text-ardoise'

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
    <section className="rounded-card border border-brume bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ardoise">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
