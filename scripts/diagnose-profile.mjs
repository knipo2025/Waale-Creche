#!/usr/bin/env node
// Diagnostic ponctuel : reproduit exactement les requêtes de AuthContext.tsx
// (profiles puis creches) avec la clé anon + une session utilisateur réelle,
// et affiche l'erreur Supabase complète (message, code, details, hint) au
// lieu du message générique affiché dans l'UI.
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-profile.mjs

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
    afficherErreur('Connexion (signInWithPassword)', authError)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log(`Connecté. auth.users.id = ${userId}`)

  // Requête identique à fetchProfile() dans src/contexts/AuthContext.tsx
  const { data: profileData, error: profileError, status: profileStatus } = await supabase
    .from('profiles')
    .select('id, creche_id, full_name, email')
    .eq('id', userId)
    .single()

  console.log(`\n--- profiles (status HTTP ${profileStatus}) ---`)
  console.log('data :', profileData)
  afficherErreur('profiles : erreur', profileError)

  // Requête équivalente, sans .single(), pour voir combien de lignes sont
  // réellement visibles sous RLS (utile si .single() échoue).
  const { data: profileRows, error: profileRowsError } = await supabase
    .from('profiles')
    .select('id, creche_id, full_name, email')
    .eq('id', userId)
  console.log(`\nprofiles sans .single() → ${profileRows?.length ?? 'erreur'} ligne(s) visible(s) sous RLS`)
  if (profileRowsError) afficherErreur('profiles (sans .single()) : erreur', profileRowsError)

  if (!profileData) {
    console.log('\n=> Pas de profil chargé, arrêt avant la requête creches (comme dans AuthContext.tsx).')
    return
  }

  // Requête identique à fetchCreche()
  const { data: crecheData, error: crecheError, status: crecheStatus } = await supabase
    .from('creches')
    .select(
      'id, nom, adresse, telephone, capacite, objectif_remplissage, seuil_impaye_enfant, seuil_impaye_taux',
    )
    .eq('id', profileData.creche_id)
    .maybeSingle()

  console.log(`\n--- creches (status HTTP ${crecheStatus}) ---`)
  console.log('data :', crecheData)
  afficherErreur('creches : erreur', crecheError)
}

main()
  .catch((error) => {
    console.error('\nErreur fatale (exception JS, pas Supabase) :', error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
