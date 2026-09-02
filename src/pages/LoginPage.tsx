import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Banner from '../components/Banner'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { session, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <main className="flex min-h-screen flex-col justify-center bg-papier px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-encre">
          Waale Crèche
        </h1>
        <p className="mb-8 text-center text-base text-ardoise">
          Connectez-vous à votre espace
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-encre"
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
              className="h-14 rounded-xl border border-brume bg-white px-4 text-lg text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-encre"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 rounded-xl border border-brume bg-white px-4 text-lg text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100"
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
            className="mt-2 h-14 rounded-xl bg-pin-600 text-lg font-semibold text-white transition active:bg-pin-700 disabled:opacity-60"
          >
            {submitting ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
