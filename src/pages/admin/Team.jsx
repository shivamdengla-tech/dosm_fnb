import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Trash2, Phone, CheckCircle2, Briefcase } from 'lucide-react'
import { supabase, makeIsolatedClient } from '../../lib/supabase'
import { fetchBrandRows, fetchProfiles } from '../../lib/data'
import {
  PageHeader,
  Loading,
  Banner,
  Card,
  Button,
  Modal,
  Field,
  Input,
} from '../../components/ui'

const CONFIRMED_PLUS = ['Confirmed', 'MOU Sent', 'MOU Signed']
const blankForm = { full_name: '', email: '', password: '' }

export default function Team() {
  const [profiles, setProfiles] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(() => {
    Promise.all([fetchProfiles(), fetchBrandRows()])
      .then(([p, r]) => {
        setProfiles(p)
        setRows(r)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  function statsFor(memberId) {
    const mine = rows.filter((r) => r.memberId === memberId)
    return {
      assigned: mine.length,
      called: mine.filter((r) => r.status !== 'Not Started').length,
      confirmed: mine.filter((r) => CONFIRMED_PLUS.includes(r.status)).length,
    }
  }

  async function addMember(e) {
    e.preventDefault()
    setFormError('')
    setNotice('')
    const full_name = form.full_name.trim()
    const email = form.email.trim()
    if (!full_name || !email || form.password.length < 6)
      return setFormError('All fields required; password must be ≥ 6 characters.')

    setSaving(true)
    // Use an isolated client so signing the new user up does NOT replace the
    // admin's current session.
    const iso = makeIsolatedClient()
    const { data, error: signErr } = await iso.auth.signUp({
      email,
      password: form.password,
      options: { data: { full_name } },
    })
    if (signErr) {
      setSaving(false)
      return setFormError(signErr.message)
    }
    const newId = data.user?.id
    if (!newId) {
      setSaving(false)
      return setFormError('Sign-up did not return a user id.')
    }

    // Create / complete their profile row (upsert covers a DB trigger that may
    // have already inserted one on auth.users creation).
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert({ id: newId, full_name, role: 'member' })
    setSaving(false)
    if (profErr) {
      return setFormError(
        `Auth user created, but writing the profile failed: ${profErr.message}. ` +
          `Ensure an RLS policy lets admins insert into profiles.`,
      )
    }

    setOpen(false)
    setForm(blankForm)
    setNotice(
      `${full_name} added. If email confirmation is enabled in Supabase, they must confirm before first login.`,
    )
    load()
  }

  async function removeMember(p) {
    if (
      !window.confirm(
        `Remove ${p.full_name}? Their allocations are unassigned and their profile is deleted. ` +
          `(The auth login must be deleted from the Supabase dashboard.)`,
      )
    )
      return
    setError('')
    // Free up their brands first.
    const mine = rows.filter((r) => r.memberId === p.id && r.allocationId)
    for (const r of mine) {
      await supabase.from('call_logs').delete().eq('allocation_id', r.allocationId)
      await supabase.from('allocations').delete().eq('id', r.allocationId)
    }
    const { error } = await supabase.from('profiles').delete().eq('id', p.id)
    if (error) return setError(error.message)
    load()
  }

  if (loading) return <Loading />

  const members = profiles.filter((p) => p.role === 'member')
  const admins = profiles.filter((p) => p.role === 'admin')

  return (
    <div>
      <PageHeader title="Team" subtitle={`${members.length} members · ${admins.length} admin`}>
        <Button onClick={() => { setForm(blankForm); setFormError(''); setOpen(true) }}>
          <UserPlus size={18} /> Add member
        </Button>
      </PageHeader>

      {error && <Banner kind="error">{error}</Banner>}
      {notice && <Banner kind="success">{notice}</Banner>}

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((p) => {
          const s = statsFor(p.id)
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full gradient-accent text-sm font-bold text-white shadow-[0_0_14px_rgba(99,102,241,0.4)]">
                    {p.full_name?.split(' ').slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{p.full_name}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium capitalize text-indigo-300">
                      {p.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeMember(p)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-500/15 hover:text-red-400"
                  title="Remove member"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat icon={Briefcase} label="Assigned" value={s.assigned} />
                <Stat icon={Phone} label="Called" value={s.called} />
                <Stat icon={CheckCircle2} label="Confirmed" value={s.confirmed} />
              </div>
            </Card>
          )
        })}
      </div>

      {members.length === 0 && (
        <Banner kind="info">No members yet — add your first caller.</Banner>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add team member">
        <form onSubmit={addMember} className="space-y-4">
          <Field label="Full name">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Aarav Sharma"
              autoFocus
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="aarav@bitsgoa.ac.in"
            />
          </Field>
          <Field label="Temporary password">
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="≥ 6 characters — share with the member"
            />
          </Field>
          {formError && <Banner kind="error">{formError}</Banner>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/5 py-3">
      <Icon size={16} className="mx-auto mb-1 text-accent" />
      <p className="text-lg font-bold text-ink tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
