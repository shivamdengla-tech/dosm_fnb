import { useState } from 'react'
import { Save, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  PageHeader,
  Card,
  CardTitle,
  Banner,
  Button,
  Field,
  Input,
} from '../../components/ui'

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  )
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState(null)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  async function saveName(e) {
    e.preventDefault()
    setNameMsg(null)
    if (!fullName.trim()) return setNameMsg({ kind: 'error', text: 'Name cannot be empty.' })
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)
    setSavingName(false)
    if (error) return setNameMsg({ kind: 'error', text: error.message })
    await refreshProfile()
    setNameMsg({ kind: 'success', text: 'Profile updated.' })
    toast.success('Profile updated')
  }

  async function savePw(e) {
    e.preventDefault()
    setPwMsg(null)
    if (pw.length < 6) return setPwMsg({ kind: 'error', text: 'Password must be ≥ 6 characters.' })
    if (pw !== pw2) return setPwMsg({ kind: 'error', text: 'Passwords do not match.' })
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSavingPw(false)
    if (error) return setPwMsg({ kind: 'error', text: error.message })
    setPw('')
    setPw2('')
    setPwMsg({ kind: 'success', text: 'Password changed.' })
    toast.success('Password changed')
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and password" />

      {/* Identity strip — anchors the page so the forms don't float in black */}
      <Card className="mb-6 max-w-4xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl gradient-accent text-lg font-bold text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]">
            {initials(profile?.full_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink">
              {profile?.full_name || 'User'}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} /> {user?.email}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <ShieldCheck size={14} /> {profile?.role}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <CardTitle>Profile</CardTitle>
          <form onSubmit={saveName} className="space-y-4">
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={user?.email || ''} disabled />
            </Field>
            <Field label="Role">
              <Input value={profile?.role || ''} disabled className="capitalize" />
            </Field>
            {nameMsg && <Banner kind={nameMsg.kind}>{nameMsg.text}</Banner>}
            <Button type="submit" disabled={savingName}>
              <Save size={18} /> {savingName ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <CardTitle>Change password</CardTitle>
          <form onSubmit={savePw} className="space-y-4">
            <Field label="New password">
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            {pwMsg && <Banner kind={pwMsg.kind}>{pwMsg.text}</Banner>}
            <Button type="submit" disabled={savingPw}>
              <KeyRound size={18} /> {savingPw ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
