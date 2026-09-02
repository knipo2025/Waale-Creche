import { supabase } from './supabase'
import type { Creche, CrecheFormValues } from '../types/creche'

const CRECHE_COLUMNS = `
  id, nom, adresse, telephone, capacite, objectif_remplissage,
  seuil_impaye_enfant, seuil_impaye_taux
`

export async function updateCreche(
  id: string,
  values: CrecheFormValues,
): Promise<Creche> {
  const { data, error } = await supabase
    .from('creches')
    .update(values)
    .eq('id', id)
    .select(CRECHE_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Creche
}
