import { heureActuelle, STATUT_PRESENCE_STYLES, STATUTS_PRESENCE } from '../lib/presences'
import type { Enfant } from '../types/enfant'
import type { StatutPresence } from '../types/presence'

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
    <li className="rounded-card border border-brume bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-display text-base font-semibold text-encre">
          {enfant.prenom} {enfant.nom}
        </p>
        {saving && <span className="shrink-0 text-xs text-ardoise">Enregistrement…</span>}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {STATUTS_PRESENCE.map((statut) => {
          const actif = pointage.statut === statut
          return (
            <button
              key={statut}
              type="button"
              onClick={() => onChangeStatut(statut)}
              className={`h-12 rounded-xl border text-xs font-medium transition ${
                actif
                  ? STATUT_PRESENCE_STYLES[statut]
                  : 'border-brume bg-white text-ardoise active:bg-neutre-50'
              }`}
            >
              {statut}
            </button>
          )
        })}
      </div>

      {pointage.statut === 'Présent' && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ardoise">Arrivée</span>
              <input
                type="time"
                value={pointage.heure_arrivee ?? heureActuelle()}
                onChange={(e) => onChangeHeure('heure_arrivee', e.target.value)}
                className="h-12 rounded-xl border border-brume bg-white px-3 text-base text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ardoise">Départ</span>
              <input
                type="time"
                value={pointage.heure_depart ?? ''}
                onChange={(e) => onChangeHeure('heure_depart', e.target.value)}
                className="h-12 rounded-xl border border-brume bg-white px-3 text-base text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100"
              />
            </label>
          </div>

          <label className="flex h-12 items-center justify-between rounded-xl border border-brume bg-white px-3">
            <span className="text-sm font-medium text-encre">Repas servi</span>
            <input
              type="checkbox"
              checked={pointage.repas}
              onChange={(e) => onChangeRepas(e.target.checked)}
              className="h-6 w-6 accent-pin-600"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-critique-600">{error}</p>}
    </li>
  )
}
