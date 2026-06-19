import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table2, KanbanSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  fetchBrandRows,
  followUpState,
  daysSince,
  updateAllocationStatus,
} from '../../lib/data'
import { useToast } from '../../contexts/ToastContext'
import { CATEGORIES, STATUSES, FESTS } from '../../constants'
import {
  PageHeader,
  Banner,
  StatusBadge,
  FestBadge,
  FollowUpBadge,
  SkeletonTable,
} from '../../components/ui'
import DataTable from '../../components/DataTable'
import KanbanBoard from '../../components/KanbanBoard'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const effectiveStatus = (r) => (r.allocated ? r.status : 'Not Started')

/** Follow-up / "going cold" indicator for a board row. */
function FollowUpCell({ row }) {
  const state = followUpState(row.nextFollowUp)
  if (state === 'overdue' || state === 'today') return <FollowUpBadge date={row.nextFollowUp} />
  if (row.allocated && row.status === 'Follow Up' && daysSince(row.lastUpdated) >= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
        Going cold
      </span>
    )
  }
  if (state === 'upcoming') return <FollowUpBadge date={row.nextFollowUp} showUpcoming />
  return <span className="text-muted">—</span>
}

export default function ProgressBoard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState('table') // 'table' | 'board'

  // Optimistic drag-to-change-status on the Kanban board.
  async function moveStatus(row, newStatus) {
    const prev = row.status
    setRows((rs) =>
      rs.map((r) => (r.allocationId === row.allocationId ? { ...r, status: newStatus } : r)),
    )
    toast.success(`${row.name} → ${newStatus}`)
    try {
      await updateAllocationStatus(row.allocationId, newStatus)
    } catch (e) {
      setRows((rs) =>
        rs.map((r) => (r.allocationId === row.allocationId ? { ...r, status: prev } : r)),
      )
      toast.error(`Couldn't update: ${e.message}`)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [brandRows, { data: logs, error: logErr }] = await Promise.all([
          fetchBrandRows(),
          // select('*') keeps this working before the next_follow_up migration.
          supabase
            .from('call_logs')
            .select('*')
            .order('created_at', { ascending: false }),
        ])
        if (logErr) throw logErr
        // First seen per allocation_id is the latest (logs are desc-ordered).
        const lastUpdated = {}
        const nextFollow = {}
        for (const l of logs || []) {
          if (!(l.allocation_id in lastUpdated)) lastUpdated[l.allocation_id] = l.created_at
          if (!(l.allocation_id in nextFollow) && l.next_follow_up)
            nextFollow[l.allocation_id] = l.next_follow_up
        }
        setRows(
          brandRows.map((r) => ({
            ...r,
            lastUpdated: r.allocationId ? lastUpdated[r.allocationId] || null : null,
            nextFollowUp: r.allocationId ? nextFollow[r.allocationId] || null : null,
          })),
        )
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const shown = useMemo(
    () =>
      statusFilter === 'all'
        ? rows
        : rows.filter((r) => effectiveStatus(r) === statusFilter),
    [rows, statusFilter],
  )

  if (loading) {
    return (
      <div>
        <PageHeader title="Progress Board" subtitle="Live status of every brand across the team" />
        <SkeletonTable rows={10} cols={7} />
      </div>
    )
  }

  const memberOptions = [...new Set(rows.map((r) => r.memberName).filter(Boolean))].sort()

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (r) => <span className="font-semibold text-ink">{r.name}</span>,
    },
    { key: 'category', header: 'Category', className: 'text-muted' },
    { key: 'fest', header: 'Fest', render: (r) => <FestBadge fest={r.fest || r.festTag} /> },
    {
      key: 'member',
      header: 'Member',
      render: (r) => r.memberName || <span className="text-muted">— Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={effectiveStatus(r)} />,
    },
    {
      key: 'followUp',
      header: 'Follow-up',
      render: (r) => <FollowUpCell row={r} />,
    },
    {
      key: 'lastUpdated',
      header: 'Last updated',
      className: 'text-muted whitespace-nowrap',
      render: (r) => fmt(r.lastUpdated),
    },
  ]

  const filters = [
    { key: 'category', label: 'Category', options: CATEGORIES, value: (r) => r.category },
    { key: 'fest', label: 'Fest', options: [...FESTS, 'All'], value: (r) => r.fest || r.festTag },
    {
      key: 'member',
      label: 'Member',
      options: [...memberOptions, 'Unassigned'],
      value: (r) => r.memberName || 'Unassigned',
    },
  ]

  // Pills: "All" + each pipeline status.
  const pills = [{ label: 'All', value: 'all', color: '#6366f1' }, ...STATUSES.map((s) => ({ label: s.label, value: s.label, color: s.color }))]

  return (
    <div>
      <PageHeader title="Progress Board" subtitle="Live status of every brand across the team">
        <div className="flex rounded-xl border border-border bg-white/5 p-1">
          <button
            onClick={() => setView('table')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              view === 'table' ? 'bg-accent-soft text-indigo-200' : 'text-muted hover:text-ink'
            }`}
          >
            <Table2 size={15} /> Table
          </button>
          <button
            onClick={() => setView('board')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              view === 'board' ? 'bg-accent-soft text-indigo-200' : 'text-muted hover:text-ink'
            }`}
          >
            <KanbanSquare size={15} /> Board
          </button>
        </div>
      </PageHeader>
      {error && <Banner kind="error">{error}</Banner>}

      {view === 'board' ? (
        <KanbanBoard rows={shown} onMove={moveStatus} />
      ) : (
        <ProgressTable
          rows={shown}
          columns={columns}
          filters={filters}
          pills={pills}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          navigate={navigate}
        />
      )}
    </div>
  )
}

function ProgressTable({ rows, columns, filters, pills, statusFilter, setStatusFilter, navigate }) {
  return (
    <>
      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {pills.map((p) => {
          const active = statusFilter === p.value
          return (
            <button
              key={p.value}
              onClick={() => setStatusFilter(p.value)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200"
              style={
                active
                  ? {
                      backgroundColor: `${p.color}26`,
                      color: p.color,
                      boxShadow: `0 0 14px ${p.color}66`,
                    }
                  : {
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      color: '#9ca3af',
                    }
              }
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'category', 'memberName']}
        filters={filters}
        searchPlaceholder="Search the board…"
        onRowClick={(r) => r.allocationId && navigate(`/admin/company/${r.allocationId}`)}
      />
    </>
  )
}
