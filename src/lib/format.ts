export function formatDateFr(dateIso: string): string {
  const [year, month, day] = dateIso.split('-')
  return `${day}/${month}/${year}`
}

export function formatMoisAnnee(moisConcerne: string): string {
  const [year, month] = moisConcerne.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const libelle = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}

export function moisCourant(): string {
  const aujourdhui = new Date()
  const mois = String(aujourdhui.getMonth() + 1).padStart(2, '0')
  return `${aujourdhui.getFullYear()}-${mois}`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
