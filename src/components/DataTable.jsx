import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card, EmptyState, Select } from './ui'
import { Inbox } from 'lucide-react'

/**
 * Searchable + multi-filterable table.
 *
 * columns: [{ key, header, render?(row), className, thClassName }]
 * rows:    array of row objects
 * searchKeys: keys whose string values are matched against the search box
 * filters: [{ key, label, options: [string], value(row) }]
 *          renders a <Select> per filter; "All" = no constraint
 * onRowClick(row): optional
 */
export default function DataTable({
  columns,
  rows,
  searchKeys = [],
  filters = [],
  onRowClick,
  searchPlaceholder = 'Search…',
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState({}) // { filterKey: value }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (q) {
        const hit = searchKeys.some((k) =>
          String(row[k] ?? '')
            .toLowerCase()
            .includes(q),
        )
        if (!hit) return false
      }
      for (const f of filters) {
        const sel = active[f.key]
        if (sel && sel !== '__all__' && f.value(row) !== sel) return false
      }
      return true
    })
  }, [rows, query, active, searchKeys, filters])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring transition-all duration-200"
          />
        </div>
        {filters.map((f) => (
          <Select
            key={f.key}
            value={active[f.key] || '__all__'}
            onChange={(e) =>
              setActive((a) => ({ ...a, [f.key]: e.target.value }))
            }
            className="sm:w-auto sm:min-w-[150px]"
          >
            <option value="__all__">{f.label}: All</option>
            {f.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${
                      c.thClassName || ''
                    }`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-border/60 transition-colors last:border-0 even:bg-white/[0.02] ${
                    onRowClick ? 'cursor-pointer hover:bg-accent-soft' : ''
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 align-middle ${c.className || ''}`}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Nothing matches"
            hint="Try clearing the search or filters."
          />
        )}
      </Card>

      <p className="text-xs text-muted">
        Showing {filtered.length} of {rows.length}
      </p>
    </div>
  )
}
