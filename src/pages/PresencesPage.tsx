import { CalendarOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/AppLayout'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import PresenceRow, { type PointageJour } from '../components/PresenceRow'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants } from '../lib/enfants'
import { todayIso } from '../lib/format'
import {
  deletePresence,
  heureActuelle,
  listPresencesDuJour,
  upsertPresence,
} from '../lib/presences'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { Presence, PresenceFormValues, StatutPresence } from '../types/presence'

export default function PresencesPage() {
  const { profile } = useAuth()

  // Recalculé (pas figé au chargement du bundle) et re-vérifié périodiquement :
  // sur une tablette laissée ouverte toute la journée, sans ça les pointages
  // passés minuit s'enregistreraient silencieusement sur la veille.
  const [dateDuJour, setDateDuJour] = useState(todayIso())

  useEffect(() => {
    const intervalle = setInterval(() => {
      const aujourdhui = todayIso()
      setDateDuJour((precedent) => (precedent === aujourdhui ? precedent : aujourdhui))
    }, 60_000)
    return () => clearInterval(intervalle)
  }, [])

  const [enfants, setEnfants] = useState<EnfantAvecPaiements[]>([])
  const [presences, setPresences] = useState<Record<string, Presence>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [rowErrors, setRowErrors] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.creche_id) return
    let isMounted = true
    setLoading(true)

    Promise.all([
      listEnfants(profile.creche_id),
      listPresencesDuJour(profile.creche_id, dateDuJour),
    ])
      .then(([enfantsData, presencesData]) => {
        if (!isMounted) return
        setEnfants(enfantsData)
        setPresences(
          Object.fromEntries(presencesData.map((p) => [p.enfant_id, p])),
        )
        setError(null)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les présences.',
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [profile?.creche_id, dateDuJour])

  const enfantsActifs = useMemo(
    () => enfants.filter((e) => e.statut === 'Inscrit'),
    [enfants],
  )

  async function enregistrer(enfantId: string, partiel: Partial<PresenceFormValues>) {
    if (!profile?.creche_id) return
    const existant = presences[enfantId]
    const dateActuelle = todayIso()

    const valeurs: PresenceFormValues = {
      enfant_id: enfantId,
      date: dateActuelle,
      statut: existant?.statut ?? 'Présent',
      heure_arrivee: existant?.heure_arrivee ?? null,
      heure_depart: existant?.heure_depart ?? null,
      repas: existant?.repas ?? false,
      ...partiel,
    }

    setSavingIds((precedent) => new Set(precedent).add(enfantId))
    setRowErrors((precedent) => ({ ...precedent, [enfantId]: null }))
    if (dateActuelle !== dateDuJour) setDateDuJour(dateActuelle)

    try {
      const resultat = await upsertPresence(valeurs, profile.creche_id)
      setPresences((precedent) => ({ ...precedent, [enfantId]: resultat }))
    } catch (err) {
      setRowErrors((precedent) => ({
        ...precedent,
        [enfantId]: err instanceof Error ? err.message : 'Impossible d\'enregistrer.',
      }))
    } finally {
      setSavingIds((precedent) => {
        const suivant = new Set(precedent)
        suivant.delete(enfantId)
        return suivant
      })
    }
  }

  function handleChangeStatut(enfantId: string, statut: StatutPresence) {
    const existant = presences[enfantId]
    const heureArrivee =
      statut === 'Présent' ? (existant?.heure_arrivee ?? heureActuelle()) : (existant?.heure_arrivee ?? null)
    void enregistrer(enfantId, { statut, heure_arrivee: heureArrivee })
  }

  function handleChangeHeure(
    enfantId: string,
    champ: 'heure_arrivee' | 'heure_depart',
    valeur: string,
  ) {
    void enregistrer(enfantId, { [champ]: valeur || null })
  }

  function handleChangeRepas(enfantId: string, repas: boolean) {
    void enregistrer(enfantId, { repas })
  }

  async function handleAnnuler(enfantId: string) {
    const existant = presences[enfantId]
    if (!existant) return
    setSavingIds((precedent) => new Set(precedent).add(enfantId))
    setRowErrors((precedent) => ({ ...precedent, [enfantId]: null }))
    try {
      await deletePresence(existant.id)
      setPresences((precedent) => {
        const suivant = { ...precedent }
        delete suivant[enfantId]
        return suivant
      })
    } catch (err) {
      setRowErrors((precedent) => ({
        ...precedent,
        [enfantId]: err instanceof Error ? err.message : "Impossible d'annuler.",
      }))
    } finally {
      setSavingIds((precedent) => {
        const suivant = new Set(precedent)
        suivant.delete(enfantId)
        return suivant
      })
    }
  }

  const valeursPresences = Object.values(presences)
  const compteurs = {
    presents: valeursPresences.filter((p) => p.statut === 'Présent').length,
    absents: valeursPresences.filter((p) => p.statut === 'Absent').length,
    malades: valeursPresences.filter((p) => p.statut === 'Malade').length,
    repasServis: valeursPresences.filter((p) => p.statut === 'Présent' && p.repas).length,
  }

  return (
    <AppLayout title="Présences">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Présents', valeur: compteurs.presents, couleur: 'text-ok' },
            { label: 'Absents', valeur: compteurs.absents, couleur: 'text-bad' },
            { label: 'Malades', valeur: compteurs.malades, couleur: 'text-warn' },
            { label: 'Repas', valeur: compteurs.repasServis, couleur: 'text-amber' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-card border border-line bg-surface px-2 py-3 text-center shadow-card-soft"
            >
              <p className={`font-heading text-xl font-bold tabular-nums ${stat.couleur}`}>{stat.valeur}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {error && <Banner tone="critique">{error}</Banner>}

        {loading ? (
          <Loading />
        ) : enfantsActifs.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            titre="Aucun enfant inscrit"
            description="Le pointage du jour apparaîtra ici dès qu'un enfant sera inscrit."
          />
        ) : (
          <ul className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {enfantsActifs.map((enfant) => {
              const presence = presences[enfant.id]
              const pointage: PointageJour = {
                statut: presence?.statut ?? null,
                heure_arrivee: presence?.heure_arrivee ?? null,
                heure_depart: presence?.heure_depart ?? null,
                repas: presence?.repas ?? false,
              }
              return (
                <PresenceRow
                  key={enfant.id}
                  enfant={enfant}
                  pointage={pointage}
                  saving={savingIds.has(enfant.id)}
                  error={rowErrors[enfant.id] ?? null}
                  onChangeStatut={(statut) => handleChangeStatut(enfant.id, statut)}
                  onChangeHeure={(champ, valeur) =>
                    handleChangeHeure(enfant.id, champ, valeur)
                  }
                  onChangeRepas={(repas) => handleChangeRepas(enfant.id, repas)}
                  onAnnuler={() => void handleAnnuler(enfant.id)}
                />
              )
            })}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
