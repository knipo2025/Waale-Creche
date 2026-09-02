#!/usr/bin/env node
// Diagnostic ponctuel : teste colonne par colonne quelles colonnes existent
// réellement sur une table (PostgREST n'expose pas information_schema, donc
// impossible de lister les colonnes en une seule requête). Chaque colonne est
// testée via un .select(colonne).limit(1) isolé : PostgREST valide l'existence
// de la colonne avant de regarder les lignes, donc ça fonctionne même sur une
// table vide, sans dépendre de RLS pour la lecture des données elles-mêmes.
//
// Usage :
//   DIAG_EMAIL=... DIAG_PASSWORD=... node scripts/diagnose-table-columns.mjs <table> <col1> <col2> ...

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

const [table, ...colonnes] = process.argv.slice(2)
if (!table || colonnes.length === 0) {
  console.error('Usage : node scripts/diagnose-table-columns.mjs <table> <col1> <col2> ...')
  process.exit(1)
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })

  const manquantes = []
  for (const colonne of colonnes) {
    const { error } = await supabase.from(table).select(colonne).limit(1)
    const existe = !error || !['PGRST204', '42703'].includes(error.code)
    if (!existe) manquantes.push(colonne)
    console.log(`${existe ? 'OK ' : 'ABSENTE'}  ${colonne}${error && existe ? `  (autre erreur : ${error.message})` : ''}`)
  }

  console.log(`\n${manquantes.length} colonne(s) manquante(s) sur ${table} :`, manquantes)
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0))
