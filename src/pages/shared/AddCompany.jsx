import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CATEGORIES, FESTS, isSpreeOnly, DEFAULT_STATUS } from '../../constants'
import {
  PageHeader,
  Card,
  Banner,
  Button,
  Field,
  Input,
  Select,
  Modal,
} from '../../components/ui'

const FEST_TAGS = ['All', 'Spree']
const NAME_RE = /^[A-Za-z0-9 &-]+$/

export default function AddCompany() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [festTag, setFestTag] = useState('All')
  const [fest, setFest] = useState('Waves') // member's pursued fest
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const spreeLocked = isSpreeOnly(category)
  // Keep the member's pursued fest valid for Spree-only categories.
  const effectiveFest = spreeLocked ? 'Spree' : fest

  function validate() {
    const trimmed = name.trim()
    if (trimmed.length < 3) return 'Name must be at least 3 characters.'
    if (!NAME_RE.test(trimmed))
      return 'Name may only contain letters, numbers, spaces, & and -.'
    return ''
  }

  // Step 1: validate, then open the confirmation modal.
  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setDone('')
    const v = validate()
    if (v) return setError(v)
    setConfirmOpen(true)
  }

  // Step 2: actually persist after confirmation.
  async function doSubmit() {
    setConfirmOpen(false)
    setSaving(true)

    const { data: brand, error: brandErr } = await supabase
      .from('brands')
      .insert({ name: name.trim(), category, fest_tag: festTag })
      .select('id, name')
      .single()

    if (brandErr) {
      setSaving(false)
      return setError(brandErr.message)
    }

    // Members auto-allocate the new brand to themselves.
    if (!isAdmin) {
      const { data: alloc, error: allocErr } = await supabase
        .from('allocations')
        .insert({
          brand_id: brand.id,
          member_id: user.id,
          fest: effectiveFest,
          status: DEFAULT_STATUS,
        })
        .select('id')
        .single()
      setSaving(false)
      if (allocErr) return setError(allocErr.message)
      return navigate(`/dashboard/company/${alloc.id}`)
    }

    setSaving(false)
    setDone(`"${brand.name}" added to the master list.`)
    setName('')
    setCategory(CATEGORIES[0])
    setFestTag('All')
  }

  return (
    <div>
      <PageHeader
        title="Add Company"
        subtitle={
          isAdmin
            ? 'Adds a brand to the master list (allocate it on the Allocations page).'
            : 'Adds a brand and assigns it to you automatically.'
        }
      />

      <Card className="max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Company name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yoga Bar"
              autoFocus
            />
            <span className="mt-1 block text-xs text-muted">
              Min 3 characters · letters, numbers, spaces, &amp; and - only
            </span>
          </Field>

          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <Field label="Fest tag">
            <Select value={festTag} onChange={(e) => setFestTag(e.target.value)}>
              {FEST_TAGS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>

          {!isAdmin && (
            <Field label="Pursuing for fest">
              <Select
                value={effectiveFest}
                disabled={spreeLocked}
                onChange={(e) => setFest(e.target.value)}
              >
                {FESTS.map((f) => (
                  <option key={f} value={f} disabled={spreeLocked && f !== 'Spree'}>
                    {f}
                  </option>
                ))}
              </Select>
              {spreeLocked && (
                <span className="mt-1 block text-xs text-muted">
                  {category} brands are Spree-only — fest locked to Spree.
                </span>
              )}
            </Field>
          )}

          {error && <Banner kind="error">{error}</Banner>}
          {done && <Banner kind="success">{done}</Banner>}

          <Button type="submit" disabled={saving}>
            <PlusCircle size={18} />
            {saving ? 'Adding…' : 'Add company'}
          </Button>
        </form>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm new company">
        <div className="space-y-3 text-sm">
          <p className="text-muted">Add this company?</p>
          <dl className="space-y-2 rounded-xl border border-border bg-white/[0.03] p-4">
            <Row label="Name" value={name.trim()} />
            <Row label="Category" value={category} />
            <Row label="Fest tag" value={festTag} />
            {!isAdmin && <Row label="Pursuing for" value={effectiveFest} />}
            <Row label="Assignment" value={isAdmin ? 'Master list only' : 'Auto-assigned to you'} />
          </dl>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={doSubmit}>
              Confirm &amp; add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}
