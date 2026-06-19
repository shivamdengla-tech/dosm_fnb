import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Phone,
  CheckCircle2,
  Clock,
  PhoneCall,
  ListChecks,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchMyQueue, fetchRecentCallLogs, callsPerDay, buildCallQueue } from '../../lib/data'
import { STATUSES } from '../../constants'
import {
  StatTile,
  Card,
  CardTitle,
  Banner,
  Button,
  StatusBadge,
  FestBadge,
  FollowUpBadge,
  ContactLinks,
  EmptyState,
  Skeleton,
  SkeletonStats,
  SkeletonChart,
} from '../../components/ui'
import { Donut, AreaTrend } from '../../components/charts'
import LogCallSheet from '../../components/LogCallSheet'

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const REASON_COLOR = { 1: '#ef4444', 2: '#f59e0b', 3: '#6b7280' }

export default function MemberDashboard() {
  const { user, profile } = useAuth()
  const [mine, setMine] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sheetFor, setSheetFor] = useState(null)

  const load = useCallback(() => {
    if (!user) return
    return Promise.all([
      fetchMyQueue(user.id),
      fetchRecentCallLogs({ memberId: user.id, days: 14 }),
    ])
      .then(([a, l]) => {
        setMine(a)
        setLogs(l)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Optimistically reflect a freshly-logged call in the queue.
  const applyLogged = useCallback((allocationId, { status, nextFollowUp }) => {
    setMine((rows) =>
      rows.map((r) =>
        r.allocationId === allocationId
          ? {
              ...r,
              status,
              nextFollowUp: nextFollowUp || null,
              lastCallAt: new Date().toISOString(),
              callCount: r.callCount + 1,
            }
          : r,
      ),
    )
  }, [])

  const stats = useMemo(() => {
    const called = mine.filter((r) => r.status !== 'Not Started')
    return {
      total: mine.length,
      called: called.length,
      confirmed: mine.filter((r) => CONFIRMED_PLUS.includes(r.status)).length,
      pending: mine.filter(
        (r) => !CONFIRMED_PLUS.includes(r.status) && r.status !== 'Denied',
      ).length,
    }
  }, [mine])

  const queue = useMemo(() => buildCallQueue(mine), [mine])

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

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="greeting-gradient p-5 sm:p-6">
          <Skeleton className="h-7 w-56 bg-white/10" />
          <Skeleton className="mt-2 h-4 w-44 bg-white/10" />
        </Card>
        <SkeletonStats count={4} />
        <SkeletonChart height={260} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonChart height={260} />
          <SkeletonChart height={260} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <Banner kind="error">{error}</Banner>}

      {/* Greeting (compact) */}
      <Card className="greeting-gradient relative overflow-hidden p-5 sm:p-6">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          {greetingWord()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-indigo-100/80">
          {queue.length
            ? `${queue.length} ${queue.length === 1 ? 'brand needs' : 'brands need'} your attention today`
            : 'You’re all caught up — nice work'}
        </p>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="My Brands" value={stats.total} icon={Briefcase} glow="#6366f1" />
        <StatTile label="Called" value={stats.called} icon={Phone} glow="#3b82f6" />
        <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle2} glow="#10b981" />
        <StatTile label="Pending" value={stats.pending} icon={Clock} glow="#f59e0b" />
      </div>

      {/* Up Next queue — the screen a member lives on */}
      <Card className="p-5">
        <CardTitle
          action={
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-indigo-200">
              {queue.length}
            </span>
          }
        >
          <span className="inline-flex items-center gap-2">
            <ListChecks size={16} className="text-accent" /> Up Next
          </span>
        </CardTitle>

        {queue.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing pending 🎉"
            hint="No overdue follow-ups, nothing going cold, and every brand has been started. Check back after your next round of calls."
          />
        ) : (
          <ul className="-mx-2 divide-y divide-border/60">
            {queue.slice(0, 12).map((r) => (
              <li
                key={r.allocationId}
                className="flex flex-col gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center"
              >
                <span
                  className="hidden h-9 w-1 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: REASON_COLOR[r.priority] }}
                  aria-hidden="true"
                />
                <Link
                  to={`/dashboard/company/${r.allocationId}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{r.name}</p>
                    <FollowUpBadge date={r.nextFollowUp} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <FestBadge fest={r.fest || r.festTag} />
                    <span className="text-xs text-muted">{r.category}</span>
                  </div>
                  <p
                    className="mt-1 text-xs font-medium"
                    style={{ color: REASON_COLOR[r.priority] }}
                  >
                    {r.reason}
                  </p>
                </Link>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <ContactLinks
                    phone={r.pocNumber}
                    email={r.pocEmail}
                    name={r.pocName}
                  />
                  <Button onClick={() => setSheetFor(r)} className="shrink-0">
                    <PhoneCall size={16} /> Log call
                  </Button>
                </div>
              </li>
            ))}
            {queue.length > 12 && (
              <li className="px-2 pt-3">
                <Link
                  to="/dashboard/companies"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  View all {queue.length} in My Companies <ChevronRight size={15} />
                </Link>
              </li>
            )}
          </ul>
        )}
      </Card>

      {/* Secondary insight — status mix + calls per day */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>My brands by status</CardTitle>
          <Donut data={statusData} height={260} />
        </Card>
        <Card className="p-5">
          <CardTitle>My calls per day — last 14 days</CardTitle>
          <AreaTrend data={callsData} height={260} />
        </Card>
      </div>

      <LogCallSheet
        key={sheetFor ? `${sheetFor.allocationId}:${sheetFor.callCount}` : 'none'}
        open={Boolean(sheetFor)}
        allocation={sheetFor}
        onClose={() => setSheetFor(null)}
        onLogged={(update) => sheetFor && applyLogged(sheetFor.allocationId, update)}
        onError={load}
      />
    </div>
  )
}
