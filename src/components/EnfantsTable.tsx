import { ArrowUpDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { STATUT_ENFANT_STYLES, totalPaiementsRecus } from '../lib/enfants'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  dateFinCalculSolde,
  formatFCFA,
} from '../lib/tariffs'
import type { EnfantAvecPaiements } from '../types/enfant'

type Colonne = 'nom' | 'groupe' | 'solde'
type Tri = { colonne: Colonne; sens: 'asc' | 'desc' }

/** Tableau trié pour Élèves/Paiements en vue ordinateur (≥768px) — vue mobile en carte séparée. */
export default function EnfantsTable({ enfants }: { enfants: EnfantAvecPaiements[] }) {
  const [tri, setTri] = useState<Tri>({ colonne: 'nom', sens: 'asc' })

  const enrichis = useMemo(
    () =>
      enfants.map((enfant) => {
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
        return { enfant, groupe, solde }
      }),
    [enfants],
  )

  const tries = useMemo(() => {
    const copie = [...enrichis]
    copie.sort((a, b) => {
      let comparaison = 0
      if (tri.colonne === 'nom') {
        comparaison = `${a.enfant.prenom} ${a.enfant.nom}`.localeCompare(
          `${b.enfant.prenom} ${b.enfant.nom}`,
        )
      } else if (tri.colonne === 'groupe') {
        comparaison = a.groupe.localeCompare(b.groupe)
      } else {
        comparaison = a.solde - b.solde
      }
      return tri.sens === 'asc' ? comparaison : -comparaison
    })
    return copie
  }, [enrichis, tri])

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
            <EnTeteColonne colonne="nom" label="Enfant" />
            <EnTeteColonne colonne="groupe" label="Groupe" />
            <th className="label-caps px-4 py-3 text-left text-xs font-bold uppercase text-muted">
              Statut
            </th>
            <EnTeteColonne colonne="solde" label="Solde" alignDroite />
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {tries.map(({ enfant, groupe, solde }) => (
            <tr key={enfant.id} className="border-b border-line last:border-0 transition hover:bg-cream">
              <td className="px-4 py-3">
                <Link to={`/enfants/${enfant.id}`} className="flex items-center gap-3">
                  <Avatar prenom={enfant.prenom} nom={enfant.nom} />
                  <span className="font-heading font-semibold text-ink">
                    {enfant.prenom} {enfant.nom}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-pin-soft px-2 py-0.5 text-xs font-semibold text-pin-ink">
                  {groupe}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_ENFANT_STYLES[enfant.statut]}`}
                >
                  {enfant.statut}
                </span>
              </td>
              <td
                className={`px-4 py-3 text-right font-bold tabular-nums ${
                  solde > 0 ? 'text-bad' : 'text-ok'
                }`}
              >
                {formatFCFA(solde)}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/enfants/${enfant.id}`}
                  aria-label={`Ouvrir la fiche de ${enfant.prenom} ${enfant.nom}`}
                >
                  <ChevronRight size={18} className="text-muted" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
