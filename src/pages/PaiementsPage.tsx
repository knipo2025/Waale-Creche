import { Plus, Receipt, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import EnfantCard from '../components/EnfantCard'
import EnfantsTable from '../components/EnfantsTable'
import Loading from '../components/Loading'
import PaiementCard from '../components/PaiementCard'
import PaiementsTable from '../components/PaiementsTable'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants } from '../lib/enfants'
import { listPaiements } from '../lib/paiements'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'

type Onglet = 'historique' | 'soldes'

export default function PaiementsPage() {
  const { profile, creche } = useAuth()
  const location = useLocation()
  const etatNavigation = location.state as { recuGenere?: string; succes?: string } | null
  const recuGenere = etatNavigation?.recuGenere
  const messageSucces = etatNavigation?.succes

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
      <div className="flex flex-col gap-4">
        {recuGenere && (
          <Banner tone="succes">
            Paiement enregistré — reçu <span className="font-semibold">{recuGenere}</span>
          </Banner>
        )}
        {messageSucces && <Banner tone="succes">{messageSucces}</Banner>}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-line p-1 md:w-80">
          <button
            type="button"
            onClick={() => setOnglet('historique')}
            className={`h-11 rounded-lg text-sm font-semibold transition ${
              onglet === 'historique'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-muted'
            }`}
          >
            Historique
          </button>
          <button
            type="button"
            onClick={() => setOnglet('soldes')}
            className={`h-11 rounded-lg text-sm font-semibold transition ${
              onglet === 'soldes' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
            }`}
          >
            Soldes par enfant
          </button>
        </div>

        {error && <Banner tone="critique">{error}</Banner>}

        {loading ? (
          <Loading />
        ) : onglet === 'historique' ? (
          paiements.length === 0 ? (
            <EmptyState
              icon={Receipt}
              titre="Aucun paiement"
              description="Enregistrez un encaissement pour le voir apparaître ici."
              action={
                <Link
                  to="/paiements/nouveau"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-terra px-5 text-sm font-semibold text-white transition active:brightness-90"
                >
                  Enregistrer un paiement
                </Link>
              }
            />
          ) : (
            <>
              <ul className="flex flex-col gap-3 md:hidden">
                {paiements.map((paiement) => (
                  <PaiementCard
                    key={paiement.id}
                    paiement={paiement}
                    enfant={enfants.find((e) => e.id === paiement.enfant_id)}
                    creche={creche}
                    onSupprime={(id) =>
                      setPaiements((precedent) => precedent.filter((p) => p.id !== id))
                    }
                  />
                ))}
              </ul>
              <PaiementsTable
                paiements={paiements}
                enfants={enfants}
                creche={creche}
                onSupprime={(id) =>
                  setPaiements((precedent) => precedent.filter((p) => p.id !== id))
                }
              />
            </>
          )
        ) : enfants.length === 0 ? (
          <EmptyState icon={Users} titre="Aucun enfant" description="Aucun enfant enregistré pour le moment." />
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:hidden">
              {enfants.map((enfant) => (
                <li key={enfant.id}>
                  <EnfantCard enfant={enfant} />
                </li>
              ))}
            </ul>
            <EnfantsTable enfants={enfants} />
          </>
        )}
      </div>

      <Link
        to="/paiements/nouveau"
        aria-label="Enregistrer un paiement"
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-terra text-white shadow-lg transition active:brightness-90 md:bottom-8 md:right-8"
      >
        <Plus size={28} />
      </Link>
    </AppLayout>
  )
}
