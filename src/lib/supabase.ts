import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Signalé (au lieu d'un `throw` au niveau du module) pour que l'absence de
 * configuration ne dépende pas d'un `if` statiquement faux : un tel `throw`
 * inconditionnel est repérable par les optimiseurs de production (esbuild/
 * Rollup), qui peuvent alors considérer tout le code exécuté après comme
 * mort et l'éliminer du bundle — y compris le reste de l'application.
 */
export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Configuration manquante : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies (fichier .env, ou variables d'environnement Netlify)."
    : null

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-anon-key',
)
