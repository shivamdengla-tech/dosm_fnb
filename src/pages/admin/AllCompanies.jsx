import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { fetchBrandRows } from '../../lib/data'
import { CATEGORIES, STATUS_LABELS } from '../../constants'
import {
  PageHeader,
  Loading,
  Banner,
  Button,
  Modal,
  Field,
  Input,
  Select,
  StatusBadge,
  FestBadge,
} from '../../components/ui'
import DataTable from '../../components/DataTable'

const FEST_TAGS = ['All', 'Spree']
const blankForm = { name: '', category: CATEGORIES[0], fest_tag: 'All' }

export default function AllCompanies() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // brand id or null (= add)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(() => {
    fetchBrandRows()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  function openAdd() {
    setEditing(null)
    setForm(blankForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row.id)
    setForm({ name: row.name, category: row.category, fest_tag: row.festTag || 'All' })
    setFormError('')
    setModalOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required.')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.category,
      fest_tag: form.fest_tag,
    }
    const { error } = editing
      ? await supabase.from('brands').update(payload).eq('id', editing)
      : await supabase.from('brands').insert(payload)
    setSaving(false)
    if (error) return setFormError(error.message)
    setModalOpen(false)
    load()
  }

  async function remove(row) {
    if (
      !window.confirm(
        `Delete "${row.name}"? This also removes its allocation and call history.`,
      )
    )
      return
    setError('')
    // Tear down dependents first in case the schema lacks ON DELETE CASCADE.
    if (row.allocationId) {
      await supabase.from('call_logs').delete().eq('allocation_id', row.allocationId)
      await supabase.from('allocations').delete().eq('brand_id', row.id)
    }
    const { error } = await supabase.from('brands').delete().eq('id', row.id)
    if (error) return setError(error.message)
    load()
  }

  if (loading) return <Loading />

  const memberOptions = [
    ...new Set(rows.map((r) => r.memberName).filter(Boolean)),
  ].sort()

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (r) =>
        r.allocated ? (
          <button
            onClick={() => navigate(`/admin/company/${r.allocationId}`)}
            className="font-semibold text-ink transition-colors hover:text-indigo-300 hover:underline"
            title="Open company detail"
          >
            {r.name}
          </button>
        ) : (
          <span className="font-semibold text-ink">{r.name}</span>
        ),
    },
    { key: 'category', header: 'Category', className: 'text-muted' },
    {
      key: 'fest',
      header: 'Fest',
      render: (r) => <FestBadge fest={r.fest || r.festTag} />,
    },
    {
      key: 'member',
      header: 'Assigned to',
      render: (r) =>
        r.memberName ? (
          <span className="text-ink">{r.memberName}</span>
        ) : (
          <span className="text-muted">— Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.allocated ? r.status : 'Not Started'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(r)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => remove(r)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-500/15 hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  const filters = [
    {
      key: 'category',
      label: 'Category',
      options: CATEGORIES,
      value: (r) => r.category,
    },
    {
      key: 'fest',
      label: 'Fest',
      options: ['Waves', 'Quark', 'Spree', 'All'],
      value: (r) => r.fest || r.festTag,
    },
    {
      key: 'status',
      label: 'Status',
      options: STATUS_LABELS,
      value: (r) => (r.allocated ? r.status : 'Not Started'),
    },
    {
      key: 'member',
      label: 'Member',
      options: [...memberOptions, 'Unassigned'],
      value: (r) => r.memberName || 'Unassigned',
    },
  ]

  return (
    <div>
      <PageHeader title="All Companies" subtitle={`${rows.length} brands in the master list`}>
        <Button onClick={openAdd}>
          <Plus size={18} /> Add Company
        </Button>
      </PageHeader>

      {error && <Banner kind="error">{error}</Banner>}

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'category', 'memberName']}
        filters={filters}
        searchPlaceholder="Search companies…"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit company' : 'Add company'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Company name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paper Boat"
              autoFocus
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fest tag">
            <Select
              value={form.fest_tag}
              onChange={(e) => setForm({ ...form, fest_tag: e.target.value })}
            >
              {FEST_TAGS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          {formError && <Banner kind="error">{formError}</Banner>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
