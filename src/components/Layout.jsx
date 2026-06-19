import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'

/**
 * App shell: hover-expand sidebar + topbar + routed content + footer.
 * Used by both admin and member areas with different `navItems`.
 */
export default function Layout({ navItems }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
