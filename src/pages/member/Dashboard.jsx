import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Phone, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchMyAllocations, fetchRecentCallLogs, callsPerDay } from '../../lib/data'
import { STATUSES } from '../../constants'
import { StatTile, Card, CardTitle, Loading, Banner } from '../../components/ui'
import { Donut, AreaTrend, CompletionRing } from '../../components/charts'

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

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

  const callsData = useMemo(() => callsPerDay(logs, 14), [logs])

  if (loading) return <Loading />

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {error && <Banner kind="error">{error}</Banner>}

      {/* Row 1 — Greeting (compact) */}
      <Card className="greeting-gradient relative overflow-hidden p-5 sm:p-6">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          {greetingWord()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-indigo-100/80">Your brand pipeline at a glance</p>
      </Card>

      {/* Row 2 — Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="My Brands" value={stats.total} icon={Briefcase} glow="#6366f1" />
        <StatTile label="Called" value={stats.called} icon={Phone} glow="#3b82f6" />
        <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle2} glow="#10b981" />
        <StatTile label="Pending" value={stats.pending} icon={Clock} glow="#f59e0b" />
      </div>

      {/* Row 3 — Completion ring + status donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-5">
          <CardTitle>Contacted</CardTitle>
          <CompletionRing
            value={stats.pct}
            label={`${stats.called} of ${stats.total} brands contacted`}
          />
        </Card>

        <Card className="p-5">
          <CardTitle>My brands by status</CardTitle>
          <Donut data={statusData} />
        </Card>
      </div>

      {/* Row 4 — Calls per day */}
      <Card className="p-5">
        <CardTitle>My calls per day — last 14 days</CardTitle>
        <AreaTrend data={callsData} height={280} />
      </Card>
    </div>
  )
}
