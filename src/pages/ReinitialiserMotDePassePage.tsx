import { KeyRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Banner from '../components/Banner'
import { PleinEcranLoading } from '../components/Loading'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ReinitialiserMotDePassePage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    if (!succes) return
    const timeout = setTimeout(() => navigate('/tableau-de-bord', { replace: true }), 1500)
    return () => clearTimeout(timeout)
  }, [succes, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreur(null)

    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    setSubmitting(false)

    if (error) {
      setErreur(error.message)
      return
    }
    setSucces(true)
  }

  if (loading) {
    return <PleinEcranLoading />
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-papier px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wa-green-50 text-wa-green-700">
          <KeyRound size={28} />
        </div>
        <h1 className="mb-1 text-center font-heading text-2xl font-bold text-wa-ink">
          Nouveau mot de passe
        </h1>

        {!session ? (
          <>
            <p className="mb-8 mt-4 text-center text-base text-wa-muted">
              Ce lien n'est plus valide ou a déjà été utilisé. Demandez-en un
              nouveau depuis l'écran de connexion.
            </p>
            <Link
              to="/login"
              className="flex h-14 items-center justify-center rounded-xl bg-wa-green-600 text-lg font-semibold text-white transition active:bg-wa-green-700"
            >
              Retour à la connexion
            </Link>
          </>
        ) : succes ? (
          <div className="mt-6">
            <Banner tone="succes">Mot de passe mis à jour. Redirection…</Banner>
          </div>
        ) : (
          <>
            <p className="mb-8 text-center text-base text-wa-muted">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nouveau" className="text-sm font-medium text-wa-ink">
                  Nouveau mot de passe
                </label>
                <PasswordInput
                  id="nouveau"
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={setMotDePasse}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirmation" className="text-sm font-medium text-wa-ink">
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  id="confirmation"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={setConfirmation}
                  placeholder="••••••••"
                />
              </div>

              {erreur && (
                <div role="alert">
                  <Banner tone="critique">{erreur}</Banner>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 h-14 rounded-xl bg-wa-green-600 text-lg font-semibold text-white transition active:bg-wa-green-700 disabled:opacity-60"
              >
                {submitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
