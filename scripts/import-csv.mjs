#!/usr/bin/env node
// Importe des fichiers CSV exportés depuis Excel (enfants.csv, paiements.csv)
// dans Supabase, pour une crèche donnée. Voir scripts/README.md pour l'usage.

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const RACINE_PROJET = resolve(import.meta.dirname, '..')

// ============================================================
// Environnement (.env.import — jamais VITE_*, jamais commité)
// ============================================================

function chargerEnvImport() {
  const chemin = resolve(RACINE_PROJET, '.env.import')
  if (!existsSync(chemin)) return

  const contenu = readFileSync(chemin, 'utf8')
  for (const ligne of contenu.split('\n')) {
    const l = ligne.trim()
    if (!l || l.startsWith('#')) continue
    const indexEgal = l.indexOf('=')
    if (indexEgal === -1) continue
    const cle = l.slice(0, indexEgal).trim()
    const valeur = l.slice(indexEgal + 1).trim()
    if (!(cle in process.env)) process.env[cle] = valeur
  }
}

chargerEnvImport()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================================
// Arguments CLI
// ============================================================

function parserArguments(argv) {
  const args = { dryRun: false, delimiter: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--creche-id') args.crecheId = argv[++i]
    else if (a === '--enfants') args.enfantsPath = argv[++i]
    else if (a === '--paiements') args.paiementsPath = argv[++i]
    else if (a === '--delimiter') args.delimiter = argv[++i]
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--help' || a === '-h') args.help = true
    else {
      console.error(`Argument inconnu : ${a}`)
      process.exit(1)
    }
  }
  return args
}

function afficherAide() {
  console.log(`
Usage :
  node scripts/import-csv.mjs --creche-id <uuid> [--enfants fichier.csv] [--paiements fichier.csv] [--dry-run] [--delimiter ";"]

Options :
  --creche-id   UUID de la crèche cible (obligatoire)
  --enfants     Chemin vers enfants.csv
  --paiements   Chemin vers paiements.csv
  --dry-run     Valide et affiche un résumé sans rien écrire dans Supabase
  --delimiter   Force le séparateur CSV ("," ou ";"). Auto-détecté sinon.

Au moins un des deux fichiers (--enfants ou --paiements) est requis.
Voir scripts/README.md pour le détail des colonnes attendues.
`)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ============================================================
// Aide CSV : BOM, délimiteur, dates, booléens
// ============================================================

function lireEtParserCsv(chemin, delimiterForce) {
  let texte = readFileSync(chemin, 'utf8')
  if (texte.charCodeAt(0) === 0xfeff) texte = texte.slice(1) // BOM Excel

  const premiereLigne = texte.split(/\r?\n/, 1)[0] ?? ''
  const delimiter =
    delimiterForce ??
    ((premiereLigne.match(/;/g) ?? []).length >
    (premiereLigne.match(/,/g) ?? []).length
      ? ';'
      : ',')

  return parse(texte, {
    columns: (en_tetes) => en_tetes.map((h) => h.trim()),
    delimiter,
    trim: true,
    skip_empty_lines: true,
    bom: true,
  })
}

/** Accepte YYYY-MM-DD ou DD/MM/YYYY (format Excel FR courant). Retourne YYYY-MM-DD ou null si invalide/vide. */
function normaliserDate(valeur) {
  const v = (valeur ?? '').trim()
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, jour, mois, annee] = m
    return `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`
  }
  return undefined // invalide
}

