import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Share2,
  CheckCircle2,
  FileSignature,
  CircleDashed,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchBrandRows, fetchRecentCallLogs, callsPerDay } from '../../lib/data'
import { STATUSES, FESTS, FEST_META } from '../../constants'
import { StatTile, Card, CardTitle, Loading, Banner, StatusBadge, EmptyState } from '../../components/ui'
import { HorizontalBar, AreaTrend } from '../../components/charts'
import { Activity } from 'lucide-react'

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function AdminDashboard() {
  const { profile } = useAuth()
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

  const festReadiness = useMemo(
    () =>
      FESTS.map((f) => {
        const inFest = rows.filter((r) => r.allocated && r.fest === f)
        const confirmed = inFest.filter((r) => CONFIRMED_PLUS.includes(r.status)).length
        const total = inFest.length
        return {
          fest: f,
          confirmed,
          total,
          pct: total ? Math.round((confirmed / total) * 100) : 0,
          color: FEST_META[f]?.color || '#6366f1',
        }
      }),
    [rows],
  )

  const leaderboard = useMemo(() => {
    const counts = {}
    rows
      .filter((r) => r.allocated && CONFIRMED_PLUS.includes(r.status) && r.memberName)
      .forEach((r) => {
        counts[r.memberName] = (counts[r.memberName] || 0) + 1
      })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }, [rows])

  const recent = useMemo(() => {
    const byAlloc = {}
    rows.forEach((r) => {
      if (r.allocationId) byAlloc[r.allocationId] = r
    })
    const seen = new Set()
    return [...logs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter((l) => {
        if (!l.allocation_id || seen.has(l.allocation_id)) return false
        seen.add(l.allocation_id)
        return true
      })
      .slice(0, 8)
      .map((l) => ({ ...l, brand: byAlloc[l.allocation_id] }))
      .filter((l) => l.brand)
  }, [logs, rows])

  const callsData = useMemo(() => callsPerDay(logs, 14), [logs])

  if (loading) return <Loading />

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      {error && <Banner kind="error">{error}</Banner>}

      {/* Row 1 — Greeting */}
      <Card className="greeting-gradient relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              {greetingWord()}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-indigo-100/80">
              Here's your FnB pipeline overview
            </p>
          </div>
          <span className="text-sm font-medium text-indigo-100/70">{today}</span>
        </div>
      </Card>

      {/* Row 2 — Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Total Companies" value={stats.total} icon={Building2} glow="#6366f1" />
        <StatTile label="Allocated" value={stats.allocated} icon={Share2} glow="#3b82f6" />
        <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle2} glow="#10b981" />
        <StatTile label="MOUs Signed" value={stats.mouSigned} icon={FileSignature} glow="#8b5cf6" />
        <StatTile label="Untouched" value={stats.untouched} icon={CircleDashed} glow="#6b7280" />
      </div>

      {/* Row 3 — Pipeline funnel + Fest readiness */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Pipeline funnel</CardTitle>
          <HorizontalBar data={pipelineData} colored height={340} />
        </Card>

        <Card className="p-5">
          <CardTitle>Fest readiness</CardTitle>
          <div className="space-y-5 py-2">
            {festReadiness.map((f) => (
              <div key={f.fest}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">
                    {f.fest}{' '}
                    <span className="font-normal text-muted">{FEST_META[f.fest]?.sub}</span>
                  </span>
                  <span className="text-muted">
                    {f.confirmed}/{f.total} · <span className="font-bold text-ink">{f.pct}%</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${f.pct}%`,
                      background: `linear-gradient(90deg, ${f.color}, #8b5cf6)`,
                      boxShadow: `0 0 12px ${f.color}aa`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 4 — Leaderboard + Recently updated */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Team leaderboard</CardTitle>
          <HorizontalBar data={leaderboard} height={320} />
        </Card>

        <Card className="p-5">
          <CardTitle>Recently updated</CardTitle>
          {recent.length === 0 ? (
            <EmptyState icon={Activity} title="No recent activity" />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/admin/company/${r.allocation_id}`}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {r.brand.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {r.brand.memberName || 'Unassigned'} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 5 — Calls per day */}
      <Card className="p-5">
        <CardTitle>Calls logged per day — last 14 days</CardTitle>
        <AreaTrend data={callsData} height={300} />
      </Card>
    </div>
  )
}
