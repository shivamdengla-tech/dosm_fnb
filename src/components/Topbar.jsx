import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME } from '../constants'

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  )
}

export default function Topbar({ onMenu }) {
  const { profile, signOut } = useAuth()
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="text-muted md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink sm:text-base">
          {APP_NAME}
        </p>
        <p className="hidden text-xs text-muted sm:block">{today}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
            {initials(profile?.full_name)}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-ink">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs capitalize text-muted">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-black/5 hover:text-red-600"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
