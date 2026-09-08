import { Baby, CalendarCheck, LayoutDashboard, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/enfants', label: 'Enfants', icon: Baby },
  { to: '/paiements', label: 'Paiements', icon: Wallet },
  { to: '/presences', label: 'Présences', icon: CalendarCheck },
]

export default function Sidebar() {
  return (
    <nav
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface p-4 md:flex"
      aria-label="Navigation principale"
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber font-heading text-sm font-bold text-white">
          W
        </div>
        <span className="font-heading text-lg font-bold text-ink">Waale</span>
      </div>

      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
              isActive ? 'bg-pin-soft text-pin-ink' : 'text-muted hover:bg-cream'
            }`
          }
        >
          <Icon size={20} strokeWidth={2.2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
