import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Banner from '../components/Banner'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants, totalPaiementsRecus } from '../lib/enfants'
import { moisCourant, todayIso } from '../lib/format'
import { listPaiements } from '../lib/paiements'
import { listPresencesDuJour } from '../lib/presences'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  dateFinCalculSolde,
  formatFCFA,
} from '../lib/tariffs'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'
import type { Presence } from '../types/presence'

export default function DashboardPage() {
  const { profile, creche, profileError } = useAuth()

  const [enfants, setEnfants] = useState<EnfantAvecPaiements[]>([])
  const [paiements, setPaiements] = useState<PaiementAvecEnfant[]>([])
  const [presences, setPresences] = useState<Presence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.creche_id) return
    let isMounted = true
    setLoading(true)

    Promise.all([
      listEnfants(profile.creche_id),
      listPaiements(profile.creche_id),
      listPresencesDuJour(profile.creche_id, todayIso()),
    ])
      .then(([enfantsData, paiementsData, presencesData]) => {
        if (!isMounted) return
        setEnfants(enfantsData)
        setPaiements(paiementsData)
        setPresences(presencesData)
        setError(null)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger le tableau de bord.',
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

  const stats = useMemo(() => {
    const enfantsActifs = enfants.filter((e) => e.statut === 'Inscrit')

    const soldesParEnfant = enfants.map((enfant) => {
      const groupe = calculerGroupe(calculerAgeEnMois(enfant.date_naissance))
      const tarifMensuel = calculerTarifMensuel(
        groupe,
        enfant.service,
        enfant.option_repas,
        enfant.option_garderie,
      )
      const solde = calculerSoldeImpaye(
        enfant.date_inscription,
        tarifMensuel,
        totalPaiementsRecus(enfant.paiements),
        dateFinCalculSolde(enfant),
      )
      return { enfant, tarifMensuel, solde }
    })

    const totalImpayes = soldesParEnfant.reduce(
      (somme, s) => somme + Math.max(s.solde, 0),
      0,
    )

    const chiffreAffairesAttendu = soldesParEnfant
      .filter((s) => s.enfant.statut === 'Inscrit')
      .reduce((somme, s) => somme + s.tarifMensuel, 0)

    const tauxImpayes =
      chiffreAffairesAttendu > 0 ? (totalImpayes / chiffreAffairesAttendu) * 100 : 0

    const moisEnCours = moisCourant()
    const montantEncaisseCeMois = paiements
      .filter((p) => p.statut === 'Reçu' && p.date_paiement.startsWith(moisEnCours))
      .reduce((somme, p) => somme + p.montant, 0)

    const presentsAujourdhui = presences.filter((p) => p.statut === 'Présent').length

    const tauxRemplissage = creche ? (enfantsActifs.length / creche.capacite) * 100 : null

    const alertesImpayesEnfants = creche
      ? soldesParEnfant
          .filter((s) => s.solde > creche.seuil_impaye_enfant)
          .sort((a, b) => b.solde - a.solde)
      : []

    const alerteRemplissage =
      creche && tauxRemplissage !== null && tauxRemplissage < creche.objectif_remplissage

    const alerteImpayesGlobale = creche ? tauxImpayes > creche.seuil_impaye_taux : false

    return {
      enfantsActifsCount: enfantsActifs.length,
      totalImpayes,
      tauxImpayes,
      montantEncaisseCeMois,
      presentsAujourdhui,
      tauxRemplissage,
      alertesImpayesEnfants,
      alerteRemplissage,
      alerteImpayesGlobale,
    }
  }, [enfants, paiements, presences, creche])

  const aucuneAlerte =
    stats.alertesImpayesEnfants.length === 0 &&
    !stats.alerteRemplissage &&
    !stats.alerteImpayesGlobale

  return (
    <AppLayout title="Tableau de bord">
      {(profileError || error) && <Banner tone="critique">{profileError ?? error}</Banner>}

      <div className="mb-1">
        <h2 className="font-heading text-2xl font-bold text-wa-ink">Bonjour 👋</h2>
        {creche?.nom && <p className="text-sm text-wa-muted">{creche.nom}</p>}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-wa-line bg-wa-surface p-5 shadow-card-soft">
            <div className="flex items-center gap-2 text-wa-muted">
              <Building2 size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Taux de remplissage
              </p>
            </div>
            {creche ? (
              <>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-wa-ink">
                  {stats.tauxRemplissage?.toFixed(0)} %
                </p>
                <p className="text-xs text-wa-muted">
                  {stats.enfantsActifsCount} / {creche.capacite} places occupées
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-wa-line">
                  <div
                    className={`h-full rounded-full ${
                      stats.alerteRemplissage ? 'bg-wa-warning' : 'bg-wa-green-600'
                    }`}
                    style={{
                      width: `${Math.min(100, stats.tauxRemplissage ?? 0)}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-wa-muted">
                Capacité non configurée — voir Paramètres.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Users}
              label="Enfants inscrits"
              valeur={String(stats.enfantsActifsCount)}
              tone="sky"
            />
            <StatCard
              icon={CalendarCheck}
              label="Présents du jour"
              valeur={`${stats.presentsAujourdhui} / ${stats.enfantsActifsCount}`}
              tone="green"
            />
            <StatCard
              icon={Wallet}
              label="Encaissé ce mois"
              valeur={formatFCFA(stats.montantEncaisseCeMois)}
              tone="money"
            />
            <StatCard
              icon={CircleDollarSign}
              label="Total impayés"
              valeur={formatFCFA(stats.totalImpayes)}
              tone="coral"
            />
          </div>

          <section className="rounded-card border border-wa-line bg-wa-surface p-5 shadow-card-soft">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-wa-muted">
              Alertes
            </h2>

            {aucuneAlerte ? (
              <div className="flex items-center gap-2 text-wa-green-700">
                <CheckCircle2 size={18} />
                <p className="text-sm">Aucune alerte — tout va bien.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.alerteRemplissage && creche && (
                  <div className="flex items-start gap-2 rounded-xl bg-attention-50 p-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-wa-warning" />
                    <p className="text-sm text-wa-warning">
                      Taux de remplissage ({stats.tauxRemplissage?.toFixed(0)} %) sous
                      l'objectif de {creche.objectif_remplissage} %.
                    </p>
                  </div>
                )}

                {stats.alerteImpayesGlobale && creche && (
                  <div className="flex items-start gap-2 rounded-xl bg-attention-50 p-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-wa-warning" />
                    <p className="text-sm text-wa-warning">
                      Impayés à {stats.tauxImpayes.toFixed(0)} % du chiffre d'affaires
                      mensuel attendu (seuil : {creche.seuil_impaye_taux} %).
                    </p>
                  </div>
                )}

                {stats.alertesImpayesEnfants.map(({ enfant, solde }) => (
                  <Link
                    key={enfant.id}
                    to={`/enfants/${enfant.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-critique-50 p-3 transition active:brightness-95"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-wa-danger" />
                      <p className="truncate text-sm font-semibold text-wa-danger">
                        {enfant.prenom} {enfant.nom}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-wa-danger">
                        {formatFCFA(solde)}
                      </span>
                      <ChevronRight size={18} className="text-wa-danger" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  )
}
