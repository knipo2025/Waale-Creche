import { formatDateFr, formatMoisAnnee } from './format'
import { MODE_PAIEMENT_LABELS } from './paiements'
import { formatFCFA } from './tariffs'
import type { Creche } from '../types/creche'
import type { EnfantAvecPaiements } from '../types/enfant'
import type { PaiementAvecEnfant } from '../types/paiement'

const PAGE_WIDTH = 148
const MARGIN = 15

async function construireDocument(
  paiement: PaiementAvecEnfant,
  enfant: EnfantAvecPaiements,
  creche: Creche | null,
  soldeRestant: number,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(creche?.nom ?? 'Crèche', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  if (creche?.adresse) {
    doc.text(creche.adresse, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 5
  }
  if (creche?.telephone) {
    doc.text(creche.telephone, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 5
  }

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('REÇU DE PAIEMENT', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`N° ${paiement.numero_recu}`, MARGIN, y)
  doc.text(formatDateFr(paiement.date_paiement), PAGE_WIDTH - MARGIN, y, {
    align: 'right',
  })
  y += 10

  function champ(label: string, valeur: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(148, 163, 184)
    doc.text(label.toUpperCase(), MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(valeur, MARGIN, y)
    y += 8
  }

  champ('Enfant', `${enfant.prenom} ${enfant.nom}`)
  champ(
    'Parent',
    `${enfant.parent1_prenom} ${enfant.parent1_nom} — ${enfant.parent1_telephone}`,
  )
  if (enfant.parent2_nom && enfant.parent2_prenom) {
    champ(
      'Parent 2',
      `${enfant.parent2_prenom} ${enfant.parent2_nom}${
        enfant.parent2_telephone ? ` — ${enfant.parent2_telephone}` : ''
      }`,
    )
  }

  champ(
    'Motif',
    `${paiement.type}${
      paiement.mois_concerne ? ` — ${formatMoisAnnee(paiement.mois_concerne)}` : ''
    }`,
  )
  champ('Mode de paiement', MODE_PAIEMENT_LABELS[paiement.mode_paiement])
  champ('Statut', paiement.statut)

  y += 2
  doc.setDrawColor(226, 232, 240)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Montant payé', MARGIN, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(5, 150, 105)
  doc.text(formatFCFA(paiement.montant), PAGE_WIDTH - MARGIN, y, { align: 'right' })
  y += 12

  const soldeDu = soldeRestant > 0
  const fondSolde: [number, number, number] = soldeDu ? [254, 242, 242] : [236, 253, 245]
  const texteSolde: [number, number, number] = soldeDu ? [220, 38, 38] : [5, 150, 105]

  doc.setFillColor(...fondSolde)
  doc.roundedRect(MARGIN, y - 6, PAGE_WIDTH - 2 * MARGIN, 16, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Solde restant', MARGIN + 4, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...texteSolde)
  doc.text(formatFCFA(soldeRestant), PAGE_WIDTH - MARGIN - 4, y, { align: 'right' })
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Reçu généré le ${formatDateFr(new Date().toISOString().slice(0, 10))}`,
    PAGE_WIDTH / 2,
    200,
    { align: 'center' },
  )

  return doc
}

/** Génère le reçu PDF d'un paiement et propose le partage natif (mobile) ou, à défaut, le téléchargement. */
export async function partagerOuTelechargerRecu(
  paiement: PaiementAvecEnfant,
  enfant: EnfantAvecPaiements,
  creche: Creche | null,
  soldeRestant: number,
) {
  const doc = await construireDocument(paiement, enfant, creche, soldeRestant)
  const filename = `recu-${paiement.numero_recu}.pdf`

  const partageNavigateur = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title: string }) => Promise<void>
  }

  if (partageNavigateur.canShare && partageNavigateur.share) {
    const blob = doc.output('blob')
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (partageNavigateur.canShare({ files: [file] })) {
      try {
        await partageNavigateur.share({ files: [file], title: filename })
        return
      } catch {
        // Partage annulé ou indisponible : on retombe sur le téléchargement.
      }
    }
  }

  doc.save(filename)
}
