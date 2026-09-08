import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string
  value: string
  onChange: (valeur: string) => void
  autoComplete?: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-xl border border-line bg-surface px-4 pr-12 text-lg text-ink outline-none focus:border-pin focus:ring-2 focus:ring-pin-soft"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition active:bg-cream"
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}
