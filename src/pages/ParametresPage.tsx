import { type FormEvent, useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { updateCreche } from '../lib/creches'
import type { CrecheFormValues } from '../types/creche'

const inputClass =
  'h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
const labelClass = 'text-sm font-medium text-slate-700'

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function valeursDepuisCreche(creche: {
  nom: string
  adresse: string | null
  telephone: string | null
  capacite: number
  objectif_remplissage: number
  seuil_impaye_enfant: number
  seuil_impaye_taux: number
}): CrecheFormValues {
  return {
    nom: creche.nom,
    adresse: creche.adresse ?? '',
    telephone: creche.telephone ?? '',
    capacite: creche.capacite,
    objectif_remplissage: creche.objectif_remplissage,
    seuil_impaye_enfant: creche.seuil_impaye_enfant,
    seuil_impaye_taux: creche.seuil_impaye_taux,
  }
}

export default function ParametresPage() {
  const { creche, refreshCreche } = useAuth()
  const [valeurs, setValeurs] = useState<CrecheFormValues | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    if (creche) setValeurs(valeursDepuisCreche(creche))
  }, [creche])

  function setChamp<K extends keyof CrecheFormValues>(
    champ: K,
    valeur: CrecheFormValues[K],
  ) {
    setValeurs((precedent) => (precedent ? { ...precedent, [champ]: valeur } : precedent))
    setSucces(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!creche || !valeurs) return
    setSubmitting(true)
    setError(null)
    setSucces(false)

    try {
      await updateCreche(creche.id, {
        ...valeurs,
        adresse: valeurs.adresse?.trim() || null,
        telephone: valeurs.telephone?.trim() || null,
      })
      await refreshCreche()
      setSucces(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d\'enregistrer les paramètres.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!creche || !valeurs) {
    return (
      <AppLayout title="Paramètres">
        <p className="text-center text-slate-500">
          Aucune crèche configurée. Créez-en une depuis le SQL Editor de Supabase
          (voir schema.sql), puis revenez sur cet écran.
        </p>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Paramètres">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {succes && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Paramètres enregistrés.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Section title="Crèche">
          <Champ label="Nom">
            <input
              required
              className={inputClass}
              value={valeurs.nom}
              onChange={(e) => setChamp('nom', e.target.value)}
            />
          </Champ>
          <Champ label="Adresse">
            <input
              className={inputClass}
              value={valeurs.adresse ?? ''}
              onChange={(e) => setChamp('adresse', e.target.value)}
            />
          </Champ>
          <Champ label="Téléphone">
            <input
              type="tel"
              className={inputClass}
              value={valeurs.telephone ?? ''}
              onChange={(e) => setChamp('telephone', e.target.value)}
            />
          </Champ>
        </Section>

        <Section title="Tableau de bord">
          <Champ label="Capacité d'accueil (nombre de places)">
            <input
              required
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={valeurs.capacite}
              onChange={(e) => setChamp('capacite', Number(e.target.value))}
            />
          </Champ>
          <Champ label="Objectif de taux de remplissage (%)">
            <input
              required
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={valeurs.objectif_remplissage}
              onChange={(e) => setChamp('objectif_remplissage', Number(e.target.value))}
            />
          </Champ>
          <Champ label="Seuil d'alerte impayé par enfant (FCFA)">
            <input
              required
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              className={inputClass}
              value={valeurs.seuil_impaye_enfant}
              onChange={(e) => setChamp('seuil_impaye_enfant', Number(e.target.value))}
            />
          </Champ>
          <Champ label="Seuil d'alerte impayés globaux (% du CA mensuel attendu)">
            <input
              required
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={valeurs.seuil_impaye_taux}
              onChange={(e) => setChamp('seuil_impaye_taux', Number(e.target.value))}
            />
          </Champ>
        </Section>

        <button
          type="submit"
          disabled={submitting}
          className="h-14 rounded-xl bg-emerald-600 text-lg font-semibold text-white transition active:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </AppLayout>
  )
}
