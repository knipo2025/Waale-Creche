import { formatMoisAnnee, moisCourant } from './format'
import { formatFCFA } from './tariffs'
import type { Enfant } from '../types/enfant'

export function nettoyerNumeroWhatsapp(numero: string): string {
  return numero.replace(/\D/g, '')
}

export function construireMessageRelance(
  enfant: Pick<Enfant, 'prenom' | 'nom'>,
  solde: number,
  crecheNom: string | null,
): string {
  const moisEnCours = formatMoisAnnee(moisCourant())
  const nomCreche = crecheNom ?? 'la crèche'

  return [
    `Bonjour,`,
    `Nous vous contactons au sujet du solde impayé de ${enfant.prenom} ${enfant.nom} pour le mois de ${moisEnCours}.`,
    `Le montant dû s'élève à ${formatFCFA(solde)}.`,
    `Merci de bien vouloir régulariser la situation dès que possible.`,
    `Cordialement,`,
    nomCreche,
  ].join('\n')
}

export function construireLienRelanceWhatsapp(
  telephoneParent1: string,
  enfant: Pick<Enfant, 'prenom' | 'nom'>,
  solde: number,
  crecheNom: string | null,
): string {
  const numero = nettoyerNumeroWhatsapp(telephoneParent1)
  const message = construireMessageRelance(enfant, solde, crecheNom)
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}
