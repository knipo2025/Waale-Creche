export interface Creche {
  id: string
  nom: string
  adresse: string | null
  telephone: string | null
  capacite: number
  objectif_remplissage: number
  seuil_impaye_enfant: number
  seuil_impaye_taux: number
}

export type CrecheFormValues = Omit<Creche, 'id'>
