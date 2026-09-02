import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  formatFCFA,
} from '../lib/tariffs'
import { totalPaiementsRecus } from '../lib/enfants'
import type { EnfantAvecPaiements } from '../types/enfant'

const GROUPE_COLORS: Record<string, string> = {
  Bébés: 'bg-sky-100 text-sky-700',
  Moyens: 'bg-amber-100 text-amber-700',
  Grands: 'bg-violet-100 text-violet-700',
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
  )

  return (
    <Link
      to={`/enfants/${enfant.id}`}
      className="flex min-h-20 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition active:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-900">
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
          <p className="text-xs text-slate-400">Solde</p>
          <p
            className={`text-sm font-semibold ${
              solde > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {formatFCFA(solde)}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-300" />
      </div>
    </Link>
  )
}
