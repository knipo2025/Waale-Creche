import type { StatutPaiement } from './enfant'

export type TypePaiement = 'Mensualité' | 'Inscription' | 'Autre'

export type ModePaiement = 'especes' | 'mobile_money' | 'virement' | 'cheque'

export interface Paiement {
  id: string
  creche_id: string
  enfant_id: string

  type: TypePaiement
  mois_concerne: string | null
  montant: number
  mode_paiement: ModePaiement
  statut: StatutPaiement
  numero_recu: string
  date_paiement: string

  created_at: string
}

export interface PaiementAvecEnfant extends Paiement {
  enfant: { nom: string; prenom: string } | null
}

export type PaiementFormValues = Omit<
  Paiement,
  'id' | 'creche_id' | 'numero_recu' | 'created_at'
>
