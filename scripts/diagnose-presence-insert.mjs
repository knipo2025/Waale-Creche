#!/usr/bin/env node
// Diagnostic ponctuel : reproduit exactement l'insertion faite par
// PresencesPage.tsx / upsertPresence() (src/lib/presences.ts), avec la clé
// anon + une session utilisateur réelle, et affiche l'erreur Supabase complète.
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-presence-insert.mjs

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

  const { data: enfants, error: enfantsError } = await supabase
    .from('enfants')
    .select('id, nom, prenom')
    .eq('creche_id', profileData.creche_id)
    .limit(1)
  if (enfantsError || !enfants || enfants.length === 0) {
    console.error("Aucun enfant trouvé pour cette crèche — impossible de tester (presences.enfant_id est requis). Ajoutez un enfant d'abord.")
    if (enfantsError) afficherErreur('enfants', enfantsError)
    process.exit(1)
  }
  const enfant = enfants[0]
  console.log(`Enfant de test : ${enfant.prenom} ${enfant.nom} (${enfant.id})`)

  // Payload strictement identique à ce que PresencesPage.tsx envoie via
  // upsertPresence() pour un pointage "présent" avec heure d'arrivée.
  const payload = {
    creche_id: profileData.creche_id,
    enfant_id: enfant.id,
    date: '2000-01-01', // date arbitraire hors du jour réel, pour ne pas polluer le pointage du jour
    statut: 'Présent',
    heure_arrivee: '08:00',
    heure_depart: null,
    repas: false,
  }

  console.log('\nPayload envoyé :', JSON.stringify(payload, null, 2))

  const { data: upserted, error: upsertError, status } = await supabase
    .from('presences')
    .upsert(payload, { onConflict: 'enfant_id,date' })
    .select('id, creche_id, enfant_id, date, statut, heure_arrivee, heure_depart, repas')
    .single()

  console.log(`\n--- upsert presences (status HTTP ${status}) ---`)
  console.log('data :', upserted)
  afficherErreur('upsert presences : erreur', upsertError)

  if (upserted?.id) {
    const { error: deleteError } = await supabase.from('presences').delete().eq('id', upserted.id)
    console.log(
      deleteError
        ? `\n(nettoyage échoué, supprimez manuellement la présence ${upserted.id} : ${deleteError.message})`
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
