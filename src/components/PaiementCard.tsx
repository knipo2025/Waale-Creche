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
    <li className="rounded-card border border-wa-line bg-wa-surface p-4 shadow-card-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {paiement.enfant && (
            <Avatar prenom={paiement.enfant.prenom} nom={paiement.enfant.nom} />
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-wa-ink">
              {paiement.enfant
                ? `${paiement.enfant.prenom} ${paiement.enfant.nom}`
                : 'Enfant supprimé'}
            </p>
            <p className="text-sm text-wa-muted">
              {paiement.type}
              {paiement.mois_concerne ? ` · ${formatMoisAnnee(paiement.mois_concerne)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-display text-base font-semibold tabular-nums text-wa-money">
            {formatFCFA(paiement.montant)}
          </p>
          <div className="flex items-center gap-1">
            <Link
              to={`/paiements/${paiement.id}/modifier`}
              aria-label="Modifier le paiement"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-wa-muted transition active:bg-wa-line"
            >
              <Pencil size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmerSuppression(true)}
              aria-label="Supprimer le paiement"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-wa-muted transition active:bg-wa-line"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_PAIEMENT_STYLES[paiement.statut]}`}
          >
            {paiement.statut}
          </span>
          <span className="text-xs text-wa-muted">
            {MODE_PAIEMENT_LABELS[paiement.mode_paiement]}
          </span>
        </div>
        <span className="text-xs text-wa-muted">{formatDateFr(paiement.date_paiement)}</span>
      </div>

      <p className="mt-2 font-mono text-xs text-wa-muted">{paiement.numero_recu}</p>

      {erreur && <p className="mt-2 text-xs text-wa-danger">{erreur}</p>}

      {confirmerSuppression ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-wa-danger/10 p-3">
          <p className="text-xs text-wa-danger">
            Supprimer définitivement ce paiement ? Cette action est irréversible.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmerSuppression(false)}
              disabled={suppressionEnCours}
              className="h-10 flex-1 rounded-lg border border-wa-line bg-wa-surface text-xs font-medium text-wa-ink transition active:bg-wa-line disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleSupprimer()}
              disabled={suppressionEnCours}
              className="h-10 flex-1 rounded-lg bg-wa-danger text-xs font-semibold text-white transition active:brightness-90 disabled:opacity-60"
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
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-wa-line text-sm font-medium text-wa-ink transition active:bg-wa-line disabled:opacity-60"
        >
          <Receipt size={18} />
          {generation ? 'Génération…' : 'Reçu'}
        </button>
      )}
    </li>
  )
}
