import { Building2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import { Champ, inputClass, Section } from '../components/FormField'
import { useAuth } from '../contexts/AuthContext'
import { updateCreche } from '../lib/creches'
import type { CrecheFormValues } from '../types/creche'

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
        <EmptyState
          icon={Building2}
          titre="Aucune crèche configurée"
          description="Créez-en une depuis le SQL Editor de Supabase (voir schema.sql), puis revenez sur cet écran."
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Paramètres">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {succes && <Banner tone="succes">Paramètres enregistrés.</Banner>}
        {error && <Banner tone="critique">{error}</Banner>}

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
          className="h-14 rounded-full bg-terra text-lg font-semibold text-white transition active:brightness-90 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </AppLayout>
  )
}
