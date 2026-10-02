import { Navigate, Route, Routes } from 'react-router-dom'
import HomeRoute from '@/layout/Home'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/StudentsPage'
import TermsPage from '@/pages/TermsPage'
import SurveysPage from '@/pages/SurveysPage'
import SchedulePage from '@/pages/SchedulePage'
import ProfilePage from '@/pages/ProfilePage'
import UsersPage from '@/pages/UsersPage'
import RolesPage from '@/pages/RolesPage'
import AjustesPage from '@/pages/AjustesPage'

/**
 * EduSense routes: `/login` is the public home; the rest are protected by
 * session and use the shell with the lateral sidebar. Pages are thin: they
 * only assemble the module views.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<HomeRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/surveys" element={<SurveysPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings/users" element={<UsersPage />} />
        <Route path="/settings/roles" element={<RolesPage />} />
        <Route path="/settings/ajustes" element={<AjustesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App