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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { EmptyState } from './ui'
import { BarChart3 } from 'lucide-react'

const ACCENT = '#7c3aed'
const AXIS = '#9ca3af'
const GRID = '#ececf1'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #ececf1',
  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
  fontSize: 12,
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
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3effe' }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || ACCENT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Donut with per-slice colours and a legend. */
export function Donut({ data, height = 280 }) {
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
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Time-series line (e.g. calls per day). */
export function TrendLine({ data, color = ACCENT, height = 280 }) {
  if (!data?.length) return <NoData />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -16 }}>
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
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
