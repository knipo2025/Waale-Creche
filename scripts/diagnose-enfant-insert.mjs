#!/usr/bin/env node
// Diagnostic ponctuel : reproduit exactement l'insertion faite par
// EnfantFormPage.tsx / createEnfant() (src/lib/enfants.ts), avec la clé anon
// + une session utilisateur réelle, et affiche l'erreur Supabase complète.
// Supprime la ligne de test immédiatement après (succès ou échec).
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-enfant-insert.mjs

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const RACINE_PROJET = resolve(import.meta.dirname, '..')

function chargerEnv(fichier) {
  const chemin = resolve(RACINE_PROJET, fichier)
  if (!existsSync(chemin)) return
  for (const ligne of readFileSync(chemin, 'utf8').split('\n')) {
    const l = ligne.trim()
    if (!l || l.startsWith('#')) continue
    const i = l.indexOf('=')
    if (i === -1) continue
    const cle = l.slice(0, i).trim()
    const valeur = l.slice(i + 1).trim()
    if (!(cle in process.env)) process.env[cle] = valeur
  }
}

chargerEnv('.env')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL = process.env.DIAG_EMAIL
const PASSWORD = process.env.DIAG_PASSWORD

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('SUPABASE_URL / SUPABASE_ANON_KEY introuvables (fichier .env).')
  process.exit(1)
}
if (!EMAIL || !PASSWORD) {
  console.error('Définissez DIAG_EMAIL et DIAG_PASSWORD (variables d\'environnement).')
  process.exit(1)
}

function afficherErreur(titre, error) {
  console.log(`\n--- ${titre} ---`)
  if (!error) {
    console.log('Aucune erreur.')
    return
  }
  console.log('message :', error.message)
  console.log('code    :', error.code)
  console.log('details :', error.details)
  console.log('hint    :', error.hint)
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authError) {
    afficherErreur('Connexion', authError)
    process.exit(1)
  }
  console.log(`Connecté. auth.users.id = ${authData.user.id}`)

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, creche_id')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profileData) {
    afficherErreur('profiles', profileError)
    process.exit(1)
  }
  console.log(`Profil OK. creche_id = ${profileData.creche_id}`)

  // Payload strictement identique à ce que EnfantFormPage.tsx envoie via
  // createEnfant() : mêmes clés, mêmes valeurs d'enum que les <option> du
  // formulaire (sexe M/F, service en slug, statut Inscrit/En attente/Sorti).
  const payload = {
    creche_id: profileData.creche_id,
    nom: 'TEST_DIAGNOSTIC',
    prenom: 'Script',
    date_naissance: '2024-01-15',
    sexe: 'F',
    service: 'journee_complete',
    option_repas: false,
    option_garderie: false,
    statut: 'Inscrit',
    date_inscription: '2025-09-01',
    allergies: null,
    medecin_nom: null,
    medecin_telephone: null,
    parent1_nom: 'TestNom',
    parent1_prenom: 'TestPrenom',
    parent1_telephone: '+225 00 00 00 00',
    parent1_email: null,
    parent1_adresse: null,
    parent2_nom: null,
    parent2_prenom: null,
    parent2_telephone: null,
    parent2_email: null,
    parent2_adresse: null,
  }

  console.log('\nPayload envoyé :', JSON.stringify(payload, null, 2))

  const { data: inserted, error: insertError, status } = await supabase
    .from('enfants')
    .insert(payload)
    .select(
      'id, creche_id, nom, prenom, date_naissance, sexe, service, option_repas, option_garderie, statut, date_inscription, parent1_nom, parent1_prenom, parent1_telephone',
    )
    .single()

  console.log(`\n--- insert enfants (status HTTP ${status}) ---`)
  console.log('data :', inserted)
  afficherErreur('insert enfants : erreur', insertError)

  if (inserted?.id) {
    const { error: deleteError } = await supabase.from('enfants').delete().eq('id', inserted.id)
    console.log(
      deleteError
        ? `\n(nettoyage échoué, supprimez manuellement l'enfant ${inserted.id} : ${deleteError.message})`
        : '\n(ligne de test supprimée avec succès)',
    )
  }
}

main()
  .catch((error) => {
    console.error('\nErreur fatale (exception JS, pas Supabase) :', error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
