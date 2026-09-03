export type Sexe = 'M' | 'F'

export type Service =
  | 'journee_complete'
  | 'demi_journee_matin'
  | 'demi_journee_apres_midi'

export type Statut = 'Inscrit' | 'En attente' | 'Sorti'

export type Groupe = 'Bébés' | 'Moyens' | 'Grands'

export type StatutPaiement = 'Reçu' | 'En attente' | 'Annulé'

export interface Enfant {
  id: string
  creche_id: string

  nom: string
  prenom: string
  date_naissance: string
  sexe: Sexe

  service: Service
  option_repas: boolean
  option_garderie: boolean

  statut: Statut
  date_inscription: string
  date_sortie: string | null

  allergies: string | null
  medecin_nom: string | null
  medecin_telephone: string | null

  parent1_nom: string
  parent1_prenom: string
  parent1_telephone: string
  parent1_email: string | null
  parent1_adresse: string | null

  parent2_nom: string | null
  parent2_prenom: string | null
  parent2_telephone: string | null
  parent2_email: string | null
  parent2_adresse: string | null

  created_at: string
  updated_at: string
}

/** Enfant tel que renvoyé par la liste, avec ses paiements imbriqués (pour le calcul du solde). */
export interface EnfantAvecPaiements extends Enfant {
  paiements: { montant: number; statut: StatutPaiement }[]
}

export type EnfantFormValues = Omit<
  Enfant,
  'id' | 'creche_id' | 'created_at' | 'updated_at'
>
