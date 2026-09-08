import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  dateFinCalculSolde,
  formatFCFA,
} from '../lib/tariffs'
import { totalPaiementsRecus } from '../lib/enfants'
import type { EnfantAvecPaiements } from '../types/enfant'

export default function EnfantCard({ enfant }: { enfant: EnfantAvecPaiements }) {
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
    totalPaiementsRecus(enfant.paiements),
    dateFinCalculSolde(enfant),
  )

  return (
    <Link
      to={`/enfants/${enfant.id}`}
      className="flex min-h-20 items-center justify-between gap-3 rounded-row border border-line bg-surface px-4 py-3 shadow-card-soft transition active:bg-cream"
    >
      <Avatar prenom={enfant.prenom} nom={enfant.nom} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-base font-semibold text-ink">
          {enfant.prenom} {enfant.nom}
        </p>
        <span className="mt-1 inline-block rounded-full bg-pin-soft px-2 py-0.5 text-xs font-semibold text-pin-ink">
          {groupe}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-muted">Solde</p>
          <p
            className={`text-sm font-bold tabular-nums ${
              solde > 0 ? 'text-bad' : 'text-ok'
            }`}
          >
            {formatFCFA(solde)}
          </p>
        </div>
        <ChevronRight size={20} className="text-muted" />
      </div>
    </Link>
  )
}
