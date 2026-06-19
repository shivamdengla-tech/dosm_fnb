import { NavLink } from 'react-router-dom'

/**
 * Mobile-only bottom tab bar (members). Hidden on md+ where the sidebar rail
 * takes over. Tap targets are ≥44px tall for thumb reach.
 */
export default function BottomNav({ items }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-[#0d1117]/95 backdrop-blur-xl md:hidden"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map(({ to, label, short, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-300' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="grid h-6 w-6 place-items-center"
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.8))' }
                    : undefined
                }
              >
                <Icon size={20} />
              </span>
              <span>{short || label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
