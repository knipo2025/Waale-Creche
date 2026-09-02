import { ArrowLeft, MessageCircle, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getEnfant, listEnfants, totalPaiementsRecus } from '../lib/enfants'
import {
  calculerAgeEnMois,
  calculerGroupe,
  calculerSoldeImpaye,
  calculerTarifMensuel,
  formatFCFA,
  SERVICE_LABELS,
} from '../lib/tariffs'
import { construireLienRelanceWhatsapp } from '../lib/whatsapp'
import type { Enfant } from '../types/enfant'

const STATUT_LABELS: Record<string, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_attente: 'En attente',
}

function Champ({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-base text-slate-900">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function EnfantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile, creche } = useAuth()
  const navigate = useNavigate()
  const [enfant, setEnfant] = useState<Enfant | null>(null)
  const [totalRecu, setTotalRecu] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !profile?.creche_id) return
    let isMounted = true
    setLoading(true)

    Promise.all([getEnfant(id), listEnfants(profile.creche_id)])
      .then(([enfantData, enfants]) => {
        if (!isMounted) return
        setEnfant(enfantData)
        const enfantAvecPaiements = enfants.find((e) => e.id === id)
        setTotalRecu(
          enfantAvecPaiements ? totalPaiementsRecus(enfantAvecPaiements.paiements) : 0,
        )
        setError(null)
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
  }, [id, profile?.creche_id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Chargement…</p>
      </div>
    )
  }

  if (error || !enfant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6">
        <p className="text-center text-red-700">
          {error ?? 'Enfant introuvable.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/enfants')}
          className="h-12 rounded-xl bg-slate-900 px-6 text-white"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  const ageEnMois = calculerAgeEnMois(enfant.date_naissance)
  const groupe = calculerGroupe(ageEnMois)
  const tarifMensuel = calculerTarifMensuel(
    groupe,
    enfant.service,
    enfant.option_repas,
    enfant.option_garderie,
  )
  const solde = calculerSoldeImpaye(enfant.date_inscription, tarifMensuel, totalRecu)

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
        <Link
          to="/enfants"
          aria-label="Retour"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition active:bg-slate-100"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="truncate text-lg font-bold text-slate-900">
          {enfant.prenom} {enfant.nom}
        </h1>
        <Link
          to={`/enfants/${enfant.id}/modifier`}
          aria-label="Modifier"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition active:bg-slate-100"
        >
          <Pencil size={20} />
        </Link>
      </header>

      <main className="flex flex-col gap-4 px-4 py-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{groupe} · {ageEnMois} mois</p>
              <p className="text-sm text-slate-500">
                {STATUT_LABELS[enfant.statut]} · {SERVICE_LABELS[enfant.service]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Solde impayé</p>
              <p
                className={`text-xl font-bold ${
                  solde > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {formatFCFA(solde)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Tarif mensuel : <span className="font-medium text-slate-900">{formatFCFA(tarifMensuel)}</span>
            {(enfant.option_repas || enfant.option_garderie) && (
              <span className="text-slate-400">
                {' '}
                ({[
                  enfant.option_repas ? 'repas' : null,
                  enfant.option_garderie ? 'garderie soir' : null,
                ]
                  .filter(Boolean)
                  .join(', ')})
              </span>
            )}
          </p>

          {solde > 0 && (
            <a
              href={construireLienRelanceWhatsapp(
                enfant.parent1_telephone,
                enfant,
                solde,
                creche?.nom ?? null,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white transition active:brightness-95"
            >
              <MessageCircle size={20} />
              Relancer sur WhatsApp
            </a>
          )}
        </section>

        <Section title="Informations">
          <Champ label="Date de naissance" value={enfant.date_naissance} />
          <Champ label="Sexe" value={enfant.sexe === 'M' ? 'Masculin' : 'Féminin'} />
          <Champ label="Date d'inscription" value={enfant.date_inscription} />
          <Champ label="Allergies" value={enfant.allergies} />
        </Section>

        {(enfant.medecin_nom || enfant.medecin_telephone) && (
          <Section title="Médecin">
            <Champ label="Nom" value={enfant.medecin_nom} />
            <Champ label="Téléphone" value={enfant.medecin_telephone} />
          </Section>
        )}

        <Section title="Parent 1">
          <Champ
            label="Nom"
            value={`${enfant.parent1_prenom} ${enfant.parent1_nom}`}
          />
          <Champ label="Téléphone" value={enfant.parent1_telephone} />
          <Champ label="E-mail" value={enfant.parent1_email} />
          <Champ label="Adresse" value={enfant.parent1_adresse} />
        </Section>

        {(enfant.parent2_nom || enfant.parent2_telephone) && (
          <Section title="Parent 2">
            <Champ
              label="Nom"
              value={[enfant.parent2_prenom, enfant.parent2_nom]
                .filter(Boolean)
                .join(' ')}
            />
            <Champ label="Téléphone" value={enfant.parent2_telephone} />
            <Champ label="E-mail" value={enfant.parent2_email} />
            <Champ label="Adresse" value={enfant.parent2_adresse} />
          </Section>
        )}
      </main>
    </div>
  )
}
