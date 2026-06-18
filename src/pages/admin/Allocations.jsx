import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchBrandRows, fetchProfiles } from '../../lib/data'
import { FESTS, isSpreeOnly, SPREE_ONLY_CATEGORIES, DEFAULT_STATUS } from '../../constants'
import {
  PageHeader,
  Loading,
  Banner,
  Card,
  StatusBadge,
  FestBadge,
} from '../../components/ui'
import DataTable from '../../components/DataTable'

export default function Allocations() {
  const [rows, setRows] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    Promise.all([fetchBrandRows(), fetchProfiles()])
      .then(([r, profiles]) => {
        setRows(r)
        setMembers(profiles.filter((p) => p.role === 'member'))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  async function setMember(row, memberId) {
    setError('')
    if (!memberId) {
      // Unassign → remove allocation + its call logs.
      if (row.allocationId) {
        await supabase.from('call_logs').delete().eq('allocation_id', row.allocationId)
        const { error } = await supabase.from('allocations').delete().eq('id', row.allocationId)
        if (error) return setError(error.message)
      }
      return load()
    }
    const fest = row.fest || (isSpreeOnly(row.category) ? 'Spree' : 'Waves')
    const { error } = row.allocationId
      ? await supabase
          .from('allocations')
          .update({ member_id: memberId, fest })
          .eq('id', row.allocationId)
      : await supabase.from('allocations').insert({
          brand_id: row.id,
          member_id: memberId,
          fest,
          status: DEFAULT_STATUS,
        })
    if (error) return setError(error.message)
    load()
  }

  async function setFest(row, fest) {
    setError('')
    if (isSpreeOnly(row.category) && fest !== 'Spree') {
      setError(
        `"${row.category}" brands can only be allocated to the Spree fest.`,
      )
      return
    }
    if (!row.allocationId) return
    const { error } = await supabase
      .from('allocations')
      .update({ fest })
      .eq('id', row.allocationId)
    if (error) return setError(error.message)
    load()
  }

  if (loading) return <Loading />

  const allocated = rows.filter((r) => r.allocated).length
  const selectCls =
    'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring disabled:bg-black/[0.03] disabled:text-muted'

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (r) => (
        <div>
          <div className="font-semibold text-ink">{r.name}</div>
          <div className="text-xs text-muted">{r.category}</div>
        </div>
      ),
    },
    { key: 'tag', header: 'Tag', render: (r) => <FestBadge fest={r.festTag} /> },
    {
      key: 'member',
      header: 'Assigned member',
      render: (r) => (
        <select
          className={selectCls}
          value={r.memberId || ''}
          onChange={(e) => setMember(r, e.target.value)}
        >
          <option value="">— Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'fest',
      header: 'Fest',
      render: (r) => {
        const spreeLocked = isSpreeOnly(r.category)
        return (
          <select
            className={selectCls}
            value={r.fest || ''}
            disabled={!r.allocated}
            onChange={(e) => setFest(r, e.target.value)}
          >
            {!r.fest && <option value="">—</option>}
            {FESTS.map((f) => (
              <option key={f} value={f} disabled={spreeLocked && f !== 'Spree'}>
                {f}
              </option>
            ))}
          </select>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.allocated ? r.status : 'Not Started'} />,
    },
  ]

  const filters = [
    {
      key: 'state',
      label: 'Allocation',
      options: ['Allocated', 'Unassigned'],
      value: (r) => (r.allocated ? 'Allocated' : 'Unassigned'),
    },
    {
      key: 'fest',
      label: 'Fest',
      options: FESTS,
      value: (r) => r.fest || '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Allocations"
        subtitle={`${allocated} of ${rows.length} brands allocated — reassign anytime`}
      />

      {error && <Banner kind="error">{error}</Banner>}

      <Card className="mb-4 flex items-start gap-3 p-4 text-sm">
        <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full bg-accent-soft px-2 text-xs font-semibold text-accent">
          Rule
        </span>
        <p className="text-muted">
          <span className="font-medium text-ink">
            {SPREE_ONLY_CATEGORIES.join(', ')}
          </span>{' '}
          brands can only be allocated to the <span className="font-medium">Spree</span> fest.
          Their fest is locked automatically.
        </p>
      </Card>

      {members.length === 0 && (
        <Banner kind="info">
          No team members yet. Add members on the Team page before allocating.
        </Banner>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'category', 'memberName']}
        filters={filters}
        searchPlaceholder="Search companies to allocate…"
      />
    </div>
  )
}
