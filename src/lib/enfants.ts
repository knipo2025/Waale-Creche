import { supabase } from './supabase'
import type { Enfant, EnfantAvecPaiements, EnfantFormValues } from '../types/enfant'

const ENFANT_COLUMNS = `
  id, creche_id, nom, prenom, date_naissance, sexe,
  service, option_repas, option_garderie,
  statut, date_inscription,
  allergies, medecin_nom, medecin_telephone,
  parent1_nom, parent1_prenom, parent1_telephone, parent1_email, parent1_adresse,
  parent2_nom, parent2_prenom, parent2_telephone, parent2_email, parent2_adresse,
  created_at, updated_at
`

export async function listEnfants(crecheId: string): Promise<EnfantAvecPaiements[]> {
  const { data, error } = await supabase
    .from('enfants')
    .select(`${ENFANT_COLUMNS}, paiements(montant, statut)`)
    .eq('creche_id', crecheId)
    .order('nom', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as EnfantAvecPaiements[]
}

export async function getEnfant(id: string): Promise<Enfant> {
  const { data, error } = await supabase
    .from('enfants')
    .select(ENFANT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as Enfant
}

export async function createEnfant(
  values: EnfantFormValues,
  crecheId: string,
): Promise<Enfant> {
  const { data, error } = await supabase
    .from('enfants')
    .insert({ ...values, creche_id: crecheId })
    .select(ENFANT_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Enfant
}

export async function updateEnfant(
  id: string,
  values: EnfantFormValues,
): Promise<Enfant> {
  const { data, error } = await supabase
    .from('enfants')
    .update(values)
    .eq('id', id)
    .select(ENFANT_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Enfant
}

export function totalPaiementsRecus(paiements: { montant: number; statut: string }[]): number {
  return paiements
    .filter((p) => p.statut === 'Reçu')
    .reduce((sum, p) => sum + p.montant, 0)
}
