import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { EmptyState } from './ui'
import { BarChart3, GitBranch } from 'lucide-react'

const ACCENT = '#6366f1'
const AXIS = '#64748b'
const GRID = 'rgba(255,255,255,0.06)'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(17,24,39,0.95)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 0 24px rgba(99,102,241,0.25)',
  fontSize: 12,
  color: '#f9fafb',
}

function NoData() {
  return <EmptyState icon={BarChart3} title="No data yet" />
}

/** Vertical bars; each datum may carry its own `color`. */
export function CategoricalBar({ data, dataKey = 'count', height = 280 }) {
  if (!data?.length) return <NoData />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: AXIS }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={70}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || ACCENT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Horizontal bars. Pass `colored` to use each datum's own `color`
 * (e.g. status funnel); otherwise bars use the indigo gradient (leaderboard).
 */
export function HorizontalBar({ data, height = 280, colored = false }) {
  if (!data?.length) return <NoData />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <defs>
          <linearGradient id="barIndigo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
          {data.map((d, i) => (
            <Cell key={i} fill={colored ? d.color || ACCENT : 'url(#barIndigo)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Pipeline as a single labelled, segmented bar + a full legend with counts.
 * Replaces the degenerate horizontal funnel when most brands are "Not Started":
 * every status is always readable in the legend (label + colour + count), and
 * non-zero segments get a minimum width so none become invisible slivers.
 *
 * data: [{ name, count, color }]
 */
export function PipelineBar({ data, emptyHint }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Pipeline is empty"
        hint={emptyHint || 'Your pipeline fills in as the team logs calls.'}
      />
    )
  }
  const segments = data.filter((d) => d.count > 0)
  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
        {segments.map((d) => {
          const pct = (d.count / total) * 100
          return (
            <div
              key={d.name}
              className="flex items-center justify-center text-[10px] font-bold text-white/95 transition-all duration-500"
              style={{
                width: `${pct}%`,
                minWidth: 22,
                backgroundColor: d.color,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.15)`,
              }}
              title={`${d.name}: ${d.count} (${Math.round(pct)}%)`}
            >
              {pct >= 8 ? d.count : ''}
            </div>
          )
        })}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {data.map((d) => {
          const pct = total ? Math.round((d.count / total) * 100) : 0
          return (
            <li key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}88` }}
              />
              <span className="min-w-0 flex-1 truncate text-muted">{d.name}</span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{d.count}</span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">
                {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Donut with per-slice colours and a wrapping legend. */
export function Donut({ data, height = 280, legend = true }) {
  if (!data?.length || data.every((d) => !d.value)) return <NoData />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || ACCENT} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        {legend && (
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#cbd5e1' }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Filled area trend (calls per day) with indigo→purple gradient + glow line. */
export function AreaTrend({ data, height = 280 }) {
  if (!data?.length) return <NoData />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 14, bottom: 4, left: -16 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(99,102,241,0.4)' }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#818cf8"
          strokeWidth={2.5}
          fill="url(#areaFill)"
          dot={false}
          activeDot={{ r: 5, fill: '#a5b4fc' }}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(99,102,241,0.5))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Circular progress ring with a gradient stroke and centred %. */
export function CompletionRing({ value = 0, size = 190, label }) {
  const stroke = 16
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 700ms ease',
              filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-ink tabular-nums">{value}%</span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm text-muted">{label}</p>}
    </div>
  )
}
