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

/** Lightweight centered modal (dark glass). */
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass w-full max-w-lg rounded-card shadow-glow">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-ink"
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
    info: 'bg-accent-soft text-indigo-300 border border-indigo-500/20',
    success: 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20',
    error: 'bg-red-500/12 text-red-300 border border-red-500/20',
  }
  return (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${styles[kind]}`}>
      {children}
    </div>
  )
}

/** Frosted glass card — the core surface of the app. */
export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`glass rounded-card shadow-card transition-all duration-200 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Section header used above charts/tables inside a card. */
export function CardTitle({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-ink">{children}</h3>
      {action}
    </div>
  )
}

/** Coloured glowing pill for a pipeline status. */
export function StatusBadge({ status, className = '' }) {
  const s = getStatus(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}
      style={{
        backgroundColor: `${s.color}24`,
        color: s.color,
        boxShadow: `0 0 12px ${s.color}33`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
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
      style={{ backgroundColor: `${meta.color}24`, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

/**
 * Big-number stat tile with a coloured icon and a bottom glow line.
 * `glow` is a hex colour (defaults to the indigo accent).
 */
export function StatTile({ label, value, icon: Icon, glow = '#6366f1' }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink tabular-nums">{value}</p>
        </div>
        {Icon && (
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: `${glow}26`,
              color: glow,
              boxShadow: `0 0 16px ${glow}40`,
            }}
          >
            <Icon size={20} />
          </span>
        )}
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-[2px]"
        style={{ backgroundColor: glow, boxShadow: `0 0 14px ${glow}` }}
      />
    </Card>
  )
}

/** Centered loading state. */
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-20 text-muted">
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  )
}

/** A single shimmering placeholder block. */
export function Skeleton({ className = '', style }) {
  return <span className={`skeleton block rounded-lg ${className}`} style={style} />
}

/** Row of stat-tile skeletons (matches the StatTile grid). */
export function SkeletonStats({ count = 4 }) {
  const cols = count >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
  return (
    <div className={`grid grid-cols-2 gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-12" />
        </Card>
      ))}
    </div>
  )
}

/** Card-wrapped chart placeholder. */
export function SkeletonChart({ height = 280, title = true }) {
  return (
    <Card className="p-5">
      {title && <Skeleton className="mb-4 h-4 w-40" />}
      <Skeleton className="w-full rounded-xl" style={{ height }} />
    </Card>
  )
}

/** Grid of generic card skeletons. */
export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/** Table skeleton with a faux toolbar — matches DataTable's footprint. */
export function SkeletonTable({ rows = 8, cols = 5 }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1 rounded-xl sm:min-w-[220px]" />
        <Skeleton className="h-10 w-full rounded-xl sm:w-40" />
        <Skeleton className="h-10 w-full rounded-xl sm:w-40" />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-0"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4"
                style={{ width: c === 0 ? '28%' : `${Math.max(10, 18 - c * 2)}%` }}
              />
            ))}
          </div>
        ))}
      </Card>
    </div>
  )
}

/** Empty-state block. */
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={22} />
        </span>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  )
}

/** Buttons — indigo gradient primary, dark variants. */
export function Button({ variant = 'primary', className = '', children, ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
  const variants = {
    primary: 'gradient-accent text-white shadow-card hover:shadow-glow',
    secondary: 'bg-accent-soft text-indigo-200 hover:bg-indigo-500/25',
    ghost: 'text-muted hover:bg-white/5 hover:text-ink',
    outline: 'border border-border bg-white/5 text-ink hover:bg-white/10',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
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
        <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      )}
      {children}
    </label>
  )
}

const controlCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition-all duration-200'

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
