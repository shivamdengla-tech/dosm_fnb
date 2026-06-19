import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'
import BottomNav from './BottomNav'
import CommandPalette from './CommandPalette'

/**
 * App shell: hover-expand sidebar + topbar + routed content + footer.
 * Used by both admin and member areas with different `navItems`.
 * `bottomNav` enables the mobile tab bar (members) — needs ≤4 items.
 * `commandPalette` enables the ⌘K / Ctrl+K palette (admin).
 */
export default function Layout({ navItems, bottomNav = false, commandPalette = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    if (!commandPalette) return
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandPalette])

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        navItems={navItems}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Content reserves the collapsed-rail width on desktop, and is pushed
          further right (never overlaid) while the sidebar is hover-expanded. */}
      <div className="flex min-h-screen flex-col transition-[padding] duration-200 ease-out md:pl-16 md:peer-hover:pl-[220px]">
        <Topbar
          onMenu={() => setMenuOpen(true)}
          onCommand={commandPalette ? () => setPaletteOpen(true) : undefined}
        />
        <main className={`flex-1 px-4 py-6 sm:px-6 lg:px-8 ${bottomNav ? 'pb-24 md:pb-6' : ''}`}>
          <Outlet />
        </main>
        <Footer />
      </div>

      {bottomNav && <BottomNav items={navItems} />}
      {commandPalette && paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  )
}
