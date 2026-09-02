import { Receipt } from 'lucide-react'
import { useState } from 'react'
import Avatar from './Avatar'
import { totalPaiementsRecus } from '../lib/enfants'
import { formatDateFr, formatMoisAnnee } from '../lib/format'
import { MODE_PAIEMENT_LABELS, STATUT_PAIEMENT_STYLES } from '../lib/paiements'
import { partagerOuTelechargerRecu } from '../lib/receipt'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  formatFCFA,
} from '../lib/tariffs'
import type { Creche } from '../types/creche'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'

export default function PaiementCard({
  paiement,
  enfant,
  creche,
}: {
  paiement: PaiementAvecEnfant
  enfant: EnfantAvecPaiements | undefined
  creche: Creche | null
}) {
  const [generation, setGeneration] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

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

  return (
    <li className="rounded-card border border-brume bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {paiement.enfant && (
            <Avatar prenom={paiement.enfant.prenom} nom={paiement.enfant.nom} />
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-encre">
              {paiement.enfant
                ? `${paiement.enfant.prenom} ${paiement.enfant.nom}`
                : 'Enfant supprimé'}
            </p>
            <p className="text-sm text-ardoise">
              {paiement.type}
              {paiement.mois_concerne ? ` · ${formatMoisAnnee(paiement.mois_concerne)}` : ''}
            </p>
          </div>
        </div>
        <p className="shrink-0 font-display text-base font-semibold tabular-nums text-encre">
          {formatFCFA(paiement.montant)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_PAIEMENT_STYLES[paiement.statut]}`}
          >
            {paiement.statut}
          </span>
          <span className="text-xs text-ardoise">
            {MODE_PAIEMENT_LABELS[paiement.mode_paiement]}
          </span>
        </div>
        <span className="text-xs text-ardoise">{formatDateFr(paiement.date_paiement)}</span>
      </div>

      <p className="mt-2 font-mono text-xs text-ardoise">{paiement.numero_recu}</p>

      {erreur && <p className="mt-2 text-xs text-critique-600">{erreur}</p>}

      <button
        type="button"
        onClick={() => void handleRecu()}
        disabled={generation}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-brume text-sm font-medium text-encre transition active:bg-neutre-50 disabled:opacity-60"
      >
        <Receipt size={18} />
        {generation ? 'Génération…' : 'Reçu'}
      </button>
    </li>
  )
}
