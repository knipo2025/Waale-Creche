import { Loader2 } from 'lucide-react'

export default function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-wa-muted">
      <Loader2 size={28} className="motion-safe:animate-spin text-wa-green-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function PleinEcranLoading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-papier text-wa-muted">
      <Loader2 size={28} className="motion-safe:animate-spin text-wa-green-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
