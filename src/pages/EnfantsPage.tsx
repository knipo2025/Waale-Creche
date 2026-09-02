import { Baby, Plus, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import EnfantCard from '../components/EnfantCard'
import Loading from '../components/Loading'
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
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ardoise"
          />
          <input
            type="search"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un enfant…"
            className="h-14 w-full rounded-xl border border-brume bg-white pl-11 pr-4 text-base text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100"
          />
        </div>

        {error && <Banner tone="critique">{error}</Banner>}

        {loading ? (
          <Loading />
        ) : enfantsFiltres.length === 0 ? (
          recherche ? (
            <EmptyState
              icon={SearchX}
              titre="Aucun résultat"
              description="Aucun enfant ne correspond à votre recherche."
            />
          ) : (
            <EmptyState
              icon={Baby}
              titre="Aucun enfant"
              description="Ajoutez la fiche d'un enfant pour la voir apparaître ici."
              action={
                <Link
                  to="/enfants/nouveau"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-pin-600 px-5 text-sm font-semibold text-white transition active:bg-pin-700"
                >
                  Ajouter le premier
                </Link>
              }
            />
          )
        ) : (
          <ul className="flex flex-col gap-3">
            {enfantsFiltres.map((enfant) => (
              <li key={enfant.id}>
                <EnfantCard enfant={enfant} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/enfants/nouveau"
        aria-label="Ajouter un enfant"
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-pin-600 text-white shadow-lg transition active:bg-pin-700"
      >
        <Plus size={28} />
      </Link>
    </AppLayout>
  )
}
