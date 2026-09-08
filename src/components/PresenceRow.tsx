import { X } from 'lucide-react'
import Avatar from './Avatar'
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
  onAnnuler,
}: {
  enfant: Pick<Enfant, 'id' | 'nom' | 'prenom'>
  pointage: PointageJour
  saving: boolean
  error: string | null
  onChangeStatut: (statut: StatutPresence) => void
  onChangeHeure: (champ: 'heure_arrivee' | 'heure_depart', valeur: string) => void
  onChangeRepas: (repas: boolean) => void
  onAnnuler: () => void
}) {
  return (
    <li className="rounded-row border border-line bg-surface p-4 shadow-card-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar prenom={enfant.prenom} nom={enfant.nom} />
          <p className="truncate font-heading text-base font-semibold text-ink">
            {enfant.prenom} {enfant.nom}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saving && <span className="text-xs text-muted">Enregistrement…</span>}
          {pointage.statut && !saving && (
            <button
              type="button"
              onClick={onAnnuler}
              aria-label="Annuler le pointage"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition active:bg-cream"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {STATUTS_PRESENCE.map((statut) => {
          const actif = pointage.statut === statut
          return (
            <button
              key={statut}
              type="button"
              onClick={() => onChangeStatut(statut)}
              className={`h-12 rounded-xl border text-xs font-semibold transition ${
                actif
                  ? STATUT_PRESENCE_STYLES[statut]
                  : 'border-line bg-surface text-muted active:bg-cream'
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
              <span className="text-xs font-semibold text-muted">Arrivée</span>
              <input
                type="time"
                value={pointage.heure_arrivee ?? heureActuelle()}
                onChange={(e) => onChangeHeure('heure_arrivee', e.target.value)}
                className="h-12 rounded-xl border border-line bg-surface px-3 text-base text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Départ</span>
              <input
                type="time"
                value={pointage.heure_depart ?? ''}
                onChange={(e) => onChangeHeure('heure_depart', e.target.value)}
                className="h-12 rounded-xl border border-line bg-surface px-3 text-base text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft"
              />
            </label>
          </div>

          <label className="flex h-12 items-center justify-between rounded-xl border border-line bg-surface px-3">
            <span className="text-sm font-semibold text-ink">Repas servi</span>
            <input
              type="checkbox"
              checked={pointage.repas}
              onChange={(e) => onChangeRepas(e.target.checked)}
              className="h-6 w-6 accent-pin"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
    </li>
  )
}
