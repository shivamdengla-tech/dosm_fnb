import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Phone, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchMyAllocations, fetchRecentCallLogs, callsPerDay } from '../../lib/data'
import { STATUSES } from '../../constants'
import { PageHeader, StatTile, Card, CardTitle, Loading, Banner } from '../../components/ui'
import { Donut, CategoricalBar } from '../../components/charts'

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']

export default function MemberDashboard() {
  const { user, profile } = useAuth()
  const [mine, setMine] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchMyAllocations(user.id),
      fetchRecentCallLogs({ memberId: user.id, days: 14 }),
    ])
      .then(([a, l]) => {
        setMine(a)
        setLogs(l)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const stats = useMemo(() => {
    const called = mine.filter((r) => r.status !== 'Not Started')
    return {
      total: mine.length,
      called: called.length,
      confirmed: mine.filter((r) => CONFIRMED_PLUS.includes(r.status)).length,
      pending: mine.filter(
        (r) => !CONFIRMED_PLUS.includes(r.status) && r.status !== 'Denied',
      ).length,
      pct: mine.length ? Math.round((called.length / mine.length) * 100) : 0,
    }
  }, [mine])

  const statusData = useMemo(
    () =>
      STATUSES.map((s) => ({
        name: s.label,
        value: mine.filter((r) => r.status === s.label).length,
        color: s.color,
      })).filter((d) => d.value > 0),
    [mine],
  )

  const callsData = useMemo(
    () => callsPerDay(logs, 14).map((d) => ({ name: d.label, count: d.count })),
    [logs],
  )

  if (loading) return <Loading />

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName} 👋`}
        subtitle="Your brand pipeline at a glance"
      />
      {error && <Banner kind="error">{error}</Banner>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="My Brands" value={stats.total} icon={Briefcase} accent />
        <StatTile label="Called" value={stats.called} icon={Phone} />
        <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle2} />
        <StatTile label="Pending" value={stats.pending} icon={Clock} />
      </div>

      <Card className="mt-6 p-5">
        <CardTitle>Contacted</CardTitle>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-ink tabular-nums">{stats.pct}%</span>
        </div>
        <p className="mt-2 text-xs text-muted">
          {stats.called} of {stats.total} brands contacted at least once.
        </p>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>My brands by status</CardTitle>
          <Donut data={statusData} />
        </Card>
        <Card className="p-5">
          <CardTitle>My calls per day — last 14 days</CardTitle>
          <CategoricalBar data={callsData} />
        </Card>
      </div>
    </div>
  )
}
