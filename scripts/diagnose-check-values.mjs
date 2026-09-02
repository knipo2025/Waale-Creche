#!/usr/bin/env node
// Diagnostic ponctuel : trouve les valeurs réellement acceptées par une
// contrainte CHECK en testant plusieurs candidats (PostgREST n'expose pas la
// définition des contraintes via l'API REST). Insère puis supprime
// immédiatement chaque ligne de test.
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-check-values.mjs \
//     <table> <colonne> <val1> <val2> ...

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

const [table, colonne, ...candidats] = process.argv.slice(2)
if (!table || !colonne || candidats.length === 0) {
  console.error('Usage : node scripts/diagnose-check-values.mjs <table> <colonne> <val1> <val2> ...')
  process.exit(1)
}

const BASE_PAYLOAD = {
  enfants: {
    nom: 'TEST_DIAGNOSTIC',
    prenom: 'Script',
    date_naissance: '2024-01-15',
    sexe: 'F',
    service: 'journee_complete',
    option_repas: false,
    option_garderie: false,
    statut: 'Inscrit',
    date_inscription: '2025-09-01',
    parent1_nom: 'TestNom',
    parent1_prenom: 'TestPrenom',
    parent1_telephone: '+225 00 00 00 00',
  },
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })

  const { data: profileData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('creche_id')
    .eq('id', profileData.user.id)
    .single()

  const base = { ...(BASE_PAYLOAD[table] ?? {}), creche_id: profile.creche_id }

  const accepted = []
  for (const candidat of candidats) {
    const payload = { ...base, [colonne]: candidat }
    const { data, error } = await supabase.from(table).insert(payload).select('id').single()

    if (error) {
      console.log(`REJETÉ  ${colonne} = "${candidat}"  (${error.code} : ${error.message})`)
    } else {
      console.log(`ACCEPTÉ ${colonne} = "${candidat}"`)
      accepted.push(candidat)
      await supabase.from(table).delete().eq('id', data.id)
    }
  }

  console.log(`\nValeurs acceptées pour ${table}.${colonne} :`, accepted)
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0))
