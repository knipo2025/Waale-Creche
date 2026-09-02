import { avatarClasses } from '../lib/avatarColors'

export default function Avatar({ prenom, nom }: { prenom: string; nom: string }) {
  const initiale = (prenom[0] ?? nom[0] ?? '?').toUpperCase()
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${avatarClasses(prenom + nom)}`}
      aria-hidden="true"
    >
      {initiale}
    </div>
  )
}
