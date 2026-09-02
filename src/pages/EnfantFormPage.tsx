import { ArrowLeft } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Banner from '../components/Banner'
import { PleinEcranLoading } from '../components/Loading'
import { useAuth } from '../contexts/AuthContext'
import { createEnfant, getEnfant, updateEnfant } from '../lib/enfants'
import { todayIso } from '../lib/format'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerTarifMensuel,
  formatFCFA,
  SERVICE_LABELS,
} from '../lib/tariffs'
import type { EnfantFormValues, Service, Sexe, Statut } from '../types/enfant'

function valeursVides(): EnfantFormValues {
  return {
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'F',
    service: 'journee_complete',
    option_repas: false,
    option_garderie: false,
    statut: 'Inscrit',
    date_inscription: todayIso(),
    allergies: '',
    medecin_nom: '',
    medecin_telephone: '',
    parent1_nom: '',
    parent1_prenom: '',
    parent1_telephone: '',
    parent1_email: '',
    parent1_adresse: '',
    parent2_nom: '',
    parent2_prenom: '',
    parent2_telephone: '',
    parent2_email: '',
    parent2_adresse: '',
  }
}

function videVersNull(valeur: string): string | null {
  const t = valeur.trim()
  return t === '' ? null : t
}

const inputClass =
  'h-14 w-full rounded-xl border border-brume bg-white px-4 text-base text-encre outline-none focus:border-pin-600 focus:ring-2 focus:ring-pin-100'
const labelClass = 'text-sm font-medium text-ardoise'

