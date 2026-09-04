import { LogOut, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from './BottomNav'

export default function AppLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-wa-line bg-wa-surface px-4 py-4">
        <div>
          <h1 className="font-heading text-lg font-bold text-wa-ink">{title}</h1>
          {profile?.full_name && (
            <p className="text-sm text-wa-muted">{profile.full_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/parametres"
            aria-label="Paramètres"
            className="flex h-12 w-12 items-center justify-center rounded-xl text-wa-muted transition active:bg-wa-line"
          >
            <Settings size={20} />
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Se déconnecter"
            className="flex h-12 w-12 items-center justify-center rounded-xl text-wa-muted transition active:bg-wa-line"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      <BottomNav />
    </div>
  )
}
