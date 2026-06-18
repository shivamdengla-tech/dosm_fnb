import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Share2,
  CheckCircle2,
  FileSignature,
  CircleDashed,
} from 'lucide-react'
import {
  fetchBrandRows,
  fetchRecentCallLogs,
  callsPerDay,
} from '../../lib/data'
import { STATUSES, FEST_META } from '../../constants'
import { PageHeader, StatTile, Card, CardTitle, Loading, Banner } from '../../components/ui'
import { CategoricalBar, Donut, TrendLine } from '../../components/charts'

const PALETTE = [
  '#7c3aed', '#0ea5e9', '#f97316', '#22c55e', '#ef4444',
  '#a855f7', '#f59e0b', '#14b8a6', '#ec4899', '#3b82f6',
  '#84cc16', '#06b6d4', '#d946ef', '#f43f5e', '#8b5cf6',
  '#10b981', '#eab308', '#6366f1', '#fb7185', '#94a3b8',
]

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']

export default function AdminDashboard() {
  const [rows, setRows] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchBrandRows(), fetchRecentCallLogs({ days: 14 })])
      .then(([r, l]) => {
        setRows(r)
        setLogs(l)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const allocated = rows.filter((r) => r.allocated)
    return {
      total: rows.length,
      allocated: allocated.length,
      confirmed: allocated.filter((r) => CONFIRMED_PLUS.includes(r.status)).length,
      mouSigned: allocated.filter((r) => r.status === 'MOU Signed').length,
      untouched: rows.filter((r) => !r.allocated || r.status === 'Not Started').length,
    }
  }, [rows])

  const pipelineData = useMemo(
    () =>
      STATUSES.map((s) => ({
        name: s.label,
        count: rows.filter((r) => (r.allocated ? r.status : 'Not Started') === s.label).length,
        color: s.color,
      })),
    [rows],
  )

  const categoryData = useMemo(() => {
    const counts = {}
    rows.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
  }, [rows])

  const memberData = useMemo(() => {
    const counts = {}
    rows
      .filter((r) => r.allocated && CONFIRMED_PLUS.includes(r.status) && r.memberName)
      .forEach((r) => {
        counts[r.memberName] = (counts[r.memberName] || 0) + 1
      })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, color: '#22c55e' }))
  }, [rows])

  const festData = useMemo(() => {
    const counts = {}
    rows.forEach((r) => {
      const tag = r.festTag || 'All'
      counts[tag] = (counts[tag] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: FEST_META[name]?.color || '#6b7280',
    }))
  }, [rows])

  const callsData = useMemo(() => callsPerDay(logs, 14), [logs])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Pipeline overview across all three fests" />
      {error && <Banner kind="error">{error}</Banner>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Total Companies" value={stats.total} icon={Building2} accent />
        <StatTile label="Allocated" value={stats.allocated} icon={Share2} />
        <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle2} />
        <StatTile label="MOUs Signed" value={stats.mouSigned} icon={FileSignature} />
        <StatTile label="Untouched" value={stats.untouched} icon={CircleDashed} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 lg:col-span-2">
          <CardTitle>Pipeline — companies by status</CardTitle>
          <CategoricalBar data={pipelineData} />
        </Card>

        <Card className="p-5">
          <CardTitle>Companies by category</CardTitle>
          <Donut data={categoryData} />
        </Card>

        <Card className="p-5">
          <CardTitle>Brands by fest tag</CardTitle>
          <Donut data={festData} />
        </Card>

        <Card className="p-5">
          <CardTitle>Confirmed deals per team member</CardTitle>
          <CategoricalBar data={memberData} />
        </Card>

        <Card className="p-5">
          <CardTitle>Call logs per day — last 14 days</CardTitle>
          <TrendLine data={callsData} />
        </Card>
      </div>
    </div>
  )
}
