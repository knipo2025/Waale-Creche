import {
  heureActuelle,
  STATUT_PRESENCE_LABELS,
  STATUT_PRESENCE_STYLES,
} from '../lib/presences'
import type { Enfant } from '../types/enfant'
import type { StatutPresence } from '../types/presence'

const STATUTS: StatutPresence[] = ['present', 'absent', 'malade', 'conge']

export interface PointageJour {
  statut: StatutPresence | null
  heure_arrivee: string | null
  heure_depart: string | null
  repas: boolean
}

export default function PresenceRow({
  enfant,
  pointage,
  saving,
  error,
  onChangeStatut,
  onChangeHeure,
  onChangeRepas,
}: {
  enfant: Pick<Enfant, 'id' | 'nom' | 'prenom'>
  pointage: PointageJour
  saving: boolean
  error: string | null
  onChangeStatut: (statut: StatutPresence) => void
  onChangeHeure: (champ: 'heure_arrivee' | 'heure_depart', valeur: string) => void
  onChangeRepas: (repas: boolean) => void
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-base font-semibold text-slate-900">
          {enfant.prenom} {enfant.nom}
        </p>
        {saving && <span className="shrink-0 text-xs text-slate-400">Enregistrement…</span>}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {STATUTS.map((statut) => {
          const actif = pointage.statut === statut
          return (
            <button
              key={statut}
              type="button"
              onClick={() => onChangeStatut(statut)}
              className={`h-12 rounded-lg border text-xs font-medium transition ${
                actif
                  ? STATUT_PRESENCE_STYLES[statut]
                  : 'border-slate-300 bg-white text-slate-600 active:bg-slate-50'
              }`}
            >
              {STATUT_PRESENCE_LABELS[statut]}
            </button>
          )
        })}
      </div>

      {pointage.statut === 'present' && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Arrivée</span>
              <input
                type="time"
                value={pointage.heure_arrivee ?? heureActuelle()}
                onChange={(e) => onChangeHeure('heure_arrivee', e.target.value)}
                className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Départ</span>
              <input
                type="time"
                value={pointage.heure_depart ?? ''}
                onChange={(e) => onChangeHeure('heure_depart', e.target.value)}
                className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>

          <label className="flex h-12 items-center justify-between rounded-lg border border-slate-300 bg-white px-3">
            <span className="text-sm font-medium text-slate-700">Repas servi</span>
            <input
              type="checkbox"
              checked={pointage.repas}
              onChange={(e) => onChangeRepas(e.target.checked)}
              className="h-6 w-6 accent-emerald-600"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  )
}
