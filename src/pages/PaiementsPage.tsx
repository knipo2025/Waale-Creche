import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import EnfantCard from '../components/EnfantCard'
import PaiementCard from '../components/PaiementCard'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants } from '../lib/enfants'
import { listPaiements } from '../lib/paiements'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'

type Onglet = 'historique' | 'soldes'

export default function PaiementsPage() {
  const { profile, creche } = useAuth()
  const location = useLocation()
  const recuGenere = (location.state as { recuGenere?: string } | null)?.recuGenere

  const [onglet, setOnglet] = useState<Onglet>('historique')
  const [paiements, setPaiements] = useState<PaiementAvecEnfant[]>([])
  const [enfants, setEnfants] = useState<EnfantAvecPaiements[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.creche_id) return
    let isMounted = true
    setLoading(true)

    Promise.all([listPaiements(profile.creche_id), listEnfants(profile.creche_id)])
      .then(([paiementsData, enfantsData]) => {
        if (!isMounted) return
        setPaiements(paiementsData)
        setEnfants(enfantsData)
        setError(null)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les paiements.',
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

  return (
    <AppLayout title="Paiements">
      {recuGenere && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Paiement enregistré — reçu <span className="font-semibold">{recuGenere}</span>
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setOnglet('historique')}
          className={`h-11 rounded-lg text-sm font-medium transition ${
            onglet === 'historique'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Historique
        </button>
        <button
          type="button"
          onClick={() => setOnglet('soldes')}
          className={`h-11 rounded-lg text-sm font-medium transition ${
            onglet === 'soldes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Soldes par enfant
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center text-slate-500">Chargement…</p>
      ) : onglet === 'historique' ? (
        paiements.length === 0 ? (
          <p className="text-center text-slate-500">Aucun paiement enregistré.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {paiements.map((paiement) => (
              <PaiementCard
                key={paiement.id}
                paiement={paiement}
                enfant={enfants.find((e) => e.id === paiement.enfant_id)}
                creche={creche}
              />
            ))}
          </ul>
        )
      ) : enfants.length === 0 ? (
        <p className="text-center text-slate-500">Aucun enfant enregistré.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {enfants.map((enfant) => (
            <li key={enfant.id}>
              <EnfantCard enfant={enfant} />
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/paiements/nouveau"
        aria-label="Enregistrer un paiement"
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition active:bg-emerald-700"
      >
        <Plus size={28} />
      </Link>
    </AppLayout>
  )
}
