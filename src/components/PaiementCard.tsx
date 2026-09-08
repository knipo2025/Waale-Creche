import { Pencil, Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { totalPaiementsRecus } from '../lib/enfants'
import { formatDateFr, formatMoisAnnee } from '../lib/format'
import { deletePaiement, MODE_PAIEMENT_LABELS, STATUT_PAIEMENT_STYLES } from '../lib/paiements'
import { partagerOuTelechargerRecu } from '../lib/receipt'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  dateFinCalculSolde,
  formatFCFA,
} from '../lib/tariffs'
import type { Creche } from '../types/creche'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'

export default function PaiementCard({
  paiement,
  enfant,
  creche,
  onSupprime,
}: {
  paiement: PaiementAvecEnfant
  enfant: EnfantAvecPaiements | undefined
  creche: Creche | null
  onSupprime: (id: string) => void
}) {
  const [generation, setGeneration] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  async function handleRecu() {
    if (!enfant) {
      setErreur('Fiche enfant introuvable pour ce paiement.')
      return
    }
    setGeneration(true)
    setErreur(null)
    try {
      const ageEnMois = calculerAgeEnMois(enfant.date_naissance)
      const groupe = calculerGroupe(ageEnMois)
      const tarifMensuel = calculerTarifMensuel(
        groupe,
        enfant.service,
        enfant.option_repas,
        enfant.option_garderie,
      )
      const soldeRestant = calculerSoldeImpaye(
        enfant.date_inscription,
        tarifMensuel,
        totalPaiementsRecus(enfant.paiements),
        dateFinCalculSolde(enfant),
      )
      await partagerOuTelechargerRecu(paiement, enfant, creche, soldeRestant)
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible de générer le reçu.',
      )
    } finally {
      setGeneration(false)
    }
  }

  async function handleSupprimer() {
    setSuppressionEnCours(true)
    setErreur(null)
    try {
      await deletePaiement(paiement.id)
      onSupprime(paiement.id)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Impossible de supprimer.')
      setSuppressionEnCours(false)
    }
  }

  return (
    <li className="rounded-row border border-line bg-surface p-4 shadow-card-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {paiement.enfant && (
            <Avatar prenom={paiement.enfant.prenom} nom={paiement.enfant.nom} />
          )}
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-ink">
              {paiement.enfant
                ? `${paiement.enfant.prenom} ${paiement.enfant.nom}`
                : 'Enfant supprimé'}
            </p>
            <p className="text-sm text-muted">
              {paiement.type}
              {paiement.mois_concerne ? ` · ${formatMoisAnnee(paiement.mois_concerne)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-heading text-base font-bold tabular-nums text-ok">
            {formatFCFA(paiement.montant)}
          </p>
          <div className="flex items-center gap-1">
            <Link
              to={`/paiements/${paiement.id}/modifier`}
              aria-label="Modifier le paiement"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
            >
              <Pencil size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmerSuppression(true)}
              aria-label="Supprimer le paiement"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_PAIEMENT_STYLES[paiement.statut]}`}
          >
            {paiement.statut}
          </span>
          <span className="text-xs text-muted">
            {MODE_PAIEMENT_LABELS[paiement.mode_paiement]}
          </span>
        </div>
        <span className="text-xs text-muted">{formatDateFr(paiement.date_paiement)}</span>
      </div>

      <p className="mt-2 font-mono text-xs text-muted">{paiement.numero_recu}</p>

      {erreur && <p className="mt-2 text-xs text-bad">{erreur}</p>}

      {confirmerSuppression ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-bad-bg p-3">
          <p className="text-xs text-bad">
            Supprimer définitivement ce paiement ? Cette action est irréversible.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmerSuppression(false)}
              disabled={suppressionEnCours}
              className="h-10 flex-1 rounded-lg border border-line bg-surface text-xs font-semibold text-ink transition active:bg-cream disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleSupprimer()}
              disabled={suppressionEnCours}
              className="h-10 flex-1 rounded-lg bg-bad text-xs font-semibold text-white transition active:brightness-90 disabled:opacity-60"
            >
              {suppressionEnCours ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void handleRecu()}
          disabled={generation}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink transition active:bg-cream disabled:opacity-60"
        >
          <Receipt size={18} />
          {generation ? 'Génération…' : 'Reçu'}
        </button>
      )}
    </li>
  )
}
