import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  info: '#6366f1',
}

/**
 * Lightweight toast stack. Use `toast.success(msg)` / `toast.error(msg)` /
 * `toast.info(msg)` (or `toast.show(msg, kind)`) anywhere under the provider.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (message, kind = 'success', ttl = 3200) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, message, kind }])
      if (ttl) setTimeout(() => dismiss(id), ttl)
      return id
    },
    [dismiss],
  )

  // Stable API: toast.success(msg) / toast.error(msg) / toast.info(msg).
  const toast = useMemo(
    () => ({
      show: (message, kind = 'success') => push(message, kind),
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:items-end">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind] || Info
          const color = COLORS[t.kind] || COLORS.info
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-surface-solid/95 px-4 py-3 text-sm shadow-glow backdrop-blur-xl toast-in"
            >
              <span
                className="mt-0.5 shrink-0"
                style={{ color, filter: `drop-shadow(0 0 6px ${color}88)` }}
              >
                <Icon size={18} />
              </span>
              <p className="min-w-0 flex-1 font-medium text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-muted transition-colors hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
