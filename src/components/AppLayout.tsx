import { LogOut, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

function initialesEcole(nom: string | undefined): string {
  if (!nom) return 'W'
  const mots = nom.trim().split(/\s+/).slice(0, 2)
  return mots.map((mot) => mot[0]?.toUpperCase() ?? '').join('') || 'W'
}

export default function AppLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { profile, creche, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-pin to-pin-ink px-4 py-4 text-white">
          <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber font-heading text-base font-bold text-white">
                {initialesEcole(creche?.nom)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-bold leading-tight">
                  {creche?.nom ?? 'Waale Crèche'}
                </p>
                <p className="truncate text-xs text-white/80">
                  {title}
                  {profile?.full_name ? ` · ${profile.full_name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                to="/parametres"
                aria-label="Paramètres"
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white/90 transition active:bg-white/15"
              >
                <Settings size={20} strokeWidth={2.2} />
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Se déconnecter"
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white/90 transition active:bg-white/15"
              >
                <LogOut size={22} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
