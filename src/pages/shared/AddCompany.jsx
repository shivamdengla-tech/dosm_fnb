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
} from '../../components/ui'

const FEST_TAGS = ['All', 'Spree']

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

  const spreeLocked = isSpreeOnly(category)
  // Keep the member's pursued fest valid for Spree-only categories.
  const effectiveFest = spreeLocked ? 'Spree' : fest

  async function submit(e) {
    e.preventDefault()
    setError('')
    setDone('')
    if (!name.trim()) return setError('Company name is required.')
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
        <form onSubmit={submit} className="space-y-4">
          <Field label="Company name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yoga Bar"
              autoFocus
            />
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
    </div>
  )
}
