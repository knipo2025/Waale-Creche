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

export async function deletePresence(id: string): Promise<void> {
  const { error } = await supabase.from('presences').delete().eq('id', id)
  if (error) throw error
}

export const STATUTS_PRESENCE: StatutPresence[] = ['Présent', 'Absent', 'Malade', 'Congé']

export const STATUT_PRESENCE_STYLES: Record<StatutPresence, string> = {
  Présent: 'bg-ok text-white border-ok',
  Absent: 'bg-bad text-white border-bad',
  Malade: 'bg-warn text-white border-warn',
  Congé: 'bg-pin text-white border-pin',
}

export function heureActuelle(): string {
  const maintenant = new Date()
  const heures = String(maintenant.getHours()).padStart(2, '0')
  const minutes = String(maintenant.getMinutes()).padStart(2, '0')
  return `${heures}:${minutes}`
}
