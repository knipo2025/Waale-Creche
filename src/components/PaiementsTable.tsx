import { ArrowUpDown, Pencil, Receipt, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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

type Colonne = 'enfant' | 'montant' | 'date'
type Tri = { colonne: Colonne; sens: 'asc' | 'desc' }

function LigneAction({
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
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  async function handleRecu() {
    if (!enfant) return
    setGeneration(true)
    try {
      const groupe = calculerGroupe(calculerAgeEnMois(enfant.date_naissance))
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
    } finally {
      setGeneration(false)
    }
  }

  async function handleSupprimer() {
    setSuppressionEnCours(true)
    try {
      await deletePaiement(paiement.id)
      onSupprime(paiement.id)
    } finally {
      setSuppressionEnCours(false)
      setConfirmerSuppression(false)
    }
  }

  if (confirmerSuppression) {
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmerSuppression(false)}
          disabled={suppressionEnCours}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition active:bg-cream"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => void handleSupprimer()}
          disabled={suppressionEnCours}
          className="rounded-lg bg-bad px-2 py-1 text-xs font-semibold text-white transition active:brightness-90"
        >
          {suppressionEnCours ? '…' : 'Confirmer'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => void handleRecu()}
        disabled={generation}
        aria-label="Reçu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
      >
        <Receipt size={15} />
      </button>
      <Link
        to={`/paiements/${paiement.id}/modifier`}
        aria-label="Modifier"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmerSuppression(true)}
        aria-label="Supprimer"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

/** Historique des paiements en vue ordinateur (≥768px) — vue mobile en carte séparée. */
export default function PaiementsTable({
  paiements,
  enfants,
  creche,
  onSupprime,
}: {
  paiements: PaiementAvecEnfant[]
  enfants: EnfantAvecPaiements[]
  creche: Creche | null
  onSupprime: (id: string) => void
}) {
  const [tri, setTri] = useState<Tri>({ colonne: 'date', sens: 'desc' })

  const tries = useMemo(() => {
    const copie = [...paiements]
    copie.sort((a, b) => {
      let comparaison = 0
      if (tri.colonne === 'enfant') {
        comparaison = (a.enfant ? `${a.enfant.prenom} ${a.enfant.nom}` : '').localeCompare(
          b.enfant ? `${b.enfant.prenom} ${b.enfant.nom}` : '',
        )
      } else if (tri.colonne === 'montant') {
        comparaison = a.montant - b.montant
      } else {
        comparaison = a.date_paiement.localeCompare(b.date_paiement)
      }
      return tri.sens === 'asc' ? comparaison : -comparaison
    })
    return copie
  }, [paiements, tri])

  function trierPar(colonne: Colonne) {
    setTri((precedent) =>
      precedent.colonne === colonne
        ? { colonne, sens: precedent.sens === 'asc' ? 'desc' : 'asc' }
        : { colonne, sens: 'asc' },
    )
  }

  function EnTeteColonne({
    colonne,
    label,
    alignDroite = false,
  }: {
    colonne: Colonne
    label: string
    alignDroite?: boolean
  }) {
    return (
      <th
        className={`label-caps px-4 py-3 text-xs font-bold uppercase text-muted ${alignDroite ? 'text-right' : 'text-left'}`}
      >
        <button
          type="button"
          onClick={() => trierPar(colonne)}
          className={`inline-flex items-center gap-1 transition hover:text-ink ${alignDroite ? 'flex-row-reverse' : ''}`}
        >
          {label}
          <ArrowUpDown size={12} className={tri.colonne === colonne ? 'text-pin' : 'text-muted'} />
        </button>
      </th>
    )
  }

  return (
    <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-card-soft md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <EnTeteColonne colonne="enfant" label="Enfant" />
            <th className="label-caps px-4 py-3 text-left text-xs font-bold uppercase text-muted">Type</th>
            <EnTeteColonne colonne="montant" label="Montant" alignDroite />
            <th className="label-caps px-4 py-3 text-left text-xs font-bold uppercase text-muted">Statut</th>
            <th className="label-caps px-4 py-3 text-left text-xs font-bold uppercase text-muted">Mode</th>
            <EnTeteColonne colonne="date" label="Date" />
            <th className="w-32" />
          </tr>
        </thead>
        <tbody>
          {tries.map((paiement) => (
            <tr key={paiement.id} className="border-b border-line last:border-0 transition hover:bg-cream">
              <td className="px-4 py-3">
                {paiement.enfant ? (
                  <div className="flex items-center gap-3">
                    <Avatar prenom={paiement.enfant.prenom} nom={paiement.enfant.nom} />
                    <span className="font-heading font-semibold text-ink">
                      {paiement.enfant.prenom} {paiement.enfant.nom}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted">Enfant supprimé</span>
                )}
              </td>
              <td className="px-4 py-3 text-ink">
                {paiement.type}
                {paiement.mois_concerne ? ` · ${formatMoisAnnee(paiement.mois_concerne)}` : ''}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums text-ok">
                {formatFCFA(paiement.montant)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_PAIEMENT_STYLES[paiement.statut]}`}
                >
                  {paiement.statut}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">{MODE_PAIEMENT_LABELS[paiement.mode_paiement]}</td>
              <td className="px-4 py-3 text-muted">{formatDateFr(paiement.date_paiement)}</td>
              <td className="px-4 py-3">
                <LigneAction
                  paiement={paiement}
                  enfant={enfants.find((e) => e.id === paiement.enfant_id)}
                  creche={creche}
                  onSupprime={onSupprime}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
