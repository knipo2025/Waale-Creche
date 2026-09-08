// Rotation de 6 dégradés chauds (WAALE-DESIGN.md) pour les avatars à initiales.
const PALETTES = [
  'bg-gradient-to-br from-terra to-amber',
  'bg-gradient-to-br from-amber to-terra',
  'bg-gradient-to-br from-[#E17A8D] to-terra',
  'bg-gradient-to-br from-[#E8A33D] to-amber',
  'bg-gradient-to-br from-[#F08A5D] to-[#E0708A]',
  'bg-gradient-to-br from-[#C97B4A] to-amber',
]

/** Dégradé stable par identité (basé sur le nom), jamais sur le rang/l'ordre. */
export function avatarClasses(cle: string): string {
  let hash = 0
  for (let i = 0; i < cle.length; i++) hash = (hash * 31 + cle.charCodeAt(i)) >>> 0
  return PALETTES[hash % PALETTES.length]
}
