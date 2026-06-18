import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, MessageSquarePlus, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { fetchAllocation, fetchCallLogs } from '../../lib/data'
import { STATUS_LABELS, DEFAULT_STATUS, getStatus } from '../../constants'
import {
  Card,
  CardTitle,
  Loading,
  Banner,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  StatusBadge,
  FestBadge,
  EmptyState,
} from '../../components/ui'

const blankDeal = {
  poc_name: '',
  poc_number: '',
  poc_email: '',
  quantity: '',
  skus: '',
  delivery_date: '',
  stall_space: '',
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function CompanyDetail() {
  const { allocationId } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [alloc, setAlloc] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState(DEFAULT_STATUS)
  const [deal, setDeal] = useState(blankDeal)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  const load = useCallback(() => {
    fetchAllocation(allocationId)
      .then(async (a) => {
        if (!a) {
          setError('This company was not found, or you do not have access to it.')
          return
        }
        const l = await fetchCallLogs(allocationId)
        setAlloc(a)
        setLogs(l)
        setStatus(a.status || DEFAULT_STATUS)
        // Pre-fill deal fields from the most recent log so they carry forward.
        const latest = l[0]
        setDeal({
          poc_name: latest?.poc_name || '',
          poc_number: latest?.poc_number || '',
          poc_email: latest?.poc_email || '',
          quantity: latest?.quantity ?? '',
          skus: latest?.skus || '',
          delivery_date: latest?.delivery_date || '',
          stall_space: latest?.stall_space || '',
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [allocationId])

  useEffect(load, [load])

  async function save(e) {
    e.preventDefault()
    setSaveMsg(null)
    setSaving(true)

    const qty =
      deal.quantity === '' || deal.quantity === null
        ? null
        : Number(deal.quantity)

    const logRow = {
      allocation_id: allocationId,
      member_id: alloc.member_id || user.id,
      status,
      notes: note.trim() || null,
      poc_name: deal.poc_name.trim() || null,
      poc_number: deal.poc_number.trim() || null,
      poc_email: deal.poc_email.trim() || null,
      quantity: Number.isNaN(qty) ? null : qty,
      skus: deal.skus.trim() || null,
      delivery_date: deal.delivery_date || null,
      stall_space: deal.stall_space.trim() || null,
    }

    // 1) Append a timestamped snapshot to the call log.
    const { error: logErr } = await supabase.from('call_logs').insert(logRow)
    if (logErr) {
      setSaving(false)
      return setSaveMsg({ kind: 'error', text: logErr.message })
    }
    // 2) Keep the allocation's current status in sync (drives boards/charts).
    const { error: allocErr } = await supabase
      .from('allocations')
      .update({ status })
      .eq('id', allocationId)
    setSaving(false)
    if (allocErr) return setSaveMsg({ kind: 'error', text: allocErr.message })

    setNote('')
    setSaveMsg({ kind: 'success', text: 'Saved — call logged and status updated.' })
    load()
  }

  if (loading) return <Loading />

  if (error || !alloc) {
    return (
      <div>
        <BackButton onClick={() => navigate(-1)} />
        <Card className="p-6">
          <EmptyState icon={Clock} title="Not available" hint={error} />
        </Card>
      </div>
    )
  }

  const brand = alloc.brands

  return (
    <div>
      <BackButton onClick={() => navigate(-1)} />

      {/* Hero */}
      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{brand?.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">{brand?.category}</span>
              <FestBadge fest={alloc.fest || brand?.fest_tag} />
            </div>
            {isAdmin && (
              <p className="mt-2 text-sm text-muted">
                Assigned to{' '}
                <span className="font-medium text-ink">
                  {alloc.profiles?.full_name || 'Unassigned'}
                </span>
              </p>
            )}
          </div>
          <StatusBadge
            status={alloc.status || DEFAULT_STATUS}
            className="px-3 py-1.5 text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Deal form */}
        <Card className="p-6 lg:col-span-3">
          <CardTitle>Deal details</CardTitle>
          <form onSubmit={save} className="space-y-4">
            <Field label="Pipeline status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_LABELS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="POC name">
                <Input
                  value={deal.poc_name}
                  onChange={(e) => setDeal({ ...deal, poc_name: e.target.value })}
                  placeholder="Contact person"
                />
              </Field>
              <Field label="POC number">
                <Input
                  value={deal.poc_number}
                  onChange={(e) => setDeal({ ...deal, poc_number: e.target.value })}
                  placeholder="+91…"
                />
              </Field>
              <Field label="POC email">
                <Input
                  type="email"
                  value={deal.poc_email}
                  onChange={(e) => setDeal({ ...deal, poc_email: e.target.value })}
                  placeholder="name@brand.com"
                />
              </Field>
              <Field label="Stall space">
                <Input
                  value={deal.stall_space}
                  onChange={(e) => setDeal({ ...deal, stall_space: e.target.value })}
                  placeholder="e.g. 10x10 ft"
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  min="0"
                  value={deal.quantity}
                  onChange={(e) => setDeal({ ...deal, quantity: e.target.value })}
                  placeholder="Units committed"
                />
              </Field>
              <Field label="SKUs">
                <Input
                  value={deal.skus}
                  onChange={(e) => setDeal({ ...deal, skus: e.target.value })}
                  placeholder="e.g. 3 flavours"
                />
              </Field>
              <Field label="Delivery date" className="sm:col-span-2">
                <Input
                  type="date"
                  value={deal.delivery_date || ''}
                  onChange={(e) => setDeal({ ...deal, delivery_date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Add a call note">
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened on this call?"
              />
            </Field>

            {saveMsg && <Banner kind={saveMsg.kind}>{saveMsg.text}</Banner>}

            <Button type="submit" disabled={saving}>
              {note.trim() ? <MessageSquarePlus size={18} /> : <Save size={18} />}
              {saving ? 'Saving…' : 'Save & log call'}
            </Button>
          </form>
        </Card>

        {/* History */}
        <Card className="p-6 lg:col-span-2">
          <CardTitle>Call history</CardTitle>
          {logs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No calls logged yet"
              hint="Your first saved note will appear here."
            />
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border-l-2 bg-white/[0.03] p-3"
                  style={{ borderLeftColor: getDot(log.status) }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={log.status} />
                    <span className="text-xs text-muted">{fmtDateTime(log.created_at)}</span>
                  </div>
                  {log.notes && <p className="mt-1.5 text-sm text-ink">{log.notes}</p>}
                  {(log.poc_name || log.quantity || log.delivery_date) && (
                    <p className="mt-1 text-xs text-muted">
                      {[
                        log.poc_name && `POC: ${log.poc_name}`,
                        log.quantity != null && `Qty: ${log.quantity}`,
                        log.delivery_date && `Delivery: ${log.delivery_date}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function getDot(statusLabel) {
  return getStatus(statusLabel).color
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent"
    >
      <ArrowLeft size={16} /> Back
    </button>
  )
}
