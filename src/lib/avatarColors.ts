const PALETTES = [
  'bg-wa-green-50 text-wa-green-700',
  'bg-school-sky/15 text-school-sky',
  'bg-school-coral/15 text-school-coral',
  'bg-school-sun/15 text-school-sun',
]

/** Couleur stable par identité (basée sur le nom), jamais sur le rang/l'ordre. */
export function avatarClasses(cle: string): string {
  let hash = 0
  for (let i = 0; i < cle.length; i++) hash = (hash * 31 + cle.charCodeAt(i)) >>> 0
  return PALETTES[hash % PALETTES.length]
}
