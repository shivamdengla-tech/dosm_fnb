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
  ChevronRight,
  ArrowLeft,
  Check,
} from 'lucide-react'
import { fetchBrandRows, updateAllocationStatus } from '../lib/data'
import { useToast } from '../contexts/ToastContext'
import { STATUSES } from '../constants'
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
 * ⌘K / Ctrl+K command palette (admin). Two modes:
 *  - search: jump to any of the ~270 companies by name, or to any page.
 *  - status: pick a new pipeline status for an allocated company and persist it
 *    inline (→ / "Status" button enters this mode; ← / Esc backs out).
 * Mounted only while open (the hotkey lives in Layout), so transient state is
 * always fresh — no reset effects needed.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [brands, setBrands] = useState([])
  const [statusFor, setStatusFor] = useState(null) // company being re-statused
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

  // Esc backs out of status mode, otherwise closes the palette.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (statusFor) {
          setStatusFor(null)
          setActive(0)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [statusFor, onClose])

  const results = useMemo(() => {
    if (statusFor) {
      return STATUSES.map((s) => ({
        kind: 'status',
        id: `s-${s.label}`,
        label: s.label,
        status: s.label,
        current: s.label === statusFor.status,
      }))
    }
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
  }, [statusFor, query, brands])

  // Enter status mode for an allocated company (seed selection to current status).
  function enterStatus(company) {
    if (!company?.allocationId) return
    setStatusFor(company)
    const idx = STATUSES.findIndex((s) => s.label === company.status)
    setActive(idx < 0 ? 0 : idx)
  }

  async function applyStatus(status) {
    const company = statusFor
    onClose()
    if (status === company.status) return
    toast.success(`${company.name} → ${status}`)
    try {
      await updateAllocationStatus(company.allocationId, status)
    } catch (e) {
      toast.error(`Couldn't update: ${e.message}`)
    }
  }

  function run(item) {
    if (item.kind === 'status') return applyStatus(item.status)
    if (item.kind === 'page') {
      onClose()
      return navigate(item.to)
    }
    if (item.allocationId) {
      onClose()
      return navigate(`/admin/company/${item.allocationId}`)
    }
    onClose()
    return navigate('/admin/companies')
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'ArrowRight' && !statusFor) {
      const item = results[active]
      if (item?.kind === 'company' && item.allocationId) {
        e.preventDefault()
        enterStatus(item)
      }
    } else if (e.key === 'ArrowLeft' && statusFor) {
      e.preventDefault()
      setStatusFor(null)
      setActive(0)
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
          {statusFor ? (
            <button
              onClick={() => {
                setStatusFor(null)
                setActive(0)
                inputRef.current?.focus()
              }}
              className="shrink-0 text-muted transition-colors hover:text-ink"
              title="Back"
              aria-label="Back to search"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <Search size={18} className="shrink-0 text-muted" />
          )}
          <input
            ref={inputRef}
            value={statusFor ? `Set status · ${statusFor.name}` : query}
            readOnly={Boolean(statusFor)}
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

          {/* Status-mode picker */}
          {statusFor &&
            results.map((item, i) => (
              <li key={item.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    i === active ? 'bg-accent-soft' : 'hover:bg-white/5'
                  }`}
                >
                  <StatusBadge status={item.status} />
                  <span className="flex-1" />
                  {item.current && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Check size={13} /> current
                    </span>
                  )}
                  {i === active && !item.current && (
                    <CornerDownLeft size={14} className="shrink-0 text-muted" />
                  )}
                </button>
              </li>
            ))}

          {/* Search-mode results */}
          {!statusFor &&
            results.map((item, i) => {
              const Icon = item.kind === 'page' ? item.icon : Building2
              const canStatus = item.kind === 'company' && item.allocationId
              return (
                <li key={item.id}>
                  <div
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-1 rounded-xl pr-2 transition-colors ${
                      i === active ? 'bg-accent-soft' : 'hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => run(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm"
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
                    </button>
                    {canStatus ? (
                      <button
                        onClick={() => enterStatus(item)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-white/10 hover:text-ink"
                        title="Set status (→)"
                      >
                        Status <ChevronRight size={13} />
                      </button>
                    ) : (
                      i === active && (
                        <CornerDownLeft size={14} className="mr-1 shrink-0 text-muted" />
                      )
                    )}
                  </div>
                </li>
              )
            })}
        </ul>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={12} /> open
          </span>
          {statusFor ? (
            <span className="inline-flex items-center gap-1">
              <ArrowLeft size={12} /> back
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <ChevronRight size={12} /> set status
            </span>
          )}
          <span className="ml-auto">↑↓ to navigate</span>
        </div>
      </div>
    </div>
  )
}
