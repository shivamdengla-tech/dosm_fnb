import { Menu, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
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

const TITLES = {
  '/admin': 'Dashboard',
  '/admin/companies': 'All Companies',
  '/admin/allocations': 'Allocations',
  '/admin/team': 'Team',
  '/admin/add-company': 'Add Company',
  '/admin/progress': 'Progress Board',
  '/admin/settings': 'Settings',
  '/dashboard': 'My Dashboard',
  '/dashboard/companies': 'My Companies',
  '/dashboard/add-company': 'Add Company',
  '/dashboard/settings': 'Settings',
}

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.includes('/company/')) return 'Company Detail'
  return APP_NAME
}

export default function Topbar({ onMenu }) {
  const { profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/50 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenu}
        className="text-muted md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <p className="min-w-0 truncate text-base font-bold text-ink sm:text-lg">
        {titleFor(pathname)}
      </p>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-full border border-border bg-white/5 px-3 py-1.5 text-xs font-medium text-muted sm:inline-block">
          {today}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full gradient-accent text-xs font-bold text-white">
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
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-red-400"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
