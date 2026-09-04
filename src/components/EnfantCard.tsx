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

const GROUPE_COLORS: Record<string, string> = {
  Bébés: 'bg-school-sky/15 text-school-sky',
  Moyens: 'bg-school-sun/15 text-school-sun',
  Grands: 'bg-wa-green-50 text-wa-green-700',
}

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
      className="flex min-h-20 items-center justify-between gap-3 rounded-card border border-wa-line bg-wa-surface px-4 py-3 shadow-card-soft transition active:bg-wa-line"
    >
      <Avatar prenom={enfant.prenom} nom={enfant.nom} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-semibold text-wa-ink">
          {enfant.prenom} {enfant.nom}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${GROUPE_COLORS[groupe]}`}
        >
          {groupe}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-wa-muted">Solde</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              solde > 0 ? 'text-wa-danger' : 'text-wa-money'
            }`}
          >
            {formatFCFA(solde)}
          </p>
        </div>
        <ChevronRight size={20} className="text-wa-line" />
      </div>
    </Link>
  )
}
