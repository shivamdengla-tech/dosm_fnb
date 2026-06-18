import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchMyAllocations } from '../../lib/data'
import {
  PageHeader,
  Loading,
  Banner,
  Card,
  StatusBadge,
  FestBadge,
  EmptyState,
} from '../../components/ui'

export default function MyCompanies() {
  const { user } = useAuth()
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchMyAllocations(user.id)
      .then(setMine)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const grouped = useMemo(() => {
    const g = {}
    for (const b of mine) {
      ;(g[b.category] ||= []).push(b)
    }
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]))
  }, [mine])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="My Companies"
        subtitle={`${mine.length} brands assigned to you`}
      />
      {error && <Banner kind="error">{error}</Banner>}

      {mine.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Building2}
            title="No brands yet"
            hint="Once an admin allocates brands to you — or you add one — they'll show up here grouped by category."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, brands]) => (
            <section key={category}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
                  {category}
                </h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted">
                  {brands.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {brands.map((b) => (
                  <Link key={b.allocationId} to={`/dashboard/company/${b.allocationId}`}>
                    <Card className="group p-5 hover:-translate-y-0.5 hover:shadow-glow">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-ink">{b.name}</h3>
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <FestBadge fest={b.fest || b.festTag} />
                        <StatusBadge status={b.status} />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