/** Accepte YYYY-MM ou MM/YYYY. Retourne YYYY-MM ou null si vide, undefined si invalide. */
function normaliserMoisAnnee(valeur) {
  const v = (valeur ?? '').trim()
  if (!v) return null
  if (/^\d{4}-\d{2}$/.test(v)) return v
  const m = v.match(/^(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`
  return undefined
}

function normaliserBooleen(valeur) {
  const v = (valeur ?? '').trim().toLowerCase()
  if (['oui', 'true', 'vrai', '1', 'yes'].includes(v)) return true
  if (['non', 'false', 'faux', '0', 'no', ''].includes(v)) return false
  return undefined
}

/** Parse un montant même formaté à l'excel ("60 000", "60000", "60 000 FCFA"). */
function normaliserMontant(valeur) {
  const v = (valeur ?? '').replace(/[^\d-]/g, '')
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normaliserEnum(valeur, correspondances, defaut) {
  const v = (valeur ?? '').trim().toLowerCase()
  if (!v) return defaut
  for (const [slug, libelles] of Object.entries(correspondances)) {
    if (slug.toLowerCase() === v || libelles.some((l) => l.toLowerCase() === v)) return slug
  }
  return undefined
}

function videVersNull(valeur) {
  const v = (valeur ?? '').trim()
  return v === '' ? null : v
}

// Ces libellés doivent rester alignés avec src/lib/tariffs.ts, src/lib/paiements.ts
// et les valeurs autorisées par schema.sql (contraintes check).
const SERVICE_CORRESPONDANCES = {
  journee_complete: ['Journée complète'],
  demi_journee_matin: ['Demi-journée matin'],
  demi_journee_apres_midi: ['Demi-journée après-midi'],
}
const STATUT_ENFANT_CORRESPONDANCES = {
  Inscrit: [],
  'En attente': [],
  Sorti: [],
}
const TYPE_PAIEMENT_CORRESPONDANCES = {
  Mensualité: [],
  Inscription: ["Frais d'inscription"],
  Autre: [],
}
const MODE_PAIEMENT_CORRESPONDANCES = {
  especes: ['Espèces', 'Especes'],
  mobile_money: ['Mobile Money'],
  virement: ['Virement bancaire', 'Virement'],
  cheque: ['Chèque', 'Cheque'],
}
const STATUTS_PAIEMENT_VALIDES = new Set(['Reçu', 'En attente', 'Annulé'])

function normaliserClePersonne(nom, prenom) {
  return `${(nom ?? '').trim().toLowerCase()}|${(prenom ?? '').trim().toLowerCase()}`
}

// ============================================================
// Import enfants.csv
// ============================================================

function validerLigneEnfant(ligne, index, crecheId) {
  const erreurs = []
  const numero = index + 2 // +1 zero-index, +1 ligne d'en-tête

  const nom = videVersNull(ligne.nom)
  const prenom = videVersNull(ligne.prenom)
  if (!nom) erreurs.push('nom manquant')
  if (!prenom) erreurs.push('prenom manquant')

  const dateNaissance = normaliserDate(ligne.date_naissance)
  if (dateNaissance === undefined) erreurs.push(`date_naissance invalide : "${ligne.date_naissance}"`)
  if (dateNaissance === null) erreurs.push('date_naissance manquante')

  const sexe = (ligne.sexe ?? '').trim().toUpperCase()
  const sexeMappe =
    sexe === 'M' || sexe === 'MASCULIN' ? 'M' : sexe === 'F' || sexe === 'FEMININ' || sexe === 'FÉMININ' ? 'F' : undefined
  if (!sexeMappe) erreurs.push(`sexe invalide : "${ligne.sexe}" (attendu M ou F)`)

  const service = normaliserEnum(ligne.service, SERVICE_CORRESPONDANCES, undefined)
  if (!service) erreurs.push(`service invalide : "${ligne.service}"`)

  const optionRepas = normaliserBooleen(ligne.option_repas)
  if (optionRepas === undefined) erreurs.push(`option_repas invalide : "${ligne.option_repas}"`)

  const optionGarderie = normaliserBooleen(ligne.option_garderie)
  if (optionGarderie === undefined) erreurs.push(`option_garderie invalide : "${ligne.option_garderie}"`)

  const statut = normaliserEnum(ligne.statut, STATUT_ENFANT_CORRESPONDANCES, 'Inscrit')
  if (!statut) erreurs.push(`statut invalide : "${ligne.statut}"`)

  const dateInscription = normaliserDate(ligne.date_inscription)
  if (dateInscription === undefined) erreurs.push(`date_inscription invalide : "${ligne.date_inscription}"`)

  const dateSortie = normaliserDate(ligne.date_sortie)
  if (dateSortie === undefined) erreurs.push(`date_sortie invalide : "${ligne.date_sortie}"`)
  if (statut === 'Sorti' && !dateSortie) erreurs.push('date_sortie requise pour un enfant Sorti')

  const parent1Nom = videVersNull(ligne.parent1_nom)
  const parent1Prenom = videVersNull(ligne.parent1_prenom)
  const parent1Telephone = videVersNull(ligne.parent1_telephone)
  if (!parent1Nom) erreurs.push('parent1_nom manquant')
  if (!parent1Prenom) erreurs.push('parent1_prenom manquant')
  if (!parent1Telephone) erreurs.push('parent1_telephone manquant')

  if (erreurs.length > 0) return { numero, erreurs }

  return {
    numero,
    valeurs: {
      creche_id: crecheId,
      nom,
      prenom,
      date_naissance: dateNaissance,
      sexe: sexeMappe,
      service,
      option_repas: optionRepas,
      option_garderie: optionGarderie,
      statut,
      ...(dateInscription ? { date_inscription: dateInscription } : {}),
      date_sortie: dateSortie,
      allergies: videVersNull(ligne.allergies),
      medecin_nom: videVersNull(ligne.medecin_nom),
      medecin_telephone: videVersNull(ligne.medecin_telephone),
      parent1_nom: parent1Nom,
      parent1_prenom: parent1Prenom,
      parent1_telephone: parent1Telephone,
      parent1_email: videVersNull(ligne.parent1_email),
      parent1_adresse: videVersNull(ligne.parent1_adresse),
      parent2_nom: videVersNull(ligne.parent2_nom),
      parent2_prenom: videVersNull(ligne.parent2_prenom),
      parent2_telephone: videVersNull(ligne.parent2_telephone),
      parent2_email: videVersNull(ligne.parent2_email),
      parent2_adresse: videVersNull(ligne.parent2_adresse),
    },
  }
}

async function importerEnfants(supabase, chemin, delimiter, crecheId, dryRun) {
  console.log(`\n--- enfants.csv (${chemin}) ---`)
  const lignes = lireEtParserCsv(chemin, delimiter)

  const valides = []
  const erreursParLigne = []

  lignes.forEach((ligne, index) => {
    const resultat = validerLigneEnfant(ligne, index, crecheId)
    if (resultat.erreurs) erreursParLigne.push(resultat)
    else valides.push(resultat.valeurs)
  })

  for (const { numero, erreurs } of erreursParLigne) {
    console.warn(`  Ligne ${numero} ignorée : ${erreurs.join(', ')}`)
  }

  console.log(`  ${valides.length} ligne(s) valide(s) sur ${lignes.length}.`)

  if (dryRun) {
    console.log('  (dry-run : rien inséré)')
    return { inseres: 0, erreurs: erreursParLigne.length }
  }

  const TAILLE_LOT = 500
  let inseres = 0
  for (let i = 0; i < valides.length; i += TAILLE_LOT) {
    const lot = valides.slice(i, i + TAILLE_LOT)
    const { error, count } = await supabase.from('enfants').insert(lot, { count: 'exact' })
    if (error) throw new Error(`Insertion enfants échouée : ${error.message}`)
    inseres += count ?? lot.length
  }

  console.log(`  ${inseres} enfant(s) inséré(s) dans Supabase.`)
  return { inseres, erreurs: erreursParLigne.length }
}

// ============================================================
// Import paiements.csv
// ============================================================

function validerLignePaiement(ligne, index, crecheId, enfantsParCle) {
  const erreurs = []
  const numero = index + 2

  const cle = normaliserClePersonne(ligne.enfant_nom, ligne.enfant_prenom)
  const correspondances = enfantsParCle.get(cle) ?? []
  let enfantId
  if (correspondances.length === 0) {
    erreurs.push(
      `enfant introuvable pour "${ligne.enfant_prenom} ${ligne.enfant_nom}" — vérifiez l'orthographe ou importez d'abord enfants.csv`,
    )
  } else if (correspondances.length === 1) {
    enfantId = correspondances[0].id
  } else if (ligne.enfant_date_naissance) {
    const dateNaissance = normaliserDate(ligne.enfant_date_naissance)
    const trouve = correspondances.find((e) => e.date_naissance === dateNaissance)
    if (trouve) enfantId = trouve.id
    else erreurs.push(`plusieurs enfants nommés "${ligne.enfant_prenom} ${ligne.enfant_nom}", et enfant_date_naissance ne correspond à aucun`)
  } else {
    erreurs.push(
      `plusieurs enfants nommés "${ligne.enfant_prenom} ${ligne.enfant_nom}" — ajoutez la colonne enfant_date_naissance pour lever l'ambiguïté`,
    )
  }

  const type = normaliserEnum(ligne.type, TYPE_PAIEMENT_CORRESPONDANCES, 'Mensualité')
  if (!type) erreurs.push(`type invalide : "${ligne.type}"`)

  const moisConcerne = normaliserMoisAnnee(ligne.mois_concerne)
  if (moisConcerne === undefined) erreurs.push(`mois_concerne invalide : "${ligne.mois_concerne}"`)
  if (type === 'Mensualité' && !moisConcerne) erreurs.push('mois_concerne requis pour une mensualité')

  const montant = normaliserMontant(ligne.montant)
  if (montant === undefined || montant <= 0) erreurs.push(`montant invalide : "${ligne.montant}"`)

  const modePaiement = normaliserEnum(ligne.mode_paiement, MODE_PAIEMENT_CORRESPONDANCES, 'especes')
  if (!modePaiement) erreurs.push(`mode_paiement invalide : "${ligne.mode_paiement}"`)

  const statutBrut = (ligne.statut ?? '').trim()
  const statut = statutBrut === '' ? 'Reçu' : statutBrut
  if (!STATUTS_PAIEMENT_VALIDES.has(statut)) {
    erreurs.push(`statut invalide : "${ligne.statut}" (attendu Reçu, En attente ou Annulé)`)
  }

  const datePaiement = normaliserDate(ligne.date_paiement)
  if (datePaiement === undefined) erreurs.push(`date_paiement invalide : "${ligne.date_paiement}"`)

  if (erreurs.length > 0) return { numero, erreurs }

  return {
    numero,
    valeurs: {
      creche_id: crecheId,
      enfant_id: enfantId,
      type,
      mois_concerne: moisConcerne,
      montant,
      mode_paiement: modePaiement,
      statut,
      ...(datePaiement ? { date_paiement: datePaiement } : {}),
    },
  }
}

