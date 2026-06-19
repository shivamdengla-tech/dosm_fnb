import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Building2,
  LayoutDashboard,
  Share2,
  Users,
  ClipboardList,
  PlusCircle,
  Settings as SettingsIcon,
  CornerDownLeft,
} from 'lucide-react'
import { fetchBrandRows } from '../lib/data'
import { StatusBadge, FestBadge } from './ui'

const PAGES = [
  { id: 'p-dash', label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { id: 'p-companies', label: 'All Companies', to: '/admin/companies', icon: Building2 },
  { id: 'p-alloc', label: 'Allocations', to: '/admin/allocations', icon: Share2 },
  { id: 'p-team', label: 'Team', to: '/admin/team', icon: Users },
  { id: 'p-add', label: 'Add Company', to: '/admin/add-company', icon: PlusCircle },
  { id: 'p-progress', label: 'Progress Board', to: '/admin/progress', icon: ClipboardList },
  { id: 'p-settings', label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
]

/**
 * ⌘K / Ctrl+K command palette (admin): jump to any of the ~270 companies by
 * name, or to any page. Companies open their detail (or the master list when
 * not yet allocated). Mounted only while open (the hotkey lives in Layout), so
 * its transient state is always fresh — no reset effects needed.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [brands, setBrands] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Lazy-load the brand list once on open + focus the input.
  useEffect(() => {
    fetchBrandRows()
      .then(setBrands)
      .catch(() => {})
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    return () => clearTimeout(t)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q)).map((p) => ({
      ...p,
      kind: 'page',
    }))
    const companies = (q
      ? brands.filter((b) => b.name.toLowerCase().includes(q))
      : brands
    )
      .slice(0, 8)
      .map((b) => ({ ...b, kind: 'company', id: `c-${b.id}` }))
    return q ? [...companies, ...pages] : [...pages, ...companies]
  }, [query, brands])

  function run(item) {
    onClose()
    if (item.kind === 'page') return navigate(item.to)
    if (item.allocationId) return navigate(`/admin/company/${item.allocationId}`)
    return navigate('/admin/companies')
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) run(results[active])
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-xl overflow-hidden rounded-card shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search companies or jump to a page…"
            className="w-full bg-transparent py-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">
            ESC
          </kbd>
        </div>

        <ul ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted">
              No matches for “{query}”.
            </li>
          )}
          {results.map((item, i) => {
            const Icon = item.kind === 'page' ? item.icon : Building2
            return (
              <li key={item.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    i === active ? 'bg-accent-soft text-ink' : 'text-muted hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className="shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">
                    {item.label || item.name}
                  </span>
                  {item.kind === 'company' && (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <FestBadge fest={item.fest || item.festTag} />
                      <StatusBadge status={item.allocated ? item.status : 'Not Started'} />
                    </span>
                  )}
                  {item.kind === 'page' && (
                    <span className="shrink-0 text-xs text-muted">Page</span>
                  )}
                  {i === active && (
                    <CornerDownLeft size={14} className="shrink-0 text-muted" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
