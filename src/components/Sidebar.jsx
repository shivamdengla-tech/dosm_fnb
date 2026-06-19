import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
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

/**
 * Icon-only rail that expands on hover (desktop) and becomes a slide-in
 * drawer (mobile). `navItems` = [{ to, label, icon: LucideIcon, end }].
 */
export default function Sidebar({ navItems, open, onClose }) {
  const { profile } = useAuth()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`group peer fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col overflow-hidden border-r border-border bg-[#0d1117]
          transition-[width,transform] duration-200 ease-out
          md:w-16 md:translate-x-0 md:hover:w-[220px] md:hover:shadow-glow
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-accent text-sm font-extrabold text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]">
            D
          </span>
          <span className="text-gradient whitespace-nowrap text-base font-extrabold transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {APP_NAME}
          </span>
          <button
            onClick={onClose}
            className="ml-auto text-muted md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-soft text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.35)]'
                    : 'text-muted hover:bg-white/5 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center"
                    style={
                      isActive
                        ? { color: '#818cf8', filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.8))' }
                        : undefined
                    }
                  >
                    <Icon size={19} />
                  </span>
                  <span className="whitespace-nowrap transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info pinned to the bottom */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-1.5 py-1.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-accent text-xs font-bold text-white">
              {initials(profile?.full_name)}
            </span>
            <div className="min-w-0 leading-tight transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <p className="truncate text-sm font-semibold text-ink">
                {profile?.full_name || 'User'}
              </p>
              <p className="truncate text-xs capitalize text-muted">{profile?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
