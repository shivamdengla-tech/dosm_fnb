import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GripVertical } from 'lucide-react'
import { STATUSES } from '../constants'
import { FestBadge, FollowUpBadge, EmptyState } from './ui'
import { ListChecks } from 'lucide-react'

/**
 * Drag-and-drop pipeline board: one column per status. Dragging a card to a
 * column calls `onMove(row, newStatus)` (optimistic update + toast handled by
 * the parent). Only allocated brands appear — unallocated ones have no status
 * to move. Cards stay clickable (→ company detail).
 */
export default function KanbanBoard({ rows, onMove }) {
  const navigate = useNavigate()
  const [dragId, setDragId] = useState(null)
  const [overStatus, setOverStatus] = useState(null)

  const allocated = rows.filter((r) => r.allocated && r.allocationId)
  const byStatus = (label) => allocated.filter((r) => (r.status || 'Not Started') === label)

  if (allocated.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nothing to show on the board"
        hint="Allocate brands to members and the board fills up, one column per pipeline stage."
      />
    )
  }

  function handleDrop(status) {
    const row = allocated.find((r) => r.allocationId === dragId)
    setDragId(null)
    setOverStatus(null)
    if (row && (row.status || 'Not Started') !== status) onMove(row, status)
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-3">
      {STATUSES.map((s) => {
        const items = byStatus(s.label)
        const isOver = overStatus === s.label
        return (
          <div
            key={s.label}
            onDragOver={(e) => {
              e.preventDefault()
              if (overStatus !== s.label) setOverStatus(s.label)
            }}
            onDragLeave={() => setOverStatus((o) => (o === s.label ? null : o))}
            onDrop={() => handleDrop(s.label)}
            className={`flex w-[260px] shrink-0 flex-col rounded-card border bg-white/[0.02] transition-colors ${
              isOver ? 'border-accent bg-accent-soft' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}88` }}
              />
              <span className="text-sm font-semibold text-ink">{s.label}</span>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted">
                {items.length}
              </span>
            </div>

            <div className="flex min-h-[80px] flex-col gap-2 p-2">
              {items.map((r) => (
                <div
                  key={r.allocationId}
                  draggable
                  onDragStart={() => setDragId(r.allocationId)}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverStatus(null)
                  }}
                  onClick={() => navigate(`/admin/company/${r.allocationId}`)}
                  className={`group cursor-pointer rounded-xl border border-border bg-surface-solid/80 p-3 transition-all hover:border-accent/50 hover:shadow-glow ${
                    dragId === r.allocationId ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical
                      size={14}
                      className="mt-0.5 shrink-0 text-muted/50 group-hover:text-muted"
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                      {r.name}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{r.category}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <FestBadge fest={r.fest || r.festTag} />
                    <FollowUpBadge date={r.nextFollowUp} />
                  </div>
                  <p className="mt-2 truncate text-xs text-muted">
                    {r.memberName || 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
