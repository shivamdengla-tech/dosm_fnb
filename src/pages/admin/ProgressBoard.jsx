import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchBrandRows } from '../../lib/data'
import { CATEGORIES, STATUS_LABELS, FESTS } from '../../constants'
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

export default function ProgressBoard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      render: (r) =>
        r.memberName || <span className="text-muted">— Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.allocated ? r.status : 'Not Started'} />,
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
      key: 'status',
      label: 'Status',
      options: STATUS_LABELS,
      value: (r) => (r.allocated ? r.status : 'Not Started'),
    },
    {
      key: 'member',
      label: 'Member',
      options: [...memberOptions, 'Unassigned'],
      value: (r) => r.memberName || 'Unassigned',
    },
  ]

  return (
    <div>
      <PageHeader title="Progress Board" subtitle="Live status of every brand across the team" />
      {error && <Banner kind="error">{error}</Banner>}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'category', 'memberName']}
        filters={filters}
        searchPlaceholder="Search the board…"
      />
    </div>
  )
}
