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

    async function loadProfileFor(userId: string) {
      try {
        const nextProfile = await fetchProfile(userId)
        if (isMounted) {
          setProfile(nextProfile)
          setProfileError(null)
        }
        const nextCreche = await fetchCreche(nextProfile.creche_id)
        if (isMounted) setCreche(nextCreche)
      } catch (error) {
        if (isMounted) {
          setProfile(null)
          setCreche(null)
          setProfileError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger le profil.',
          )
        }
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      if (data.session?.user) {
        await loadProfileFor(data.session.user.id)
      }
      if (isMounted) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return
        setSession(nextSession)
        if (nextSession?.user) {
          await loadProfileFor(nextSession.user.id)
        } else {
          setProfile(null)
          setCreche(null)
          setProfileError(null)
        }
        setLoading(false)
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
