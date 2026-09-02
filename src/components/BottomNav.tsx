import { Baby, CalendarCheck, LayoutDashboard, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/enfants', label: 'Enfants', icon: Baby },
  { to: '/paiements', label: 'Paiements', icon: Wallet },
  { to: '/presences', label: 'Présences', icon: CalendarCheck },
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-brume bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition active:bg-neutre-50 ${
                  isActive ? 'text-pin-600' : 'text-ardoise'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      isActive ? 'bg-pin-50' : ''
                    }`}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <span className="text-center leading-tight">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
