import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { APP_NAME } from '../constants'

/**
 * Icon-only rail that expands on hover (desktop) and becomes a slide-in
 * drawer (mobile). `navItems` = [{ to, label, icon: LucideIcon, end }].
 */
export default function Sidebar({ navItems, open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`group fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden border-r border-border bg-surface
          transition-[width,transform] duration-200 ease-out
          md:w-16 md:translate-x-0 md:hover:w-64 md:hover:shadow-card
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-4 shrink-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-white">
            D
          </span>
          <span className="whitespace-nowrap text-base font-bold text-ink transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
                `flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-black/[0.04] hover:text-ink'
                }`
              }
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center">
                <Icon size={19} />
              </span>
              <span className="whitespace-nowrap transition-opacity md:opacity-0 md:group-hover:opacity-100">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
