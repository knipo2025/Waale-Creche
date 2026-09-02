#!/usr/bin/env node
// Diagnostic ponctuel : reproduit exactement l'insertion faite par
// PaiementFormPage.tsx / createPaiement() (src/lib/paiements.ts), avec la clé
// anon + une session utilisateur réelle, et affiche l'erreur Supabase complète.
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-paiement-insert.mjs

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
    console.error("Aucun enfant trouvé pour cette crèche — impossible de tester (paiements.enfant_id est requis). Ajoutez un enfant d'abord.")
    if (enfantsError) afficherErreur('enfants', enfantsError)
    process.exit(1)
  }
  const enfant = enfants[0]
  console.log(`Enfant de test : ${enfant.prenom} ${enfant.nom} (${enfant.id})`)

  // Payload strictement identique à ce que PaiementFormPage.tsx envoie via
  // createPaiement() : mêmes clés, mêmes valeurs par défaut du formulaire
  // (type=mensualite, mode_paiement=especes, statut=Reçu).
  const payload = {
    creche_id: profileData.creche_id,
    enfant_id: enfant.id,
    type: 'Mensualité',
    mois_concerne: '2025-09',
    montant: 60000,
    mode_paiement: 'especes',
    statut: 'Reçu',
    date_paiement: '2025-09-02',
  }

  console.log('\nPayload envoyé :', JSON.stringify(payload, null, 2))

  const { data: inserted, error: insertError, status } = await supabase
    .from('paiements')
    .insert(payload)
    .select('id, creche_id, enfant_id, type, mois_concerne, montant, mode_paiement, statut, numero_recu, date_paiement')
    .single()

  console.log(`\n--- insert paiements (status HTTP ${status}) ---`)
  console.log('data :', inserted)
  afficherErreur('insert paiements : erreur', insertError)

  if (inserted?.id) {
    const { error: deleteError } = await supabase.from('paiements').delete().eq('id', inserted.id)
    console.log(
      deleteError
        ? `\n(nettoyage échoué, supprimez manuellement le paiement ${inserted.id} : ${deleteError.message})`
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
