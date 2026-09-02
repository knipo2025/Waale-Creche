import type { Groupe, Service } from '../types/enfant'

export const FRAIS_INSCRIPTION = 25_000

export const OPTION_REPAS_PRIX = 8_000
export const OPTION_GARDERIE_PRIX = 10_000

const TARIFS_BASE: Record<Groupe, Record<Service, number>> = {
  Bébés: {
    journee_complete: 60_000,
    demi_journee_matin: 35_000,
    demi_journee_apres_midi: 35_000,
  },
  Moyens: {
    journee_complete: 50_000,
    demi_journee_matin: 30_000,
    demi_journee_apres_midi: 30_000,
  },
  Grands: {
    journee_complete: 45_000,
    demi_journee_matin: 25_000,
    demi_journee_apres_midi: 25_000,
  },
}

export const SERVICE_LABELS: Record<Service, string> = {
  journee_complete: 'Journée complète',
  demi_journee_matin: 'Demi-journée matin',
  demi_journee_apres_midi: 'Demi-journée après-midi',
}

/**
 * Nombre de mois pleins écoulés entre deux dates (ex : âge en mois, ancienneté
 * d'inscription). Décrémenté de 1 si le jour du mois de `to` est antérieur au
 * jour du mois de `from` (le mois n'est pas encore "plein"). Jamais négatif.
 */
export function monthsBetween(from: Date, to: Date): number {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) {
    months -= 1
  }
  return Math.max(0, months)
}

export function calculerAgeEnMois(dateNaissance: string, aujourdhui = new Date()): number {
  return monthsBetween(new Date(dateNaissance), aujourdhui)
}

export function calculerGroupe(ageEnMois: number): Groupe {
  if (ageEnMois <= 12) return 'Bébés'
  if (ageEnMois <= 24) return 'Moyens'
  return 'Grands'
}

export function calculerTarifMensuel(
  groupe: Groupe,
  service: Service,
  optionRepas: boolean,
  optionGarderie: boolean,
): number {
  return (
    TARIFS_BASE[groupe][service] +
    (optionRepas ? OPTION_REPAS_PRIX : 0) +
    (optionGarderie ? OPTION_GARDERIE_PRIX : 0)
  )
}

export function calculerSoldeImpaye(
  dateInscription: string,
  tarifMensuel: number,
  totalPaiementsRecus: number,
  aujourdhui = new Date(),
): number {
  const moisEcoules = monthsBetween(new Date(dateInscription), aujourdhui)
  return moisEcoules * tarifMensuel + FRAIS_INSCRIPTION - totalPaiementsRecus
}

export function formatFCFA(montant: number): string {
  const arrondi = Math.round(montant)
  const signe = arrondi < 0 ? '-' : ''
  const chiffres = Math.abs(arrondi).toString()
  const avecEspaces = chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${signe}${avecEspaces} FCFA`
}
