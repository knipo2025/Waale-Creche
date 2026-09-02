import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import EnfantCard from '../components/EnfantCard'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants } from '../lib/enfants'
import type { EnfantAvecPaiements } from '../types/enfant'

function normaliser(texte: string): string {
  return Array.from(texte.normalize('NFD'))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0
      return code < 0x0300 || code > 0x036f
    })
    .join('')
    .toLowerCase()
}

export default function EnfantsPage() {
  const { profile } = useAuth()
  const [enfants, setEnfants] = useState<EnfantAvecPaiements[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    if (!profile?.creche_id) return

    let isMounted = true
    setLoading(true)
    listEnfants(profile.creche_id)
      .then((data) => {
        if (isMounted) {
          setEnfants(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les enfants.',
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [profile?.creche_id])

  const enfantsFiltres = useMemo(() => {
    const q = normaliser(recherche.trim())
    if (!q) return enfants
    return enfants.filter((enfant) =>
      normaliser(`${enfant.prenom} ${enfant.nom}`).includes(q),
    )
  }, [enfants, recherche])

  return (
    <AppLayout title="Enfants">
      <div className="relative mb-4">
        <Search
          size={20}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un enfant…"
          className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center text-slate-500">Chargement…</p>
      ) : enfantsFiltres.length === 0 ? (
        <p className="text-center text-slate-500">
          {recherche
            ? 'Aucun enfant ne correspond à votre recherche.'
            : 'Aucun enfant enregistré pour le moment.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {enfantsFiltres.map((enfant) => (
            <li key={enfant.id}>
              <EnfantCard enfant={enfant} />
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/enfants/nouveau"
        aria-label="Ajouter un enfant"
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition active:bg-emerald-700"
      >
        <Plus size={28} />
      </Link>
    </AppLayout>
  )
}
