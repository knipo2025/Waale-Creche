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

export const TYPE_PAIEMENT_LABELS: Record<TypePaiement, string> = {
  mensualite: 'Mensualité',
  inscription: "Frais d'inscription",
  autre: 'Autre',
}

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
}

export const STATUT_PAIEMENT_STYLES: Record<StatutPaiement, string> = {
  Reçu: 'bg-succes-50 text-succes-700',
  'En attente': 'bg-attention-50 text-attention-600',
  Annulé: 'bg-neutre-50 text-ardoise',
}
