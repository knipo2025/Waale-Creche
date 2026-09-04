import { ArrowLeft, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Banner from '../components/Banner'
import { PleinEcranLoading } from '../components/Loading'
import { useAuth } from '../contexts/AuthContext'
import { deleteEnfant, getEnfant, listEnfants, totalPaiementsRecus } from '../lib/enfants'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  dateFinCalculSolde,
  formatFCFA,
  SERVICE_LABELS,
} from '../lib/tariffs'
import { construireLienRelanceWhatsapp } from '../lib/whatsapp'
import type { Enfant, Statut } from '../types/enfant'

const STATUT_PILL_STYLES: Record<Statut, string> = {
  Inscrit: 'bg-wa-green-50 text-wa-green-700',
  'En attente': 'bg-wa-warning/10 text-wa-warning',
  Sorti: 'bg-wa-line text-wa-muted',
}

function Champ({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-wa-muted">{label}</p>
      <p className="text-base text-wa-ink">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-wa-line bg-wa-surface p-4 shadow-card-soft">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-wa-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function EnfantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile, creche } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const messageSucces = (location.state as { succes?: string } | null)?.succes

  const [enfant, setEnfant] = useState<Enfant | null>(null)
  const [totalRecu, setTotalRecu] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !profile?.creche_id) return
    let isMounted = true
    setLoading(true)

    Promise.all([getEnfant(id), listEnfants(profile.creche_id)])
      .then(([enfantData, enfants]) => {
        if (!isMounted) return
        setEnfant(enfantData)
        const enfantAvecPaiements = enfants.find((e) => e.id === id)
        setTotalRecu(
          enfantAvecPaiements ? totalPaiementsRecus(enfantAvecPaiements.paiements) : 0,
        )
        setError(null)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger l'enfant.",
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, profile?.creche_id])

  if (loading) {
    return <PleinEcranLoading />
  }

  if (error || !enfant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-papier px-6">
        <p className="text-center text-wa-danger">
          {error ?? 'Enfant introuvable.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/enfants')}
          className="h-12 rounded-xl bg-wa-green-600 px-6 font-semibold text-white"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  const ageEnMois = calculerAgeEnMois(enfant.date_naissance)
  const groupe = calculerGroupe(ageEnMois)
  const tarifMensuel = calculerTarifMensuel(
    groupe,
    enfant.service,
    enfant.option_repas,
    enfant.option_garderie,
  )
  const solde = calculerSoldeImpaye(
    enfant.date_inscription,
    tarifMensuel,
    totalRecu,
    dateFinCalculSolde(enfant),
  )

  async function handleSupprimer() {
    if (!enfant) return
    setSuppressionEnCours(true)
    setErreurSuppression(null)
    try {
      await deleteEnfant(enfant.id)
      navigate('/enfants', {
        state: { succes: `${enfant.prenom} ${enfant.nom} a été supprimé(e).` },
      })
    } catch (err) {
      setErreurSuppression(
        err instanceof Error ? err.message : 'Impossible de supprimer cet enfant.',
      )
      setSuppressionEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-papier pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-wa-line bg-wa-surface px-4 py-4">
        <Link
          to="/enfants"
          aria-label="Retour"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-wa-muted transition active:bg-wa-line"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="truncate font-heading text-lg font-bold text-wa-ink">
          {enfant.prenom} {enfant.nom}
        </h1>
        <Link
          to={`/enfants/${enfant.id}/modifier`}
          aria-label="Modifier"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-wa-muted transition active:bg-wa-line"
        >
          <Pencil size={20} />
        </Link>
      </header>

      <main className="flex flex-col gap-4 px-4 py-4">
        {messageSucces && <Banner tone="succes">{messageSucces}</Banner>}

        <section className="rounded-card border border-wa-line bg-wa-surface p-4 shadow-card-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar prenom={enfant.prenom} nom={enfant.nom} />
              <div>
                <p className="text-sm text-wa-muted">{groupe} · {ageEnMois} mois</p>
                <p className="text-sm text-wa-muted">{SERVICE_LABELS[enfant.service]}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_PILL_STYLES[enfant.statut]}`}
                >
                  {enfant.statut}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-wa-muted">Solde impayé</p>
              <p
                className={`font-heading text-xl font-bold tabular-nums ${
                  solde > 0 ? 'text-wa-danger' : 'text-wa-money'
                }`}
              >
                {formatFCFA(solde)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-wa-muted">
            Tarif mensuel : <span className="font-medium text-wa-ink">{formatFCFA(tarifMensuel)}</span>
            {(enfant.option_repas || enfant.option_garderie) && (
              <span>
                {' '}
                ({[
                  enfant.option_repas ? 'repas' : null,
                  enfant.option_garderie ? 'garderie soir' : null,
                ]
                  .filter(Boolean)
                  .join(', ')})
              </span>
            )}
          </p>

          {solde > 0 && (
            <a
              href={construireLienRelanceWhatsapp(
                enfant.parent1_telephone,
                enfant,
                solde,
                creche?.nom ?? null,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white transition active:brightness-95"
            >
              <MessageCircle size={20} />
              Relancer sur WhatsApp
            </a>
          )}
        </section>

        <Section title="Informations">
          <Champ label="Date de naissance" value={enfant.date_naissance} />
          <Champ label="Sexe" value={enfant.sexe === 'M' ? 'Masculin' : 'Féminin'} />
          <Champ label="Date d'inscription" value={enfant.date_inscription} />
          <Champ label="Date de sortie" value={enfant.date_sortie} />
          <Champ label="Allergies" value={enfant.allergies} />
        </Section>

        {(enfant.medecin_nom || enfant.medecin_telephone) && (
          <Section title="Médecin">
            <Champ label="Nom" value={enfant.medecin_nom} />
            <Champ label="Téléphone" value={enfant.medecin_telephone} />
          </Section>
        )}

        <Section title="Parent 1">
          <Champ
            label="Nom"
            value={`${enfant.parent1_prenom} ${enfant.parent1_nom}`}
          />
          <Champ label="Téléphone" value={enfant.parent1_telephone} />
          <Champ label="E-mail" value={enfant.parent1_email} />
          <Champ label="Adresse" value={enfant.parent1_adresse} />
        </Section>

        {(enfant.parent2_nom || enfant.parent2_telephone) && (
          <Section title="Parent 2">
            <Champ
              label="Nom"
              value={[enfant.parent2_prenom, enfant.parent2_nom]
                .filter(Boolean)
                .join(' ')}
            />
            <Champ label="Téléphone" value={enfant.parent2_telephone} />
            <Champ label="E-mail" value={enfant.parent2_email} />
            <Champ label="Adresse" value={enfant.parent2_adresse} />
          </Section>
        )}

        <section className="rounded-card border border-wa-danger/20 bg-wa-danger/10 p-4 shadow-card-soft">
          {confirmerSuppression ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-wa-danger">
                Supprimer définitivement <strong>{enfant.prenom} {enfant.nom}</strong> ?
                Son historique de paiements et de présences sera aussi supprimé.
                Cette action est irréversible.
              </p>
              {erreurSuppression && (
                <p className="text-xs text-wa-danger">{erreurSuppression}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmerSuppression(false)}
                  disabled={suppressionEnCours}
                  className="h-12 flex-1 rounded-xl border border-wa-line bg-wa-surface text-sm font-medium text-wa-ink transition active:bg-wa-line disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void handleSupprimer()}
                  disabled={suppressionEnCours}
                  className="h-12 flex-1 rounded-xl bg-wa-danger text-sm font-semibold text-white transition active:brightness-90 disabled:opacity-60"
                >
                  {suppressionEnCours ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmerSuppression(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-wa-danger text-sm font-semibold text-wa-danger transition active:brightness-95"
            >
              <Trash2 size={18} />
              Supprimer l'enfant
            </button>
          )}
        </section>
      </main>
    </div>
  )
}
