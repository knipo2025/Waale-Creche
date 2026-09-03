import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Creche } from '../types/creche'
import type { Profile } from '../types/profile'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  creche: Creche | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshCreche: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, creche_id, full_name, email')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data as Profile
}

async function fetchCreche(crecheId: string): Promise<Creche | null> {
  const { data, error } = await supabase
    .from('creches')
    .select(
      'id, nom, adresse, telephone, capacite, objectif_remplissage, seuil_impaye_enfant, seuil_impaye_taux',
    )
    .eq('id', crecheId)
    .maybeSingle()

  if (error) return null
  return data as Creche | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creche, setCreche] = useState<Creche | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    // Incrémenté à chaque changement de session ; une requête de profil en
    // vol dont l'id ne correspond plus à la dernière requête est ignorée à
    // sa résolution (évite qu'une réponse tardive n'écrase un état plus
    // récent, par ex. après une déconnexion pendant que le profil chargeait).
    let derniereRequeteId = 0

    async function loadProfileFor(userId: string, requeteId: number) {
      try {
        const nextProfile = await fetchProfile(userId)
        if (!isMounted || requeteId !== derniereRequeteId) return
        setProfile(nextProfile)
        setProfileError(null)

        const nextCreche = await fetchCreche(nextProfile.creche_id)
        if (!isMounted || requeteId !== derniereRequeteId) return
        setCreche(nextCreche)
      } catch (error) {
        if (!isMounted || requeteId !== derniereRequeteId) return
        setProfile(null)
        setCreche(null)
        setProfileError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le profil.',
        )
      }
    }

    // onAuthStateChange émet immédiatement l'état courant à l'abonnement
    // (événement INITIAL_SESSION) : pas besoin d'un getSession() séparé au
    // montage, qui ne ferait que déclencher un double chargement du profil.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return
        setSession(nextSession)
        derniereRequeteId += 1
        const requeteId = derniereRequeteId

        if (nextSession?.user) {
          await loadProfileFor(nextSession.user.id, requeteId)
        } else {
          setProfile(null)
          setCreche(null)
          setProfileError(null)
        }
        if (isMounted) setLoading(false)
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshCreche() {
    if (!profile?.creche_id) return
    const nextCreche = await fetchCreche(profile.creche_id)
    setCreche(nextCreche)
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    creche,
    loading,
    profileError,
    signIn,
    signOut,
    refreshCreche,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider')
  }
  return context
}
