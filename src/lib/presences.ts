import { supabase } from './supabase'
import type { Presence, PresenceFormValues, StatutPresence } from '../types/presence'

const PRESENCE_COLUMNS = `
  id, creche_id, enfant_id, date, statut, heure_arrivee, heure_depart, repas,
  created_at, updated_at
`

export async function listPresencesDuJour(
  crecheId: string,
  date: string,
): Promise<Presence[]> {
  const { data, error } = await supabase
    .from('presences')
    .select(PRESENCE_COLUMNS)
    .eq('creche_id', crecheId)
    .eq('date', date)

  if (error) throw error
  return (data ?? []) as unknown as Presence[]
}

export async function upsertPresence(
  values: PresenceFormValues,
  crecheId: string,
): Promise<Presence> {
  const { data, error } = await supabase
    .from('presences')
    .upsert({ ...values, creche_id: crecheId }, { onConflict: 'enfant_id,date' })
    .select(PRESENCE_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Presence
}

export const STATUT_PRESENCE_LABELS: Record<StatutPresence, string> = {
  present: 'Présent',
  absent: 'Absent',
  malade: 'Malade',
  conge: 'Congé',
}

export const STATUT_PRESENCE_STYLES: Record<StatutPresence, string> = {
  present: 'bg-emerald-600 text-white border-emerald-600',
  absent: 'bg-slate-600 text-white border-slate-600',
  malade: 'bg-amber-500 text-white border-amber-500',
  conge: 'bg-sky-500 text-white border-sky-500',
}

export function heureActuelle(): string {
  const maintenant = new Date()
  const heures = String(maintenant.getHours()).padStart(2, '0')
  const minutes = String(maintenant.getMinutes()).padStart(2, '0')
  return `${heures}:${minutes}`
}
