import { Routes, Route, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Share2,
  Users,
  PlusCircle,
  ClipboardList,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Loading } from './components/ui'

import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AllCompanies from './pages/admin/AllCompanies'
import Allocations from './pages/admin/Allocations'
import Team from './pages/admin/Team'
import ProgressBoard from './pages/admin/ProgressBoard'
import MemberDashboard from './pages/member/Dashboard'
import MyCompanies from './pages/member/MyCompanies'
import AddCompany from './pages/shared/AddCompany'
import Settings from './pages/shared/Settings'
import CompanyDetail from './pages/shared/CompanyDetail'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'All Companies', icon: Building2 },
  { to: '/admin/allocations', label: 'Allocations', icon: Share2 },
  { to: '/admin/team', label: 'Team', icon: Users },
  { to: '/admin/add-company', label: 'Add Company', icon: PlusCircle },
  { to: '/admin/progress', label: 'Progress Board', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

const memberNav = [
  { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/companies', label: 'My Companies', icon: Building2 },
  { to: '/dashboard/add-company', label: 'Add Company', icon: PlusCircle },
  { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

/** Send "/" to the right home based on the signed-in role. */
function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen grid place-items-center">
        <Loading />
      </div>
    )
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout navItems={adminNav} />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="companies" element={<AllCompanies />} />
        <Route path="allocations" element={<Allocations />} />
        <Route path="team" element={<Team />} />
        <Route path="add-company" element={<AddCompany />} />
        <Route path="progress" element={<ProgressBoard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="company/:allocationId" element={<CompanyDetail />} />
      </Route>

      {/* Member area */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="member">
            <Layout navItems={memberNav} />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboard />} />
        <Route path="companies" element={<MyCompanies />} />
        <Route path="add-company" element={<AddCompany />} />
        <Route path="settings" element={<Settings />} />
        <Route path="company/:allocationId" element={<CompanyDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
