import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './ui'

/**
 * Gate a subtree behind auth (and optionally a role).
 *   <ProtectedRoute role="admin"> … </ProtectedRoute>
 * Unauthenticated → /login. Wrong role → that role's home.
 */
export default function ProtectedRoute({ role, children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loading />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Session exists but profile row missing — treat as not-provisioned.
  if (!profile) {
    return <Navigate to="/login" replace state={{ noProfile: true }} />
  }

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}
