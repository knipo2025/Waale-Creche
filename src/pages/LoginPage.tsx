import { ArrowLeft, Baby } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Banner from '../components/Banner'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { session, signIn, resetPassword } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [modeOubli, setModeOubli] = useState(false)
  const [emailOubli, setEmailOubli] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreurOubli, setErreurOubli] = useState<string | null>(null)
  const [lienEnvoye, setLienEnvoye] = useState(false)

  if (session) {
    const redirectTo =
      (location.state as { from?: string } | null)?.from ?? '/tableau-de-bord'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
    }
  }

  async function handleSubmitOubli(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurOubli(null)
    setEnvoiEnCours(true)
    const { error: resetError } = await resetPassword(emailOubli)
    setEnvoiEnCours(false)
    if (resetError) {
      setErreurOubli(resetError)
    } else {
      setLienEnvoye(true)
    }
  }

  if (modeOubli) {
    return (
      <main className="flex min-h-screen flex-col justify-center bg-cream px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <button
            type="button"
            onClick={() => {
              setModeOubli(false)
              setLienEnvoye(false)
              setErreurOubli(null)
            }}
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition active:bg-cream"
            aria-label="Retour à la connexion"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="mb-1 font-heading text-2xl font-bold text-ink">
            Mot de passe oublié
          </h1>
          <p className="mb-8 text-base text-muted">
            Indiquez votre e-mail, nous vous envoyons un lien pour choisir un
            nouveau mot de passe.
          </p>

          {lienEnvoye ? (
            <Banner tone="succes">
              Si un compte existe pour cette adresse, un e-mail avec un lien
              de réinitialisation vient d'être envoyé.
            </Banner>
          ) : (
            <form onSubmit={handleSubmitOubli} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email-oubli" className="text-sm font-semibold text-ink">
                  Adresse e-mail
                </label>
                <input
                  id="email-oubli"
                  type="email"
                  autoComplete="email"
                  required
                  value={emailOubli}
                  onChange={(event) => setEmailOubli(event.target.value)}
                  className="h-14 rounded-xl border border-line bg-surface px-4 text-lg text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft"
                  placeholder="vous@exemple.com"
                />
              </div>

              {erreurOubli && (
                <div role="alert">
                  <Banner tone="critique">{erreurOubli}</Banner>
                </div>
              )}

              <button
                type="submit"
                disabled={envoiEnCours}
                className="mt-2 h-14 w-full rounded-full bg-terra text-lg font-semibold text-white transition active:brightness-90 disabled:opacity-60"
              >
                {envoiEnCours ? 'Envoi en cours…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber text-white">
          <Baby size={30} strokeWidth={2.2} />
        </div>
        <h1 className="mb-1 text-center font-heading text-2xl font-bold text-ink">
          Waale Crèche
        </h1>
        <p className="mb-8 text-center text-base text-muted">
          Connectez-vous à votre espace
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-ink"
            >
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-14 rounded-xl border border-line bg-surface px-4 text-lg text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-ink"
              >
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => {
                  setEmailOubli(email)
                  setModeOubli(true)
                }}
                className="text-sm font-semibold text-pin"
              >
                Oublié ?
              </button>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert">
              <Banner tone="critique">{error}</Banner>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-14 w-full rounded-full bg-terra text-lg font-semibold text-white transition active:brightness-90 disabled:opacity-60"
          >
            {submitting ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
