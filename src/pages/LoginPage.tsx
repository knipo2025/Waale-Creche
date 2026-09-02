import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
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
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">
          Waale Crèche
        </h1>
        <p className="mb-8 text-center text-base text-slate-500">
          Connectez-vous à votre espace
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
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
              className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
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
              className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-14 rounded-xl bg-emerald-600 text-lg font-semibold text-white transition active:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