function Champ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-brume bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ardoise">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export default function EnfantFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdition = Boolean(id)
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [valeurs, setValeurs] = useState<EnfantFormValues>(valeursVides())
  const [loading, setLoading] = useState(isEdition)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    getEnfant(id)
      .then((enfant) => {
        if (!isMounted) return
        const { id: _id, creche_id: _crecheId, created_at: _createdAt, updated_at: _updatedAt, ...rest } = enfant
        setValeurs({
          ...rest,
          allergies: rest.allergies ?? '',
          medecin_nom: rest.medecin_nom ?? '',
          medecin_telephone: rest.medecin_telephone ?? '',
          parent1_email: rest.parent1_email ?? '',
          parent1_adresse: rest.parent1_adresse ?? '',
          parent2_nom: rest.parent2_nom ?? '',
          parent2_prenom: rest.parent2_prenom ?? '',
          parent2_telephone: rest.parent2_telephone ?? '',
          parent2_email: rest.parent2_email ?? '',
          parent2_adresse: rest.parent2_adresse ?? '',
        })
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger l'enfant.",
          )
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [id])

  function setChamp<K extends keyof EnfantFormValues>(
    champ: K,
    valeur: EnfantFormValues[K],
  ) {
    setValeurs((precedent) => ({ ...precedent, [champ]: valeur }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile?.creche_id) return
    setSubmitting(true)
    setError(null)

    const payload: EnfantFormValues = {
      ...valeurs,
      allergies: videVersNull(valeurs.allergies ?? ''),
      medecin_nom: videVersNull(valeurs.medecin_nom ?? ''),
      medecin_telephone: videVersNull(valeurs.medecin_telephone ?? ''),
      parent1_email: videVersNull(valeurs.parent1_email ?? ''),
      parent1_adresse: videVersNull(valeurs.parent1_adresse ?? ''),
      parent2_nom: videVersNull(valeurs.parent2_nom ?? ''),
      parent2_prenom: videVersNull(valeurs.parent2_prenom ?? ''),
      parent2_telephone: videVersNull(valeurs.parent2_telephone ?? ''),
      parent2_email: videVersNull(valeurs.parent2_email ?? ''),
      parent2_adresse: videVersNull(valeurs.parent2_adresse ?? ''),
    }

    try {
      const enfant =
        isEdition && id
          ? await updateEnfant(id, payload)
          : await createEnfant(payload, profile.creche_id)
      navigate(`/enfants/${enfant.id}`, {
        state: {
          succes: isEdition
            ? 'Modifications enregistrées.'
            : 'Enfant enregistré avec succès.',
        },
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'enfant.",
      )
      setSubmitting(false)
    }
  }

  const ageEnMois =
    valeurs.date_naissance.length === 10
      ? calculerAgeEnMois(valeurs.date_naissance)
      : null
  const groupe = ageEnMois !== null ? calculerGroupe(ageEnMois) : null
  const tarifMensuel = groupe
    ? calculerTarifMensuel(
        groupe,
        valeurs.service,
        valeurs.option_repas,
        valeurs.option_garderie,
      )
    : null

  if (loading) {
    return <PleinEcranLoading />
  }

  return (
    <div className="min-h-screen bg-papier pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-brume bg-white px-4 py-4">
        <Link
          to={isEdition && id ? `/enfants/${id}` : '/enfants'}
          aria-label="Retour"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-ardoise transition active:bg-neutre-50"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg font-bold text-encre">
          {isEdition ? "Modifier l'enfant" : 'Nouvel enfant'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
        {groupe && tarifMensuel !== null && (
          <div className="rounded-card border border-pin-100 bg-pin-50 p-4">
            <p className="text-sm text-pin-700">
              Âge : <span className="font-semibold">{ageEnMois} mois</span> · Groupe :{' '}
              <span className="font-semibold">{groupe}</span>
            </p>
            <p className="text-sm text-pin-700">
              Tarif mensuel :{' '}
              <span className="font-semibold tabular-nums">{formatFCFA(tarifMensuel)}</span>
            </p>
          </div>
        )}

        {error && <Banner tone="critique">{error}</Banner>}

        <Section title="Identité">
          <Champ label="Nom">
            <input
              required
              className={inputClass}
              value={valeurs.nom}
              onChange={(e) => setChamp('nom', e.target.value)}
            />
          </Champ>
          <Champ label="Prénom">
            <input
              required
              className={inputClass}
              value={valeurs.prenom}
              onChange={(e) => setChamp('prenom', e.target.value)}
            />
          </Champ>
          <Champ label="Date de naissance">
            <input
              required
              type="date"
              max={todayIso()}
              className={inputClass}
              value={valeurs.date_naissance}
              onChange={(e) => setChamp('date_naissance', e.target.value)}
            />
          </Champ>
          <Champ label="Sexe">
            <select
              className={inputClass}
              value={valeurs.sexe}
              onChange={(e) => setChamp('sexe', e.target.value as Sexe)}
            >
              <option value="F">Féminin</option>
              <option value="M">Masculin</option>
            </select>
          </Champ>
        </Section>

        <Section title="Accueil">
          <Champ label="Service">
            <select
              className={inputClass}
              value={valeurs.service}
              onChange={(e) => setChamp('service', e.target.value as Service)}
            >
              {Object.entries(SERVICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Champ>

          <label className="flex min-h-14 items-center justify-between rounded-xl border border-brume bg-white px-4">
            <span className={labelClass}>Option repas (+ 8 000 FCFA)</span>
            <input
              type="checkbox"
              className="h-6 w-6 accent-pin-600"
              checked={valeurs.option_repas}
              onChange={(e) => setChamp('option_repas', e.target.checked)}
            />
          </label>

          <label className="flex min-h-14 items-center justify-between rounded-xl border border-brume bg-white px-4">
            <span className={labelClass}>Option garderie soir (+ 10 000 FCFA)</span>
            <input
              type="checkbox"
              className="h-6 w-6 accent-pin-600"
              checked={valeurs.option_garderie}
              onChange={(e) => setChamp('option_garderie', e.target.checked)}
            />
          </label>

          <Champ label="Statut">
            <select
              className={inputClass}
              value={valeurs.statut}
              onChange={(e) => setChamp('statut', e.target.value as Statut)}
            >
              <option value="Inscrit">Inscrit</option>
              <option value="En attente">En attente</option>
              <option value="Sorti">Sorti</option>
            </select>
          </Champ>

          <Champ label="Date d'inscription">
            <input
              required
              type="date"
              max={todayIso()}
              className={inputClass}
              value={valeurs.date_inscription}
              onChange={(e) => setChamp('date_inscription', e.target.value)}
            />
          </Champ>
        </Section>

        <Section title="Santé">
          <Champ label="Allergies">
            <textarea
              className={`${inputClass} h-24 py-3`}
              value={valeurs.allergies ?? ''}
              onChange={(e) => setChamp('allergies', e.target.value)}
            />
          </Champ>
          <Champ label="Médecin — nom">
            <input
              className={inputClass}
              value={valeurs.medecin_nom ?? ''}
              onChange={(e) => setChamp('medecin_nom', e.target.value)}
            />
          </Champ>
          <Champ label="Médecin — téléphone">
            <input
              type="tel"
              className={inputClass}
              value={valeurs.medecin_telephone ?? ''}
              onChange={(e) => setChamp('medecin_telephone', e.target.value)}
            />
          </Champ>
        </Section>

        <Section title="Parent 1">
          <Champ label="Nom">
            <input
              required
              className={inputClass}
              value={valeurs.parent1_nom}
              onChange={(e) => setChamp('parent1_nom', e.target.value)}
            />
          </Champ>
          <Champ label="Prénom">
            <input
              required
              className={inputClass}
              value={valeurs.parent1_prenom}
              onChange={(e) => setChamp('parent1_prenom', e.target.value)}
            />
          </Champ>
          <Champ label="Téléphone">
            <input
              required
              type="tel"
              className={inputClass}
              value={valeurs.parent1_telephone}
              onChange={(e) => setChamp('parent1_telephone', e.target.value)}
            />
          </Champ>
          <Champ label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={valeurs.parent1_email ?? ''}
              onChange={(e) => setChamp('parent1_email', e.target.value)}
            />
          </Champ>
          <Champ label="Adresse">
            <input
              className={inputClass}
              value={valeurs.parent1_adresse ?? ''}
              onChange={(e) => setChamp('parent1_adresse', e.target.value)}
            />
          </Champ>
        </Section>

        <Section title="Parent 2 (optionnel)">
          <Champ label="Nom">
            <input
              className={inputClass}
              value={valeurs.parent2_nom ?? ''}
              onChange={(e) => setChamp('parent2_nom', e.target.value)}
            />
          </Champ>
          <Champ label="Prénom">
            <input
              className={inputClass}
              value={valeurs.parent2_prenom ?? ''}
              onChange={(e) => setChamp('parent2_prenom', e.target.value)}
            />
          </Champ>
          <Champ label="Téléphone">
            <input
              type="tel"
              className={inputClass}
              value={valeurs.parent2_telephone ?? ''}
              onChange={(e) => setChamp('parent2_telephone', e.target.value)}
            />
          </Champ>
          <Champ label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={valeurs.parent2_email ?? ''}
              onChange={(e) => setChamp('parent2_email', e.target.value)}
            />
          </Champ>
          <Champ label="Adresse">
            <input
              className={inputClass}
              value={valeurs.parent2_adresse ?? ''}
              onChange={(e) => setChamp('parent2_adresse', e.target.value)}
            />
          </Champ>
        </Section>

        <button
          type="submit"
          disabled={submitting}
          className="h-14 rounded-xl bg-pin-600 text-lg font-semibold text-white transition active:bg-pin-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