async function importerPaiements(supabase, chemin, delimiter, crecheId, dryRun) {
  console.log(`\n--- paiements.csv (${chemin}) ---`)

  const { data: enfants, error } = await supabase
    .from('enfants')
    .select('id, nom, prenom, date_naissance')
    .eq('creche_id', crecheId)
  if (error) throw new Error(`Lecture des enfants échouée : ${error.message}`)

  const enfantsParCle = new Map()
  for (const e of enfants ?? []) {
    const cle = normaliserClePersonne(e.nom, e.prenom)
    if (!enfantsParCle.has(cle)) enfantsParCle.set(cle, [])
    enfantsParCle.get(cle).push(e)
  }

  const lignes = lireEtParserCsv(chemin, delimiter)

  const valides = []
  const erreursParLigne = []

  lignes.forEach((ligne, index) => {
    const resultat = validerLignePaiement(ligne, index, crecheId, enfantsParCle)
    if (resultat.erreurs) erreursParLigne.push(resultat)
    else valides.push(resultat.valeurs)
  })

  for (const { numero, erreurs } of erreursParLigne) {
    console.warn(`  Ligne ${numero} ignorée : ${erreurs.join(', ')}`)
  }

  console.log(`  ${valides.length} ligne(s) valide(s) sur ${lignes.length}.`)

  if (dryRun) {
    console.log('  (dry-run : rien inséré)')
    return { inseres: 0, erreurs: erreursParLigne.length }
  }

  const TAILLE_LOT = 500
  let inseres = 0
  for (let i = 0; i < valides.length; i += TAILLE_LOT) {
    const lot = valides.slice(i, i + TAILLE_LOT)
    const { error: erreurInsert, count } = await supabase
      .from('paiements')
      .insert(lot, { count: 'exact' })
    if (erreurInsert) throw new Error(`Insertion paiements échouée : ${erreurInsert.message}`)
    inseres += count ?? lot.length
  }

  console.log(`  ${inseres} paiement(s) inséré(s) dans Supabase.`)
  return { inseres, erreurs: erreursParLigne.length }
}

