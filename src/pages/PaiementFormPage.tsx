import { ArrowLeft, Users } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import { Champ, inputClass } from '../components/FormField'
import { PleinEcranLoading } from '../components/Loading'
import { useAuth } from '../contexts/AuthContext'
import { listEnfants } from '../lib/enfants'
import { moisCourant, todayIso } from '../lib/format'
import {
  createPaiement,
  getPaiement,
  MODE_PAIEMENT_LABELS,
  TYPES_PAIEMENT,
  updatePaiement,
} from '../lib/paiements'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerTarifMensuel,
  FRAIS_INSCRIPTION,
  formatFCFA,
} from '../lib/tariffs'
import type { EnfantAvecPaiements, StatutPaiement } from '../types/enfant'
import type { ModePaiement, PaiementFormValues, TypePaiement } from '../types/paiement'

function tarifSuggere(
  enfant: EnfantAvecPaiements | undefined,
  type: TypePaiement,
): number | null {
  if (!enfant) return null
  if (type === 'Inscription') return FRAIS_INSCRIPTION
  if (type === 'Mensualité') {
    const groupe = calculerGroupe(calculerAgeEnMois(enfant.date_naissance))
    return calculerTarifMensuel(
      groupe,
      enfant.service,
      enfant.option_repas,
      enfant.option_garderie,
    )
  }
  return null
}

