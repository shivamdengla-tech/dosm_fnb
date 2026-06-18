import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fetchBrandRows } from '../../lib/data'
import { CATEGORIES, STATUSES, FESTS } from '../../constants'
import {
  PageHeader,
  Loading,
  Banner,
  StatusBadge,
  FestBadge,
} from '../../components/ui'
import DataTable from '../../components/DataTable'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const effectiveStatus = (r) => (r.allocated ? r.status : 'Not Started')

export default function ProgressBoard() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const [brandRows, { data: logs, error: logErr }] = await Promise.all([
          fetchBrandRows(),
          supabase
            .from('call_logs')
            .select('allocation_id, created_at')
            .order('created_at', { ascending: false }),
        ])
        if (logErr) throw logErr
        // First seen per allocation_id is the latest (logs are desc-ordered).
        const lastUpdated = {}
        for (const l of logs || []) {
          if (!(l.allocation_id in lastUpdated)) lastUpdated[l.allocation_id] = l.created_at
        }
        setRows(
          brandRows.map((r) => ({
            ...r,
            lastUpdated: r.allocationId ? lastUpdated[r.allocationId] || null : null,
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

  if (loading) return <Loading />

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
      <PageHeader title="Progress Board" subtitle="Live status of every brand across the team" />
      {error && <Banner kind="error">{error}</Banner>}

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
        rows={shown}
        searchKeys={['name', 'category', 'memberName']}
        filters={filters}
        searchPlaceholder="Search the board…"
        onRowClick={(r) => r.allocationId && navigate(`/admin/company/${r.allocationId}`)}
      />
    </div>
  )
}