// ============================================================
// Point d'entrée
// ============================================================

async function main() {
  const args = parserArguments(process.argv.slice(2))

  if (args.help) {
    afficherAide()
    return
  }

  if (!args.crecheId || !UUID_REGEX.test(args.crecheId)) {
    console.error('Erreur : --creche-id <uuid> est obligatoire et doit être un UUID valide.')
    afficherAide()
    process.exit(1)
  }

  if (!args.enfantsPath && !args.paiementsPath) {
    console.error('Erreur : indiquez au moins --enfants ou --paiements.')
    afficherAide()
    process.exit(1)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Erreur : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies (fichier .env.import à la racine, voir scripts/README.md).',
    )
    process.exit(1)
  }

  if (args.enfantsPath && !existsSync(args.enfantsPath)) {
    console.error(`Erreur : fichier introuvable : ${args.enfantsPath}`)
    process.exit(1)
  }
  if (args.paiementsPath && !existsSync(args.paiementsPath)) {
    console.error(`Erreur : fichier introuvable : ${args.paiementsPath}`)
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  console.log(`Import pour creche_id = ${args.crecheId}${args.dryRun ? ' (DRY-RUN)' : ''}`)

  let totalErreurs = 0

  if (args.enfantsPath) {
    const resultat = await importerEnfants(
      supabase,
      args.enfantsPath,
      args.delimiter,
      args.crecheId,
      args.dryRun,
    )
    totalErreurs += resultat.erreurs
  }

  if (args.paiementsPath) {
    const resultat = await importerPaiements(
      supabase,
      args.paiementsPath,
      args.delimiter,
      args.crecheId,
      args.dryRun,
    )
    totalErreurs += resultat.erreurs
  }

  console.log('')
  if (totalErreurs > 0) {
    console.log(`Terminé avec ${totalErreurs} ligne(s) ignorée(s). Corrigez le CSV et relancez si besoin.`)
    process.exit(1)
  }
  console.log('Terminé sans erreur.')
}

main().catch((error) => {
  console.error('\nErreur fatale :', error.message)
  process.exit(1)
})
