import { supabase } from './supabase'
import type {
  ModePaiement,
  Paiement,
  PaiementAvecEnfant,
  PaiementFormValues,
  TypePaiement,
} from '../types/paiement'
import type { StatutPaiement } from '../types/enfant'

const PAIEMENT_COLUMNS = `
  id, creche_id, enfant_id, type, mois_concerne, montant, mode_paiement,
  statut, numero_recu, date_paiement, created_at
`

export async function listPaiements(crecheId: string): Promise<PaiementAvecEnfant[]> {
  const { data, error } = await supabase
    .from('paiements')
    .select(`${PAIEMENT_COLUMNS}, enfant:enfants(nom, prenom)`)
    .eq('creche_id', crecheId)
    .order('date_paiement', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as PaiementAvecEnfant[]
}

export async function getPaiement(id: string): Promise<Paiement> {
  const { data, error } = await supabase
    .from('paiements')
    .select(PAIEMENT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as Paiement
}

export async function createPaiement(
  values: PaiementFormValues,
  crecheId: string,
): Promise<Paiement> {
  const { data, error } = await supabase
    .from('paiements')
    .insert({ ...values, creche_id: crecheId })
    .select(PAIEMENT_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Paiement
}

export async function updatePaiement(
  id: string,
  values: PaiementFormValues,
): Promise<Paiement> {
  const { data, error } = await supabase
    .from('paiements')
    .update(values)
    .eq('id', id)
    .select(PAIEMENT_COLUMNS)
    .single()

  if (error) throw error
  return data as unknown as Paiement
}

export async function deletePaiement(id: string): Promise<void> {
  const { error } = await supabase.from('paiements').delete().eq('id', id)
  if (error) throw error
}

export const TYPES_PAIEMENT: TypePaiement[] = ['Mensualité', 'Inscription', 'Autre']

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
}

export const STATUT_PAIEMENT_STYLES: Record<StatutPaiement, string> = {
  Reçu: 'bg-wa-green-50 text-wa-green-700',
  'En attente': 'bg-wa-warning/10 text-wa-warning',
  Annulé: 'bg-wa-line text-wa-muted',
}