export default function PaiementFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdition = Boolean(id)
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [enfants, setEnfants] = useState<EnfantAvecPaiements[]>([])
  const [loadingEnfants, setLoadingEnfants] = useState(true)
  const [loadingPaiement, setLoadingPaiement] = useState(isEdition)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [enfantId, setEnfantId] = useState('')
  const [type, setType] = useState<TypePaiement>('Mensualité')
  const [moisConcerne, setMoisConcerne] = useState(moisCourant())
  const [montant, setMontant] = useState('')
  const [montantModifie, setMontantModifie] = useState(false)
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes')
  const [statut, setStatut] = useState<StatutPaiement>('Reçu')
  const [datePaiement, setDatePaiement] = useState(todayIso())

  useEffect(() => {
    if (!profile?.creche_id) return
    let isMounted = true
    listEnfants(profile.creche_id)
      .then((data) => {
        if (!isMounted) return
        setEnfants(data)
        if (!isEdition && data.length > 0) {
          setEnfantId(data[0].id)
          const s = tarifSuggere(data[0], 'Mensualité')
          if (s !== null) setMontant(String(s))
        }
        setError(null)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Impossible de charger les enfants.',
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoadingEnfants(false)
      })
    return () => {
      isMounted = false
    }
  }, [profile?.creche_id, isEdition])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    getPaiement(id)
      .then((paiement) => {
        if (!isMounted) return
        setEnfantId(paiement.enfant_id)
        setType(paiement.type)
        setMoisConcerne(paiement.mois_concerne ?? moisCourant())
        setMontant(String(paiement.montant))
        setMontantModifie(true)
        setModePaiement(paiement.mode_paiement)
        setStatut(paiement.statut)
        setDatePaiement(paiement.date_paiement)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Impossible de charger le paiement.',
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPaiement(false)
      })
    return () => {
      isMounted = false
    }
  }, [id])

  const enfantSelectionne = enfants.find((e) => e.id === enfantId)
  const suggestion = tarifSuggere(enfantSelectionne, type)

  function handleEnfantChange(id: string) {
    setEnfantId(id)
    if (!montantModifie) {
      const s = tarifSuggere(
        enfants.find((e) => e.id === id),
        type,
      )
      if (s !== null) setMontant(String(s))
    }
  }

  function handleTypeChange(nouveauType: TypePaiement) {
    setType(nouveauType)
    if (!montantModifie) {
      const s = tarifSuggere(enfantSelectionne, nouveauType)
      setMontant(s !== null ? String(s) : '')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile?.creche_id || !enfantId) return

    const montantNombre = Number(montant)
    if (!Number.isFinite(montantNombre) || montantNombre <= 0) {
      setError('Le montant doit être un nombre positif.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload: PaiementFormValues = {
      enfant_id: enfantId,
      type,
      mois_concerne: type === 'Mensualité' ? moisConcerne : null,
      montant: Math.round(montantNombre),
      mode_paiement: modePaiement,
      statut,
      date_paiement: datePaiement,
    }

    try {
      if (isEdition && id) {
        await updatePaiement(id, payload)
        navigate('/paiements', { state: { succes: 'Paiement modifié avec succès.' } })
      } else {
        const paiement = await createPaiement(payload, profile.creche_id)
        navigate('/paiements', { state: { recuGenere: paiement.numero_recu } })
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer le paiement.",
      )
      setSubmitting(false)
    }
  }

  if (loadingEnfants || loadingPaiement) {
    return <PleinEcranLoading />
  }

  return (
    <div className="min-h-screen bg-papier pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-brume bg-white px-4 py-4">
        <Link
          to="/paiements"
          aria-label="Retour"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-ardoise transition active:bg-neutre-50"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg font-bold text-encre">
          {isEdition ? 'Modifier le paiement' : 'Nouveau paiement'}
        </h1>
      </header>

      {enfants.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            icon={Users}
            titre="Aucun enfant enregistré"
            description="Ajoutez un enfant avant d'enregistrer un paiement."
            action={
              <Link
                to="/enfants/nouveau"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-pin-600 px-5 text-sm font-semibold text-white transition active:bg-pin-700"
              >
                Ajouter un enfant
              </Link>
            }
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
          {error && <Banner tone="critique">{error}</Banner>}

          <Champ label="Enfant">
            <select
              required
              className={inputClass}
              value={enfantId}
              onChange={(e) => handleEnfantChange(e.target.value)}
            >
              {enfants.map((enfant) => (
                <option key={enfant.id} value={enfant.id}>
                  {enfant.prenom} {enfant.nom}
                </option>
              ))}
            </select>
          </Champ>

          <Champ label="Type de paiement">
            <select
              className={inputClass}
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as TypePaiement)}
            >
              {TYPES_PAIEMENT.map((valeur) => (
                <option key={valeur} value={valeur}>
                  {valeur}
                </option>
              ))}
            </select>
          </Champ>

          {type === 'Mensualité' && (
            <Champ label="Mois concerné">
              <input
                required
                type="month"
                className={inputClass}
                value={moisConcerne}
                onChange={(e) => setMoisConcerne(e.target.value)}
              />
            </Champ>
          )}

          <Champ label="Montant (FCFA)">
            <input
              required
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={montant}
              onChange={(e) => {
                setMontant(e.target.value)
                setMontantModifie(true)
              }}
            />
            {suggestion !== null && (
              <span className="text-xs text-ardoise">
                Suggestion : {formatFCFA(suggestion)}
              </span>
            )}
          </Champ>

          <Champ label="Mode de paiement">
            <select
              className={inputClass}
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
            >
              {Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Champ>

          <Champ label="Statut">
            <select
              className={inputClass}
              value={statut}
              onChange={(e) => setStatut(e.target.value as StatutPaiement)}
            >
              <option value="Reçu">Reçu</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
          </Champ>

          <Champ label="Date du paiement">
            <input
              required
              type="date"
              max={todayIso()}
              className={inputClass}
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
            />
          </Champ>

          <button
            type="submit"
            disabled={submitting}
            className="h-14 rounded-xl bg-pin-600 text-lg font-semibold text-white transition active:bg-pin-700 disabled:opacity-60"
          >
            {submitting
              ? 'Enregistrement…'
              : isEdition
                ? 'Enregistrer les modifications'
                : 'Enregistrer le paiement'}
          </button>
        </form>
      )}
    </div>
  )
}
