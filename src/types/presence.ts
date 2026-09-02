export type StatutPresence = 'present' | 'absent' | 'malade' | 'conge'

export interface Presence {
  id: string
  creche_id: string
  enfant_id: string
  date: string
  statut: StatutPresence
  heure_arrivee: string | null
  heure_depart: string | null
  repas: boolean
  created_at: string
  updated_at: string
}

export type PresenceFormValues = Omit<
  Presence,
  'id' | 'creche_id' | 'created_at' | 'updated_at'
>
