const PALETTES = [
  'bg-pin-50 text-pin-700',
  'bg-terracotta-100 text-terracotta-600',
  'bg-succes-50 text-succes-700',
  'bg-attention-50 text-attention-600',
]

/** Couleur stable par identité (basée sur le nom), jamais sur le rang/l'ordre. */
export function avatarClasses(cle: string): string {
  let hash = 0
  for (let i = 0; i < cle.length; i++) hash = (hash * 31 + cle.charCodeAt(i)) >>> 0
  return PALETTES[hash % PALETTES.length]
}
