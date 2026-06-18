import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, APP_SUBTITLE, FOOTER_TEXT } from '../constants'
import { Input, Button, Banner } from '../components/ui'

export default function Login() {
  const { session, profile, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in → bounce to the right home.
  if (!loading && session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not sign in. Check your credentials.')
      return
    }
    // RootRedirect resolves the destination once the profile loads.
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg">
      {/* Ambient glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(99,102,241,0.18), transparent 70%), radial-gradient(40% 40% at 80% 100%, rgba(139,92,246,0.14), transparent 70%)',
        }}
      />
      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-accent text-xl font-extrabold text-white shadow-[0_0_30px_rgba(99,102,241,0.6)]">
              D
            </span>
            <h1 className="text-gradient text-2xl font-extrabold">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted">{APP_SUBTITLE}</p>
          </div>

          <div className="glass rounded-card p-6 shadow-glow sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  Email
                </span>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bitsgoa.ac.in"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  Password
                </span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              {error && <Banner kind="error">{error}</Banner>}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <footer className="px-6 py-5 text-center text-xs text-muted">
        {FOOTER_TEXT}
      </footer>
    </div>
  )
}
