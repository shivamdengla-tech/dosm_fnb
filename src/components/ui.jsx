import { getStatus, FEST_META } from '../constants'
import { X } from 'lucide-react'

/** Page title + optional subtitle + right-aligned action slot. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Lightweight centered modal. */
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-card bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

/** Inline success / error banner. */
export function Banner({ kind = 'info', children }) {
  if (!children) return null
  const styles = {
    info: 'bg-accent-soft text-accent',
    success: 'bg-green-50 text-green-700',
    error: 'bg-red-50 text-red-600',
  }
  return (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${styles[kind]}`}>
      {children}
    </div>
  )
}

/** White rounded card with subtle shadow — the core surface of the app. */
export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`rounded-card bg-surface border border-border shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Section header used above charts/tables inside a card. */
export function CardTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-sm font-semibold text-ink">{children}</h3>
      {action}
    </div>
  )
}

/** Coloured pill for a pipeline status. */
export function StatusBadge({ status, className = '' }) {
  const s = getStatus(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}
      style={{ backgroundColor: `${s.color}1a`, color: s.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.color }}
      />
      {s.label}
    </span>
  )
}

/** Coloured pill for a fest tag (Waves / Quark / Spree / All). */
export function FestBadge({ fest, className = '' }) {
  const meta = FEST_META[fest] || FEST_META.All
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}
      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

/** Big-number stat tile for dashboards. */
export function StatTile({ label, value, icon: Icon, accent = false }) {
  return (
    <Card className="p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-2 text-3xl font-extrabold text-ink tabular-nums">
          {value}
        </p>
      </div>
      {Icon && (
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            accent ? 'bg-accent text-white' : 'bg-accent-soft text-accent'
          }`}
        >
          <Icon size={20} />
        </span>
      )}
    </Card>
  )
}

/** Centered loading state. */
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-20 text-muted">
      <span className="h-5 w-5 mr-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  )
}

/** Empty-state block. */
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent mb-3">
          <Icon size={22} />
        </span>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted max-w-sm">{hint}</p>}
    </div>
  )
}

/** Primary / secondary button. */
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-accent-soft text-accent hover:bg-violet-100',
    ghost: 'text-muted hover:bg-black/5',
    outline: 'border border-border bg-surface text-ink hover:bg-black/[0.03]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** Text / select field wrapper with a label. */
export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </span>
      )}
      {children}
    </label>
  )
}

const controlCls =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition'

export function Input({ className = '', ...rest }) {
  return <input className={`${controlCls} ${className}`} {...rest} />
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`${controlCls} ${className}`} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...rest }) {
  return <textarea className={`${controlCls} ${className}`} {...rest} />
}
